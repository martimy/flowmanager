# Copyright (c) 2019 Maen Artimy
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

from ryu.lib import pcaplib
from ryu.lib.packet import arp
from ryu.lib.packet import ethernet
from ryu.lib.packet import icmp
from ryu.lib.packet import ipv4
from ryu.lib.packet import ipv6
from ryu.lib.packet import packet
from ryu.lib.packet import packet_base
from ryu.lib.packet import tcp
from ryu.lib.packet import udp
from ryu.lib.packet import vlan
import json

ETHERNET = ethernet.ethernet.__name__
VLAN = vlan.vlan.__name__
IPV4 = ipv4.ipv4.__name__
IPV6 = ipv6.ipv6.__name__
ARP = arp.arp.__name__
ICMP = icmp.icmp.__name__
TCP = tcp.tcp.__name__
UDP = udp.udp.__name__


# class Writer2(pcaplib.Writer):

#     def __init__(self, file_obj, snaplen=65535, network=1):
#         super(Writer2, self).__init__(
#             file_obj, snaplen=snaplen, network=network)

#     def write_pkt(self, buf, ts=None):
#         super(Writer2, self).write_pkt(buf, ts=ts)
#         self._f.flush()


class Tracker():

    all_stats = []

    def untrack(self, id):
        if id in self.existing_name(self.all_stats):
            root = self.get_name(id, self.all_stats)
            self.all_stats.remove(root)

    def reset(self, id):
        if id in self.existing_name(self.all_stats):
            root = self.get_name(id, self.all_stats)
            root["children"] = []

    def track(self, id, pkt):
        # Find if a tree has been created for this ID,
        # Otherwise, create a new one
        if id in self.existing_name(self.all_stats):
            root = self.get_name(id, self.all_stats)
        else:
            root = {"name": id, "children": []}
            self.all_stats.append(root)

        # Get all protocols in a packet
        header_list = [(p.protocol_name, p) for p in pkt.protocols if isinstance(
            p, packet_base.PacketBase)]

        for k in header_list:
            name = self.getName(k, header_list)
            if name in self.existing_name(root['children']):
                # If the protcol is found in the tree, make it root
                # for the next protocol
                root = self.get_name(name, root['children'])
            else:
                # If the protcol is not found in the tree, create a new node
                # and make it root for the next protocol
                new_root = {"name": name, "children": []}
                root['children'].append(new_root)
                root = new_root

        c = root.setdefault('count', 0)
        root['count'] = c + 1

        return self.all_stats

    def getName(self, k, header_list):
        if k[0] in [ETHERNET, IPV4, IPV6]:
            s = k[1].src
            d = k[1].dst
            return "{} [{}, {}]".format(k[0], s, d)
        if k[0] in [TCP, UDP]:
            #s = k[1].src_port
            d = k[1].dst_port
            return "{} [{}]".format(k[0], d)
        return k[0]

    def existing_name(self, lst):
        for n in lst:
            yield n['name']

    def get_name(self, name, lst):
        for n in lst:
            if n.get('name', None) == name:
                return n
        return None
