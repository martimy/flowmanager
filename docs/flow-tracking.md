# Flow Tracking

This feature allows you to display the type and number of packets that matches a flow entry. To use the feature, selecting a flow entry then selecting Monitor option from the table menu.

The FlowManager duplicates the selected flow entry in the table and adds the following:

- priority +1 
- additional action that sends traffic to the controller
- a random cookie 

The above additions ensures the new entry takes priority over the original, and a copy of the packet is sent to the FlowManager.

When a packet matches this new entry, Packet_In is received by the FlowManager, whick tracks all incoming packets using the cookie. The FlowManager creates a tree structure based on the packet headers for the purpose of counting every packet type. 

It is also possible to track all packets that are received by the controller (monitored or not) if a global options is enabled.

The tracked data can be dispalyed in Message page under the Stats tab. The same page can be used to view all log message for all packet-in in the Messages tab.