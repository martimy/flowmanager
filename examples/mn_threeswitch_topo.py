#!/usr/bin/python3

# Copyright (c) 2018-2026 Maen Artimy

from mininet.topo import Topo
from mininet.net import Mininet
from mininet.node import RemoteController
from mininet.node import OVSSwitch
from mininet.link import TCLink
from mininet.log import setLogLevel
from mininet.cli import CLI


"""
Create Mininet network topology of three switches connected and four
hosts. The switches are daisychained and two hosts are connected to
each edge switch.
"""


class NetworkTopo(Topo):
    """
    Defines a Mininet topology.
    """

    def build(self, **_opts):

        # Create switches
        s1, s2, s3 = [self.addSwitch(f"sw{s}") for s in range(1, 4)]

        # Create hosts
        h1, h2, h3, h4 = [
            self.addHost(f"h{h}", mac=f"00:00:00:00:00:0{h}") for h in range(1, 5)
        ]

        # Create switch-host links
        self.addLink(s2, h1, 1, 1)
        self.addLink(s2, h2, 2, 1)
        self.addLink(s3, h3, 1, 1)
        self.addLink(s3, h4, 2, 1)

        # Create switch-switch links
        self.addLink(s2, s1, 3, 1)
        self.addLink(s3, s1, 3, 2)


def setIPAddresses(net):
    """
    Set IP addresses for hosts as required.
    """

    net.get("h1").setIP("192.168.1.2/24", intf="h1-eth1")
    net.get("h2").setIP("192.168.1.3/24", intf="h2-eth1")
    net.get("h3").setIP("192.168.1.4/24", intf="h3-eth1")
    net.get("h4").setIP("192.168.1.5/24", intf="h4-eth1")


def create_mininet_network():
    """
    Launch a Mininet topology.
    """

    topo = NetworkTopo()
    net = Mininet(topo=topo, controller=RemoteController, link=TCLink, switch=OVSSwitch)
    setIPAddresses(net)
    net.start()
    CLI(net)
    net.stop()


if __name__ == "__main__":
    # run using:
    # sudo /path/mn_threeswitch_topo.py

    setLogLevel("info")
    create_mininet_network()
