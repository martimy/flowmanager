# Implementing a Hub
To implement a hub using the FlowManager, the controller must insert an OpenFlow entry into the OpenFlow switch to tell the switch to forward copies of any incoming packet to all ports of the switch except the port from which the packet came.

To proceed, the FlowManager must be running in an environment that include an OpenFlow switch and two or more hosts connected to it.

## Adding a Flow Entry
Use the FLowManager’s Flow Control page to add the following flow entry
* Switch ID: \<switch id>
* Match Fields: ANY
* Instructions:
    * Apply Actions: OUTPUT = FLOOD
* Priority: 0

You will notice that there are many other fields in the flow form. Simply leave all but the above fields blank for now and add the flow. Verify the that flow entry has been added correctly by visiting the Flows’ page and confirming that the added flow appears in the flow table.

## Test the implementation
Ping from one host to another. The ping should be successful. Also, if you go back to Flow Monitor view, you will see the Packet and Byte counters have been incremented.

## What happened?
When packets arrive at the switch, they are matched against the flow entries in Flow Table 0. If a match is found, the instructions associated with the entry are applied to the packet. In this case, there is only one entry, and it matches any packet. The instruction in the entry will forward the packet to the output port, FLOOD. This is a reserved port number that tells the switch to send the packet out all standard ports except the ingress port and the ports that are blocked (by the spanning tree protocol, if it is implemented).
