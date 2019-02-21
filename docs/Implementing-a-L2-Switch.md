# Implementing a switch

A L2 switch avoids flooding the network with packets by finding out where a packet must be sent. For that purpose, a switch maintains the MAC address forwarding table. The forwarding table is usually learned by the switch over time, but it may also be configured by an administrator.

When a packet arrives at one of the ports of the switch, the switch checks the source MAC address of the packet. If the address is not in the table already, it will be recorded along with the ingress switch port in the forwarding table. The switch also searches for the packet destination MAC address in its forwarding table to find the associated port number. If the address is not found, the switch uses flooding to forward the packet through all ports except the ingress port as was the case with the hub. Otherwise, the packet is forwarded through the port found in the table. Eventually, as this process continues, the switch will learn the ports associated with each connected device and the flooding is no longer needed.

An OpenFlow switch does not have a mechanism to create a forwarding table, so the table must be maintained by the controller or embedded in the flow tables.
In the next sections, you will implement a switch using the FlowManager.

## Adding a Table-Miss Entry
When a packet arrives at the Openflow switch, the packet header fields are matched against current flow table entries. If a matching entry is found, the switch applies the set of instructions associated with the matching flow entry and updates its counters. If no match is found, the switch will follow a default behaviour, which may require dropping the packet.

A table-miss entry (introduced in OFv1.3) is a required entry that specifies a set of instructions to be performed when no other match is found for an incoming packet. The table-miss flow entry uses standard OpenFlow instructions and actions to process packets. Example of these actions include: dropping the packet, sending the packet out on all interfaces, or forwarding the packet to the controller. The table-miss flow entry is simply an entry that has all wildcard (ANY) match fields, and the lowest priority flow entry in the table.

Here we will use FlowManager to implement a simple layer 2 switch. The first step in this implementation is to add a table miss entry that floods any incoming packet to all, non-ingress, ports and forwards a copy of it to the controller.
In our implementation of the switch, the table-miss entry includes the following:
* Match Fields: ANY
* Instructions:
   * Apply Actions: OUTPUT = CONTROLLER, OUTPUT = FLOOD
* Priority: 0

Test the behavior of the switch before and after adding the table miss entry by pinging between two hosts. Ping will be successful after adding the entry (because the table-miss entry allows the switch to act as a hub). Also, you will see the packet and byte count of the entry increasing after each ping.

In the messages view of the FlowManager, you will see the Packet_In messages coming to the application.
Note the source and destination MAC addresses and the ingress port of the incoming packets. This packet is flooded because the switch does not know the specific port to which the packet should be forwarded.

To tell the switch how to forward future packets of the same parameters, add a flow entry that includes the following fields:
* Match Fields:
    * eth_src = \<Source MAC address of the incoming packet>
    * eth_dst = \<Destination MAC address of the incoming packet>
    * in_port = \<ingress port of the packet>
* Instructions:
    * Apply Actions: OUTPUT = \<the port number of the destination host>
* Priority: 100

After you add the flow entry (entries) to the table, any ingress packet whose destination MAC address is found in the Match field of newly added entries will be forwarding to the port designated in that entry. The higher priority level will ensure that these entries are matched before the table miss entry. Eventually no Packet_In messages are received by the application if all destinations are known to the switch.

Note that this process resembles a network administrator configuring the MAC table manually by knowing the MAC address of each host and to which switch port it is connected.

## Flooding Multicast and Broadcast Packets
Multicast and broadcast packets do not match any of the flow entries that are inserted in the flow table; therefore, the packets match only the table miss entry and they will be sent to the controller. Sending these packets repeatedly to the controller burdens the controller without any benefits. To prevent that from happening, you have to add flow entries for packets that has multicast destination addresses to flood these packets without sending them to the controller.

Since multicast MAC address ranges are known, the controller may insert flow entries in advance (i.e. proactively). These flows will either forward the multicast packets or drop them, depending on the type of multicast. Here is one example:
Add the following flow entry to flood packets whose destination address is broadcast:
* Match Fields: eth_dst = ff:ff:ff:ff:ff:ff
* Instructions:
    * Apply Actions: OUTPUT = FLOOD
* Priority: 100

## Conclusion
Although this switch implementation works by embedding the MAC table in the flow table, a few issues arise:
* The administrator must enter all these flow entries manually, which is impractical for a production network.
* There must be a flow entry for every pair of communicating hosts. This means for N number of hosts, there will be the need for N^2/2 flow entries. As the number of hosts increases, the flow table size grows exponentially.
* If a host is moved from one port to another, the packets originated from the host or destined to it will not match any existing flow entry except the table-miss entry, which means they must be flooded.
