# Copyright (C) 2011 Nippon Telegraph and Telephone Corporation.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
# implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from ryu.base import app_manager
from ryu.controller import ofp_event
from ryu.controller import dpset
from ryu.controller.handler import CONFIG_DISPATCHER
from ryu.controller.handler import MAIN_DISPATCHER
from ryu.controller.handler import DEAD_DISPATCHER
from ryu.controller.handler import HANDSHAKE_DISPATCHER
from ryu.controller.handler import set_ev_cls
from ryu.ofproto import ofproto_v1_3
from ryu.lib.packet import packet
from ryu.lib.packet import packet_base
from ryu.lib.packet import ethernet
from ryu.lib.packet import ether_types

from ryu.lib.packet import in_proto
from ryu.lib.packet import ipv4
from ryu.lib.packet import icmp
from ryu.lib.packet import tcp
from ryu.lib.packet import udp
from ryu.lib.packet import arp

from ryu.lib import hub, snortlib
from operator import attrgetter
import logging
import json
import array
import re
import time
from logging.handlers import WatchedFileHandler


class MainApp1(app_manager.RyuApp):
    OFP_VERSIONS = [ofproto_v1_3.OFP_VERSION]
    _CONTEXTS = {'snortlib': snortlib.SnortLib}

    snortlogname = 'snortalert'
    snortlogfile = 'snortalert.log'
    logname = 'flwmgr'
    logfile = 'flwmgr.log'
    tmplogname = 'app'
    tmplogfile = 'app.log'

    def __init__(self, *args, **kwargs):
        super(MainApp1, self).__init__(*args, **kwargs)
        self.mac_to_port = {}
        self.datapaths = {}
        self.snort = kwargs['snortlib']
        self.snort_port = 3
        socket_config = {'unixsock': True}
        self.snort.set_config(socket_config)
        self.snort.start_socket_server()

        self.logger = self.get_logger(self.logname, self.logfile, 'INFO', 0)
        self.loggerlocal = self.get_tmplogger(
            self.tmplogname, self.tmplogfile, 'INFO', 0)
        self.snortlogger = self.get_snort_logger(
            self.snortlogname, self.snortlogfile, 'INFO', 0)

    def get_logger(self, logname, logfile, loglevel, propagate):
        """Create and return a logger object."""
        logger = logging.getLogger(logname)
        logger_handler = WatchedFileHandler(logfile, mode='a')
        log_fmt = '%(asctime)s\t%(levelname)-8s\t%(message)s'
        logger_handler.setFormatter(
            logging.Formatter(log_fmt, '%d-%b-%y %H:%M:%S'))
        logger.addHandler(logger_handler)
        logger.propagate = propagate
        logger.setLevel(loglevel)
        return logger

    def get_tmplogger(self, logname, logfile, loglevel, propagate):
        """Create and return a logger object."""
        logger = logging.getLogger(logname)
        logger_handler = WatchedFileHandler(logfile, mode='w')
        log_fmt = '%(asctime)s\t%(levelname)-8s\t%(message)s'
        logger_handler.setFormatter(
            logging.Formatter(log_fmt, '%d-%b-%y %H:%M:%S'))
        logger.addHandler(logger_handler)
        logger.propagate = propagate
        logger.setLevel(loglevel)
        return logger

    def get_snort_logger(self, logname, logfile, loglevel, propagate):
        """Create and return a logger object."""
        logger = logging.getLogger(logname)
        logger_handler = WatchedFileHandler(logfile, mode='w')
        log_fmt = '%(asctime)s\t%(levelname)-8s\t%(message)s'
        logger_handler.setFormatter(
            logging.Formatter(log_fmt, '%d-%b-%y %H:%M:%S'))
        logger.addHandler(logger_handler)
        logger.propagate = propagate
        logger.setLevel(loglevel)
        return logger

    @set_ev_cls(dpset.EventDP, dpset.DPSET_EV_DISPATCHER)
    def _event_switch_enter_handler(self, ev):
        dp = ev.dp
        if ev.enter == True and (ev.dp.id != 2 or ev.dp.id != 3):
            self.logger.info("switch connected %s", dp)
        elif ev.enter == True and (ev.dp.id == 2 or ev.dp.id == 3):
            self.logger.info("PRE Rest Router connected %s", dp)

    @set_ev_cls(ofp_event.EventOFPSwitchFeatures, CONFIG_DISPATCHER)
    def switch_features_handler(self, ev):
        datapath = ev.msg.datapath
        ofproto = datapath.ofproto
        parser = datapath.ofproto_parser

        self.logger.info(ev.msg.datapath.address)

        # install table-miss flow entry
        match = parser.OFPMatch()
        actions = [parser.OFPActionOutput(ofproto.OFPP_CONTROLLER,
                                          ofproto.OFPCML_NO_BUFFER)]

        self.add_flow(datapath=datapath, priority=0, match=match,
                      table_id=0, idle=0, hard=0, actions=actions)

        # ICMP drop flow
        # match = parser.OFPMatch(
        #     eth_type=ether_types.ETH_TYPE_IP, ip_proto=in_proto.IPPROTO_ICMP)
        # mod = parser.OFPFlowMod(datapath=datapath, priority=2,
        #                         match=match, table_id=0, idle_timeout=1, hard_timeout=5)
        # datapath.send_msg(mod)

        # TCP drop flow
        # match = parser.OFPMatch(
        #     eth_type=ether_types.ETH_TYPE_IP, ip_proto=in_proto.IPPROTO_TCP)
        # mod = parser.OFPFlowMod(datapath=datapath, priority=3,
        #                         match=match, table_id=0, idle_timeout=2, hard_timeout=5)
        # datapath.send_msg(mod)

        # UDP drop flow
        # match = parser.OFPMatch(
        #     eth_type=ether_types.ETH_TYPE_IP, ip_proto=in_proto.IPPROTO_UDP)
        # mod = parser.OFPFlowMod(datapath=datapath, priority=4,
        #                         match=match, table_id=0, idle_timeout=3, hard_timeout=5)
        # datapath.send_msg(mod)

    def add_flow(self, datapath, priority, match, table_id, idle, hard, actions, buffer_id=None):
        ofproto = datapath.ofproto
        parser = datapath.ofproto_parser

        inst = [parser.OFPInstructionActions(ofproto.OFPIT_APPLY_ACTIONS,
                                             actions)]
        if buffer_id:
            mod = parser.OFPFlowMod(datapath=datapath, buffer_id=buffer_id,
                                    priority=priority, match=match,
                                    idle_timeout=idle, hard_timeout=hard,
                                    instructions=inst, table_id=table_id)
        else:
            mod = parser.OFPFlowMod(datapath=datapath,
                                    priority=priority, match=match,
                                    idle_timeout=idle, hard_timeout=hard,
                                    instructions=inst, table_id=table_id)
        datapath.send_msg(mod)

    @set_ev_cls(ofp_event.EventOFPPacketIn, MAIN_DISPATCHER)
    def _packet_in_handler(self, ev):
        if ev.msg.msg_len < ev.msg.total_len:
            self.logger.info("packet truncated: only %s of %s bytes",
                             ev.msg.msg_len, ev.msg.total_len)

        msg = ev.msg
        datapath = msg.datapath
        ofproto = datapath.ofproto
        parser = datapath.ofproto_parser
        in_port = msg.match['in_port']

        pkt = packet.Packet(msg.data)
        eth = pkt.get_protocols(ethernet.ethernet)[0]

        if eth.ethertype == ether_types.ETH_TYPE_LLDP:
            # ignore lldp packet
            return

        if eth.ethertype == ether_types.ETH_TYPE_IPV6:
            # ignore ipv6 packet
            return

        dst = eth.dst
        src = eth.src
        dpid = datapath.id

        self.mac_to_port.setdefault(dpid, {})

        # learn a mac address to avoid FLOOD next time.
        self.mac_to_port[dpid][src] = in_port

        if dst in self.mac_to_port[dpid]:
            out_port = self.mac_to_port[dpid][dst]
        else:
            out_port = ofproto.OFPP_FLOOD

        # _actions = [parser.OFPActionOutput(
            # out_port), parser.OFPActionOutput(self.snort_port)]
        _actions = [parser.OFPActionOutput(out_port)]

        # self.logger.info(json.dumps(
        #     self.mac_to_port, indent=2, sort_keys=True))

        # print(json.dumps(self.mac_to_port, indent=2, sort_keys=True))

        # install a flow to avoid packet_in next time
        if out_port != ofproto.OFPP_FLOOD:

            # check IP Protocol and create a match for IP
            if eth.ethertype == ether_types.ETH_TYPE_IP:
                ip = pkt.get_protocol(ipv4.ipv4)
                srcip = ip.src
                dstip = ip.dst
                protocol = ip.proto
                _table_id = 0

                # if ICMP Protocol
                if protocol == in_proto.IPPROTO_ICMP:
                    self.logger.info(
                        "Local ICMP Packet Found ;; [DPID : %s , atPort : %s] ;; src : %s >> dst : %s ;; srcip : %s >> dstip : %s",
                        dpid, in_port, src, dst, srcip, dstip)
                    self.loggerlocal.info(
                        "Local ICMP Packet Found ;; [DPID : %s , atPort : %s] ;; src : %s >> dst : %s ;; srcip : %s >> dstip : %s",
                        dpid, in_port, src, dst, srcip, dstip)
                    _match = parser.OFPMatch(in_port=in_port, eth_dst=dst, eth_src=src,
                                             eth_type=ether_types.ETH_TYPE_IP, ipv4_src=srcip,
                                             ipv4_dst=dstip, ip_proto=protocol)
                    # _actions = [parser.OFPActionOutput(out_port)]

                    _priority = 2
                    _idle_timeout = 0
                    _hard_timeout = 0

                # if TCP Protocol
                elif protocol == in_proto.IPPROTO_TCP:
                    t = pkt.get_protocol(tcp.tcp)
                    self.logger.info(
                        "Local TCP Packet Found ;; [DPID : %s , atPort : %s] ;; src : %s >> dst : %s ;; srcip : %s >> dstip : %s ;; sport : %s >> dport : %s",
                        dpid, in_port, src, dst, srcip, dstip, t.src_port, t.dst_port)
                    self.loggerlocal.info(
                        "Local TCP Packet Found ;; [DPID : %s , atPort : %s] ;; src : %s >> dst : %s ;; srcip : %s >> dstip : %s ;; sport : %s >> dport : %s",
                        dpid, in_port, src, dst, srcip, dstip, t.src_port, t.dst_port)
                    _match = parser.OFPMatch(in_port=in_port,  eth_dst=dst, eth_src=src,
                                             eth_type=ether_types.ETH_TYPE_IP, ipv4_src=srcip,
                                             ipv4_dst=dstip, ip_proto=protocol, tcp_dst=t.dst_port)
                    # _actions = [parser.OFPActionOutput(out_port)]

                    _priority = 3
                    _idle_timeout = 0
                    _hard_timeout = 0

                # If UDP Protocol
                elif protocol == in_proto.IPPROTO_UDP:
                    u = pkt.get_protocol(udp.udp)
                    self.logger.info(
                        "Local UDP Packet Found ;; [DPID : %s , atPort : %s] ;; src : %s >> dst : %s ;; srcip : %s >> dstip : %s ;; sport : %s >> dport : %s",
                        dpid, in_port, src, dst, srcip, dstip, u.src_port, u.dst_port)
                    self.loggerlocal.info(
                        "Local UDP Packet Found ;; [DPID : %s , atPort : %s] ;; src : %s >> dst : %s ;; srcip : %s >> dstip : %s ;; sport : %s >> dport : %s",
                        dpid, in_port, src, dst, srcip, dstip, u.src_port, u.dst_port)
                    _match = parser.OFPMatch(in_port=in_port, eth_dst=dst, eth_src=src,
                                             eth_type=ether_types.ETH_TYPE_IP, ipv4_src=srcip,
                                             ipv4_dst=dstip, ip_proto=protocol, udp_dst=u.dst_port)
                    # _actions = [parser.OFPActionOutput(out_port)]

                    _priority = 4
                    _idle_timeout = 0
                    _hard_timeout = 0

                # verify if we have a valid buffer_id, if yes avoid to send both
                # flow_mod & packet_out
                if msg.buffer_id != ofproto.OFP_NO_BUFFER:
                    self.add_flow(datapath=datapath, priority=_priority, match=_match, table_id=_table_id,
                                  idle=_idle_timeout, hard=_hard_timeout, actions=_actions, buffer_id=msg.buffer_id)
                    return
                else:
                    _priority = 1
                    _table_id = 0
                    self.add_flow(datapath=datapath, priority=_priority, match=_match,
                                  table_id=0, idle=_idle_timeout, hard=_hard_timeout, actions=_actions)

        data = None
        # _actions = [parser.OFPActionOutput(out_port)]
        if msg.buffer_id == ofproto.OFP_NO_BUFFER:
            data = msg.data

        out = parser.OFPPacketOut(datapath=datapath, buffer_id=msg.buffer_id,
                                  in_port=in_port, actions=_actions, data=data)
        datapath.send_msg(out)

    @set_ev_cls(ofp_event.EventOFPStateChange, [MAIN_DISPATCHER, DEAD_DISPATCHER])
    def _state_change_handler(self, ev):
        datapath = ev.datapath
        if ev.state == MAIN_DISPATCHER:
            if datapath.id not in self.datapaths:
                self.logger.info(
                    'register datapath: %016x', datapath.id)
                self.loggerlocal.info(
                    'register datapath: %016x', datapath.id)
                self.datapaths[datapath.id] = datapath
        elif ev.state == DEAD_DISPATCHER:
            if datapath.id in self.datapaths:
                self.logger.info(
                    'unregister datapath: %016x', datapath.id)
                self.loggerlocal.info(
                    'unregister datapath: %016x', datapath.id)
                del self.datapaths[datapath.id]

    def packet_print(self, pkt):
        pkt = packet.Packet(array.array('B', pkt))

        _eth = pkt.get_protocol(ethernet.ethernet)
        _ipv4 = pkt.get_protocol(ipv4.ipv4)
        _icmp = pkt.get_protocol(icmp.icmp)
        _tcp = pkt.get_protocol(tcp.tcp)
        _udp = pkt.get_protocol(udp.udp)

        if _udp:
            self.snortlogger.info("%r", _udp)
            self.logger.info("%r", _udp)
        if _tcp:
            self.snortlogger.info("%r", _tcp)
            self.logger.info("%r", _tcp)
        if _icmp:
            self.snortlogger.info("%r", _icmp)
            self.logger.info("%r", _icmp)
        if _ipv4:
            self.snortlogger.info("%r", _ipv4)
            self.logger.info("%r", _ipv4)
        if _eth:
            self.snortlogger.info("%r", _eth)
            self.logger.info("%r", _eth)

    @set_ev_cls(snortlib.EventAlert, MAIN_DISPATCHER)
    def _dump_alert(self, ev):
        msg = ev.msg

        alertmsg = msg.alertmsg[0].decode('ascii')
        # print(f'alertmsg: {alertmsg}')
        alert = str(msg.alertmsg)
        # print(alert)

        pkt = packet.Packet(array.array('B', msg.pkt))
        protocol_list = dict((p.protocol_name, p) for p in pkt.protocols if isinstance(p, packet_base.PacketBase))

        _eth = pkt.get_protocol(ethernet.ethernet)
        _ipv4 = pkt.get_protocol(ipv4.ipv4)
        _icmp = pkt.get_protocol(icmp.icmp)
        _tcp = pkt.get_protocol(tcp.tcp)
        _udp = pkt.get_protocol(udp.udp)

        match = re.search("^.{0,150}", alert)
        match1 = re.split(" ", match.group(0))
        if "SYN_Flood" in match1:
            self.snortlogger.info("SYN Flood Detected")
            print("SYN Flood Detected")
            # TODO: Blocking Packet

        elif "UDP_Flood" in match1:
            self.snortlogger.info("UDP Flood Detected")
            print("UDP Flood Detected")
            # TODO: Blocking Packet

        elif "HTTP_Flood" in match1:
            self.snortlogger.info("HTTP Flood Detected")
            print("HTTP Flood Detected")
            # TODO: Blocking Packet

        elif "ICMP_Flood" in match1:
            self.snortlogger.info("ICMP Flood Detected")
            print("ICMP Flood Detected")
            # TODO: Blocking Packet

        elif "PingOfDeath" in match1:
            self.snortlogger.info("POD Flood Detected")
            print("PingOfDeath Detected")
            # TODO: Blocking Packet

        self.snortlogger.info('alertmsg: %s' % ''.join(str(msg.alertmsg)))
        self.logger.info('alertmsg: %s' % ''.join(str(msg.alertmsg)))
        self.packet_print(msg.pkt)
