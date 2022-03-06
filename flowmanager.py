# Copyright (c) 2018-2022 Maen Artimy
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


"""
The main module of the FlowManger Applications
"""

import os
import sys
import logging
import time
import json

from socket import error as SocketError
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
# from ryu.lib import ofctl_utils
# from ryu import utils

# for packet content
from ryu.lib.packet import packet
from ryu.lib.packet import ethernet
from ryu.lib.packet import ether_types

from tinyrpc.exc import InvalidReplyError

from webapi import WebApi
from ctrlapi import Ctrl_Api


LOGLEVEL = logging.DEBUG
LOGFILE = "flwmgr.log"
PYTHON3 = sys.version_info > (3, 0)


class FlowManager(app_manager.RyuApp):
    OFP_VERSIONS = [ofproto_v1_3.OFP_VERSION]

    # This class wants access to the following applications
    _CONTEXTS = {'wsgi': WSGIApplication,
                 'dpset': dpset.DPSet}

    MONITOR_PKTIN = False
    MAGIC_COOKIE = 0x00007ab700000000

    def __init__(self, *args, **kwargs):
        super(FlowManager, self).__init__(*args, **kwargs)
        wsgi = kwargs['wsgi']
        self.dpset = kwargs['dpset']
        #self.writer = None
        self.ofctl = ofctl_v1_3
        self.rpc_clients = []
        self.ctrl_api = Ctrl_Api(self, self.dpset)

        # Data exchanged with WebApi
        wsgi.register(WebApi,
                      {"webctl": self.ctrl_api,
                       "rpc_clients": self.rpc_clients})

        logger.info("Created flowmanager")

    def get_packet_summary(self, content):
        """Get some packet information
        """
        pkt = packet.Packet(content)
        eth = pkt.get_protocols(ethernet.ethernet)[0]
        ethtype = eth.ethertype
        dst = eth.dst
        src = eth.src

        return '(src={}, dst={}, type=0x{:04x})'.format(src, dst, ethtype)

    ##### Event Handlers #######################################

    @set_ev_cls([  # ofp_event.EventOFPStatsReply,
        ofp_event.EventOFPDescStatsReply,
        ofp_event.EventOFPFlowStatsReply,
        ofp_event.EventOFPAggregateStatsReply,
        ofp_event.EventOFPTableStatsReply,
        # ofp_event.EventOFPTableFeaturesStatsReply,
        ofp_event.EventOFPPortStatsReply,
        # ofp_event.EventOFPQueueStatsReply,
        # ofp_event.EventOFPQueueDescStatsReply,
        ofp_event.EventOFPMeterStatsReply,
        ofp_event.EventOFPMeterFeaturesStatsReply,
        ofp_event.EventOFPMeterConfigStatsReply,
        ofp_event.EventOFPGroupStatsReply,
        # ofp_event.EventOFPGroupFeaturesStatsReply,
        ofp_event.EventOFPGroupDescStatsReply,
        ofp_event.EventOFPPortDescStatsReply,
    ], MAIN_DISPATCHER)
    def stats_reply_handler(self, ev):
        """Handles Reply Events
        """
        msg = ev.msg
        dp = msg.datapath

        if dp.id not in self.ctrl_api.get_waiters():
            return
        if msg.xid not in self.ctrl_api.get_waiters()[dp.id]:
            return
        lock, msgs = self.ctrl_api.get_waiters()[dp.id][msg.xid]
        msgs.append(msg)

        flags = dp.ofproto.OFPMPF_REPLY_MORE

        if msg.flags & flags:
            return
        del self.ctrl_api.get_waiters()[dp.id][msg.xid]
        lock.set()

        # self.messages.append(msg)

    @set_ev_cls(ofp_event.EventOFPFlowRemoved, MAIN_DISPATCHER)
    def flow_removed_handler(self, ev):
        """Handles Flow Removal
        Called only when the flag "send-flow-removed-msg" is set
        """

        msg = ev.msg
        dp = msg.datapath
        ofp = dp.ofproto


        # The reason for removal
        reason_msg = {ofp.OFPRR_IDLE_TIMEOUT: "IDLE TIMEOUT",
                      ofp.OFPRR_HARD_TIMEOUT: "HARD TIMEOUT",
                      ofp.OFPRR_DELETE: "DELETE",
                      ofp.OFPRR_GROUP_DELETE: "GROUP DELETE"
                      }
        reason = reason_msg.get(msg.reason, 'UNKNOWN')

        match = msg.match.items()
        log = list(map(str, ['Removed', dp.id, msg.table_id, reason, match, msg.cookie]))
        logger.debug(', '.join(log))


    @set_ev_cls(ofp_event.EventOFPErrorMsg,
                [HANDSHAKE_DISPATCHER, CONFIG_DISPATCHER, MAIN_DISPATCHER])
    def error_msg_handler(self, ev):
        """Handles an error message
        """

        msg = ev.msg

        # TODO: needs to be of the same format as packet-in
        # self.logger.error('ErrorMsg\ttype=0x%02x code=0x%02x '
        #                   'message=%s',
        #                   msg.type, msg.code, utils.hex_array(msg.data))

    @set_ev_cls(ofp_event.EventOFPPacketIn, MAIN_DISPATCHER)
    def packet_in_handler(self, ev):
        """Handles Packet_IN message
        """

        msg = ev.msg
        dp = msg.datapath
        ofp = dp.ofproto

        pkt = packet.Packet(msg.data)

        # All packet-in messages are looged except LLDP packets
        eth = pkt.get_protocol(ethernet.ethernet)
        if eth.ethertype == ether_types.ETH_TYPE_LLDP:
            # ignore lldp packet
            return

        # Monitor packets. Flow entries with cookies take precedance
        tracked_msg = None
        if msg.cookie & self.MAGIC_COOKIE == self.MAGIC_COOKIE:
            # track the packet if it has a magic cookie
            tracked_msg = self.ctrl_api.get_tracker().track(msg.cookie, pkt)
        elif not self.MONITOR_PKTIN:
            # track the packet the global tracking option is enabled
            tracked_msg = self.ctrl_api.get_tracker().track(self.MAGIC_COOKIE, pkt)

        # Send the tracked message to the interface
        if tracked_msg:
            self.rpc_broadcall("update", json.dumps(tracked_msg))

        # Continue the normal processing of Packet_In

        # The reason for packet_in
        reason_msg = {ofp.OFPR_NO_MATCH: "NO MATCH",
                      ofp.OFPR_ACTION: "ACTION",
                      ofp.OFPR_INVALID_TTL: "INVALID TTL"
                      }
        reason = reason_msg.get(msg.reason, 'UNKNOWN')

        now = time.strftime('%b %d %H:%M:%S')
        match = msg.match.items()  # ['OFPMatch']['oxm_fields']
        log = list(map(str, [now, 'PacketIn', dp.id, msg.table_id, reason, match,
                             hex(msg.buffer_id), msg.cookie, self.get_packet_summary(msg.data)]))
        logger.debug(', '.join(log[1:]))
        try:
            self.rpc_broadcall("log", json.dumps(log))
        except Exception as err: 
            # possible not serializable object
            logger.error("Error at packet_in_handler %s", err)

    def rpc_broadcall(self, func_name, msg):
        logger.debug("rpc %s, %s", func_name, msg)
        disconnected_clients = []
        for rpc_client in self.rpc_clients:
            rpc_server = rpc_client.get_proxy()
            try:
                getattr(rpc_server, func_name)(msg)
            except SocketError:
                logger.debug('WebSocket disconnected: %s', rpc_client.ws)
                disconnected_clients.append(rpc_client)
            except InvalidReplyError as e:
                logger.error("Error at rpc_broadcall %s", e)

        for client in disconnected_clients:
            self.rpc_clients.remove(client)


def get_logger(logfile_name, loglevel):
    """Create a logger object.
    """
    a_logger = logging.getLogger("flowmanager")
    a_logger.setLevel(loglevel)
    f_handler = logging.FileHandler(logfile_name, mode="w")
    f_format = logging.Formatter(
        '%(asctime)s:%(name)s:%(levelname)s - %(message)s', datefmt='%Y-%m-%d %H:%M:%S')
    f_handler.setFormatter(f_format)
    a_logger.addHandler(f_handler)
    
    return a_logger


# For Log file
cfd = os.path.dirname(os.path.abspath(__file__))
logfile = os.path.join(cfd, LOGFILE)
logger = get_logger(logfile, LOGLEVEL)

print("You are using Python v" + '.'.join(map(str, sys.version_info)))
