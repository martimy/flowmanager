# Port Mirroring
In order to analyze network traffic passing through certain switch port(s), it’s necessary to connect the network analyzer to the switch and copy all packets flowing through the inspected port(s) to the network analyzer's port. This is generally known as port mirroring.

Port mirroring can be easily implemented using the FlowManager in just few flow entries. To make things simple, we will assume that our OpenFlow switch has only three data ports, All traffic the enters port 1 must exit through port 2 and vice versa. Port 3 will connect to the network analyzer so it will receive a copy of all packets going in either direction.

Using the FlowManager, create this flow entry to forward all packets received from port 1 to ports 2 and 3:
* Match Fields:
  * in_port = 1
* Instructions:
  * Apply Actions: OUTPUT = 2, OUTPUT = 3
* Priority: 100

The second entry will do the opposite:
* Match Fields:
  * in_port = 2
* Instructions:
  * Apply Actions: OUTPUT = 1, OUTPUT = 3
* Priority: 100

Finally, we need to drop any traffic coming from port 3:
* Match Fields:
  * in_port = 3
* Instructions:
  * Apply Actions: <None>
* Priority: 0
