# Copright (C) 2019  Maen Artimy

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


class Writer2(pcaplib.Writer):

    def __init__(self, file_obj, snaplen=65535, network=1):
        super(Writer2, self).__init__(
            file_obj, snaplen=snaplen, network=network)

    def write_pkt(self, buf, ts=None):
        super(Writer2, self).write_pkt(buf, ts=ts)
        self._f.flush()


class Tracker():

    all_stats = []

    def untrack(self, id):
        try:
            del self.all_stats[id]
        except KeyError:
            pass  # It doesn't exist

    def track_old(self, id, pkt):
        header_list = dict((p.protocol_name, p)
                           for p in pkt.protocols if isinstance(p, packet_base.PacketBase))
        if header_list:
            stats = self.all_stats.setdefault(id, {})
            for k in header_list:
                c = stats.setdefault(k, {"count": 0})
                stats[k]["count"] = c["count"] + 1
                if k in [ETHERNET, IPV4, IPV6]:
                    a = header_list[k]
                    s = stats[k].setdefault("src", {})
                    c1 = s.setdefault(a.src, 0)
                    s[a.src] = c1 + 1
                    d = stats[k].setdefault("dst", {})
                    c2 = d.setdefault(a.dst, 0)
                    d[a.dst] = c2 + 1
                if k in [TCP, UDP]:
                    a = header_list[k]
                    s = stats[k].setdefault("src_port", {})
                    c1 = s.setdefault(a.src_port, 0)
                    s[a.src_port] = c1 + 1
                    d = stats[k].setdefault("dst_port", {})
                    c2 = d.setdefault(a.dst_port, 0)
                    d[a.dst_port] = c2 + 1

            return json.dumps(self.all_stats)
        return None

    def track(self, id, pkt):
        if id in self.existing_name(self.all_stats):
            root = self.get_name(id, self.all_stats)
        else:
            root = {"name": id, "children": []}
            self.all_stats.append(root)

        header_list = [p.protocol_name  for p in pkt.protocols if isinstance(p, packet_base.PacketBase)]

        for k in header_list:
            if k in self.existing_name(root['children']):
                root = self.get_name(k, root['children'])
            else:
                new_root = {"name": k, "children": []}
                root['children'].append(new_root)
                root = new_root
        
        c = root.setdefault('count', 0)
        root['count'] = c + 1


        return json.dumps(self.all_stats)

    def existing_name(self, lst):
        for n in lst:
            yield n['name']

    def get_name(self, name, lst):
        for n in lst:
            if n.get('name', None) == name:
                return n
        return None
