# Copyright (C) 2018 Maen Artimy

from ryu.base import app_manager
from ryu.app.wsgi import WSGIApplication
from ryu.controller import dpset
# these are needed for the events
from ryu.controller import ofp_event
from ryu.controller.handler import HANDSHAKE_DISPATCHER
from ryu.controller.handler import CONFIG_DISPATCHER
from ryu.controller.handler import MAIN_DISPATCHER
from ryu.controller.handler import set_ev_cls

from ryu.ofproto import ofproto_v1_3
from ryu.lib import ofctl_v1_3
from ryu import utils

# for packet content
from ryu.lib.packet import packet
from ryu.lib.packet import ethernet
from ryu.lib.packet import ether_types

# for topology discovery
from ryu.topology import event, switches
from ryu.topology.api import get_all_switch, get_all_link, get_all_host

from webapi import WebApi
import os, logging
from logging.handlers import WatchedFileHandler


class FlowManager(app_manager.RyuApp):
    #OFP_VERSIONS = [ofproto_v1_3.OFP_VERSION]

    _CONTEXTS = {'wsgi': WSGIApplication,
                 'dpset': dpset.DPSet}

    port_id = {
        "IN_PORT": 0xfffffff8,
        "TABLE": 0xfffffff9,
        "NORMAL": 0xfffffffa,
        "FLOOD": 0xfffffffb,
        "ALL": 0xfffffffc,
        "CONTROLLER": 0xfffffffd,
        "LOCAL": 0xfffffffe,
        "ANY": 0xffffffff
    }

    logname = 'flwmgr'
    logfile = 'flwmgr.log'

    def __init__(self, *args, **kwargs):
        super(FlowManager, self).__init__(*args, **kwargs)
        wsgi = kwargs['wsgi']
        self.dpset = kwargs['dpset']

        # get this file's path
        dirname = os.path.dirname(__file__)

        self.lists = {}
        self.lists['actions'] = self.read_files(
            'actions', os.path.join(dirname, 'data/actions.txt'))
        self.lists['matches'] = self.read_files(
            'matches', os.path.join(dirname, 'data/matches.txt'))
        self.waiters = {}

        self.ofctl = ofctl_v1_3

        # Data exchanged with WebApi
        wsgi.register(WebApi,
                      {"webctl": self,
                       "dpset": self.dpset,
                       "lists": self.lists,
                       "waiters": self.waiters})

        # Setup logging
        self.logger = self.get_logger(self.logname, self.logfile, 'INFO', 0)

    def get_logger(self, logname, logfile, loglevel, propagate):
        """Create and return a logger object."""
        # TODO: simplify
        logger = logging.getLogger(logname)
        logger_handler = WatchedFileHandler(logfile, mode='w')
        # removed \t%(name)-6s
        log_fmt = '%(asctime)s\t%(levelname)-8s\t%(message)s'
        logger_handler.setFormatter(
            logging.Formatter(log_fmt, '%b %d %H:%M:%S'))
        logger.addHandler(logger_handler)
        logger.propagate = propagate
        logger.setLevel(loglevel)
        return logger

    def get_switches(self):
        """Return switches."""
        return self.dpset.get_all()

    def read_logs(self):
        items = []
        with open(self.logfile, 'r') as my_file:
            while True:
                line = my_file.readline()
                if not line:
                    break
                lst = line.split('\t')
                items.append(lst)
                #items.append(line)
        return items

    def read_files(self, key, filename):
        """Reads tab-seperated text files.
        Used to read files that contain data about match fields and actions.
        """

        items = {}
        with open(filename, 'r') as my_file:
            while True:
                line = my_file.readline()
                if not line:
                    break
                lst = line.split('\t')
                items[lst[0]] = lst
        return items

    def get_actions(self, parser, set):
        actions = []
        aDict = {
            'SET_FIELD': (parser.OFPActionSetField, 'field'),
            'COPY_TTL_OUT': (parser.OFPActionCopyTtlOut, None),
            'COPY_TTL_IN': (parser.OFPActionCopyTtlIn, None),
            'POP_PBB': (parser.OFPActionPopPbb, None),
            'PUSH_PBB': (parser.OFPActionPushPbb, 'ethertype'),
            'POP_MPLS': (parser.OFPActionPopMpls, 'ethertype'),
            'PUSH_MPLS': (parser.OFPActionPushMpls, 'ethertype'),
            'POP_VLAN': (parser.OFPActionPopVlan, None),
            'PUSH_VLAN': (parser.OFPActionPushVlan, 'ethertype'),
            'DEC_MPLS_TTL': (parser.OFPActionDecMplsTtl, None),
            'SET_MPLS_TTL': (parser.OFPActionSetMplsTtl, 'mpls_ttl'),
            'DEC_NW_TTL': (parser.OFPActionDecNwTtl, None),
            'SET_NW_TTL': (parser.OFPActionSetNwTtl, 'nw_ttl'),
            'SET_QUEUE': (parser.OFPActionSetQueue, 'queue_id'),
            'GROUP': (parser.OFPActionGroup, 'group_id'),
            'OUTPUT': (parser.OFPActionOutput, 'port'),
        }

        for action in set:
            key = action.keys()[0] #There should be only one key
            value = action[key]
            if key in aDict:
                f = aDict[key][0]       # the action
                if aDict[key][1]:       # check if the action needs a value
                    kwargs = {}
                    if aDict[key][1] == 'field':
                        x = value.split('=')
                        kwargs = {x[0]: x[1]}
                    elif aDict[key][1] == 'port':
                        x = value.upper()
                        val = self.port_id[x] if x in self.port_id else int(x)
                        kwargs = {aDict[key][1]: val}
                    else:
                        kwargs = {aDict[key][1]: int(value)}
                    actions.append(f(**kwargs))
                else:
                    actions.append(f())
            else:
                raise Exception("Action {} not supported!".format(key))
        return actions

    def process_flow_message(self, d):
        """Sends flow form data to the switch to update flow tables.
        """

        dp = self.dpset.get(d["dpid"])
        if not dp:
            return "Datapatch does not exist!"

        ofproto = dp.ofproto
        parser = dp.ofproto_parser

        command = {
            'add': ofproto.OFPFC_ADD,
            'mod': ofproto.OFPFC_MODIFY,
            'modst': ofproto.OFPFC_MODIFY_STRICT,
            'del': ofproto.OFPFC_DELETE,
            'delst': ofproto.OFPFC_DELETE_STRICT,
        }

        # Initialize arguments for the flow mod message
        msg_kwargs = {
            'datapath': dp,
            'command': command.get(d["operation"], ofproto.OFPFC_ADD),
            'buffer_id': ofproto.OFP_NO_BUFFER,
        }

        try:
            msg_kwargs['table_id'] = d['table_id']

            # Match fields
            mf = d["match"]
            match = parser.OFPMatch(**mf)
            # print(match.to_jsondict())

            msg_kwargs['match'] = match
            # if d['hard_timeout'] else 0
            msg_kwargs['hard_timeout'] = d['hard_timeout']
            # if d['idle_timeout'] else 0
            msg_kwargs['idle_timeout'] = d['idle_timeout']
            msg_kwargs['priority'] = d['priority']  # if d['priority'] else 0
            msg_kwargs['cookie'] = d['cookie']  # if d['cookie'] else 0
            # if d['cookie_mask'] else 0
            msg_kwargs['cookie_mask'] = d['cookie_mask']

            # d['out_port']  # for the delete command
            msg_kwargs['out_port'] = d['out_port'] if d['out_port'] >= 0 else ofproto.OFPP_ANY
            # d['out_group'] # for the delete command
            msg_kwargs['out_group'] = d['out_group'] if d['out_group'] >= 0 else ofproto.OFPG_ANY

            # instructions
            inst = []

            # Goto meter
            if d["meter_id"]:
                inst += [parser.OFPInstructionMeter(d["meter_id"])]
            # Apply Actions
            if d["apply"]:
                applyActions = self.get_actions(parser, d["apply"])
                inst += [parser.OFPInstructionActions(
                    ofproto.OFPIT_APPLY_ACTIONS, applyActions)]
            # Clear Actions
            if d["clearactions"]:
                inst += [parser.OFPInstructionActions(
                    ofproto.OFPIT_CLEAR_ACTIONS, [])]
            # Write Actions
            if d["write"]:
                # bc actions must be unique they are in dict
                # from dict to list
                toList = [{k:d["write"][k]} for k in d["write"]]
                #print(toList)
                writeActions = self.get_actions(parser, toList)
                inst += [parser.OFPInstructionActions(
                   ofproto.OFPIT_WRITE_ACTIONS, writeActions)]
            # Write Metadata
            if d["metadata"]:
                inst += [parser.OFPInstructionWriteMetadata(
                    d["metadata"], d["metadata_mask"])]
            # Goto Table Metadata
            if d["goto"]:
                inst += [parser.OFPInstructionGotoTable(table_id=d["goto"])]

            if inst:
                msg_kwargs['instructions'] = inst

            # Flags
            flags = 0
            flags += 0x01 if d['SEND_FLOW_REM'] else 0
            flags += 0x02 if d['CHECK_OVERLAP'] else 0
            flags += 0x04 if d['RESET_COUNTS'] else 0
            flags += 0x08 if d['NO_PKT_COUNTS'] else 0
            flags += 0x10 if d['NO_BYT_COUNTS'] else 0

            msg_kwargs['flags'] = flags

        except Exception as e:
            return "Value for '{}' is not found!".format(e.message)

        # ryu/ryu/ofproto/ofproto_v1_3_parser.py
        msg = parser.OFPFlowMod(**msg_kwargs)
        try:
            dp.send_msg(msg)    # ryu/ryu/controller/controller.py
        except KeyError as e:
            return e.__repr__()
        except Exception as e:
            return e.__repr__()

        return "Message sent successfully."

    def process_group_message(self, d):
        """Sends group form data to the switch to update group tables.
        """

        dp = self.dpset.get(d["dpid"])
        if not dp:
            return "Datapatch does not exist!"

        ofproto = dp.ofproto
        parser = dp.ofproto_parser

        command = {
            'add': ofproto.OFPGC_ADD,
            'mod': ofproto.OFPGC_MODIFY,
            'del': ofproto.OFPGC_DELETE,
        }

        cmd = command.get(d["operation"], ofproto.OFPGC_ADD)

        type_convert = {'ALL': dp.ofproto.OFPGT_ALL,
                        'SELECT': dp.ofproto.OFPGT_SELECT,
                        'INDIRECT': dp.ofproto.OFPGT_INDIRECT,
                        'FF': dp.ofproto.OFPGT_FF}

        gtype = type_convert.get(d["type"])
        
        group_id = d["group_id"]

        buckets = []
        for bucket in  d["buckets"]:
            #print("bucket", bucket)
            weight = bucket.get('weight', 0)
            watch_port = bucket.get('watch_port', ofproto.OFPP_ANY)
            watch_group = bucket.get('watch_group', dp.ofproto.OFPG_ANY)
            actions = []
            if bucket['actions']:
                actions = self.get_actions(parser, bucket['actions'])
                buckets.append(dp.ofproto_parser.OFPBucket(
                    weight, watch_port, watch_group, actions))

        #print(dp, cmd, gtype, group_id, buckets)
        group_mod = parser.OFPGroupMod(
            dp, cmd, gtype, group_id, buckets)
        
        try:
            dp.send_msg(group_mod)    # ryu/ryu/controller/controller.py
        except KeyError as e:
            return e.__repr__()
        except Exception as e:
            return e.__repr__()
        
        return "Message sent successfully."

    def get_flow_stats(self, req, dpid):
        flow = {}  # no filters
        dp = self.dpset.get(int(str(dpid), 0))
        return self.ofctl.get_flow_stats(dp, self.waiters, flow)

    def get_stats(self, req, dpid):
        dp = self.dpset.get(int(str(dpid), 0))
        if req == "flows":
            return self.ofctl.get_flow_stats(dp, self.waiters)
        elif req == "groups":
           return {"desc": self.ofctl.get_group_desc(dp, self.waiters),
                     "stats": self.ofctl.get_group_stats(dp, self.waiters)}

    def get_packet_summary(self, content):
        pkt = packet.Packet(content)
        eth = pkt.get_protocols(ethernet.ethernet)[0]
        ethtype = eth.ethertype
        dst = eth.dst
        src = eth.src

        return '(src={}, dst={}, type=0x{:04x})'.format(src, dst, ethtype)

    ##### Event Handlers #######################################

    @set_ev_cls([  # ofp_event.EventOFPStatsReply,
        # ofp_event.EventOFPDescStatsReply,
        ofp_event.EventOFPFlowStatsReply,
        # ofp_event.EventOFPAggregateStatsReply,
        # ofp_event.EventOFPTableStatsReply,
        # ofp_event.EventOFPTableFeaturesStatsReply,
        # ofp_event.EventOFPPortStatsReply,
        # ofp_event.EventOFPQueueStatsReply,
        # ofp_event.EventOFPQueueDescStatsReply,
        # ofp_event.EventOFPMeterStatsReply,
        # ofp_event.EventOFPMeterFeaturesStatsReply,
        # ofp_event.EventOFPMeterConfigStatsReply,
        ofp_event.EventOFPGroupStatsReply,
        # ofp_event.EventOFPGroupFeaturesStatsReply,
        ofp_event.EventOFPGroupDescStatsReply,
        # ofp_event.EventOFPPortDescStatsReply,
        # ofp_event.EventOFPPacketIn,
    ], MAIN_DISPATCHER)
    def stats_reply_handler(self, ev):
        """This method is taken from ryu.app.ofctl_rest
        It is used to fill flow tables
        """

        msg = ev.msg
        dp = msg.datapath

        if dp.id not in self.waiters:
            return
        if msg.xid not in self.waiters[dp.id]:
            return
        lock, msgs = self.waiters[dp.id][msg.xid]
        msgs.append(msg)

        flags = dp.ofproto.OFPMPF_REPLY_MORE

        if msg.flags & flags:
            return
        del self.waiters[dp.id][msg.xid]
        lock.set()

        # self.messages.append(msg)

    @set_ev_cls(ofp_event.EventOFPFlowRemoved, MAIN_DISPATCHER)
    def flow_removed_handler(self, ev):
        msg = ev.msg
        dp = msg.datapath
        ofp = dp.ofproto
        if msg.reason == ofp.OFPRR_IDLE_TIMEOUT:
            reason = 'IDLE TIMEOUT'
        elif msg.reason == ofp.OFPRR_HARD_TIMEOUT:
            reason = 'HARD TIMEOUT'
        elif msg.reason == ofp.OFPRR_DELETE:
            reason = 'DELETE'
        elif msg.reason == ofp.OFPRR_GROUP_DELETE:
            reason = 'GROUP DELETE'
        else:
            reason = 'unknown'

        self.logger.info('OFPFlowRemoved: '
                         'cookie=%d priority=%d reason=%s table_id=%d '
                         'duration_sec=%d duration_nsec=%d '
                         'idle_timeout=%d hard_timeout=%d '
                         'packet_count=%d byte_count=%d match.fields=%s',
                         msg.cookie, msg.priority, reason, msg.table_id,
                         msg.duration_sec, msg.duration_nsec,
                         msg.idle_timeout, msg.hard_timeout,
                         msg.packet_count, msg.byte_count, msg.match)

    @set_ev_cls(ofp_event.EventOFPErrorMsg,
                [HANDSHAKE_DISPATCHER, CONFIG_DISPATCHER, MAIN_DISPATCHER])
    def error_msg_handler(self, ev):
        msg = ev.msg

        self.logger.error('OFPErrorMsg: type=0x%02x code=0x%02x '
                          'message=%s',
                          msg.type, msg.code, utils.hex_array(msg.data))

    @set_ev_cls(ofp_event.EventOFPPacketIn, MAIN_DISPATCHER)
    def packet_in_handler(self, ev):
        msg = ev.msg
        dp = msg.datapath
        ofp = dp.ofproto
        if msg.reason == ofp.OFPR_NO_MATCH:
            reason = 'NO MATCH'
        elif msg.reason == ofp.OFPR_ACTION:
            reason = 'ACTION'
        elif msg.reason == ofp.OFPR_INVALID_TTL:
            reason = 'INVALID TTL'
        else:
            reason = 'UNKNOWN'

        self.logger.info('OFPPacketIn: '
                         'buffer_id=%x total_len=%d reason=%s '
                         'table_id=%d cookie=%d match=%s summary=%s',
                         msg.buffer_id, msg.total_len, reason,
                         msg.table_id, msg.cookie, msg.match,
                         #utils.hex_array(msg.data))
                         self.get_packet_summary(msg.data))

    # @set_ev_cls(event.EventSwitchEnter)
    def get_topology_data(self):
        """Get Topology Data
        """
        switch_list = get_all_switch(self)
        switches = [switch.to_dict() for switch in switch_list]
        links_list = get_all_link(self)
        links = [link.to_dict() for link in links_list]
        host_list = get_all_host(self)
        hosts = [h.to_dict() for h in host_list]

        return {"switches": switches, "links":links, "hosts": hosts}