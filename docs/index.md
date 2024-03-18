# Introduction

Welcome to the FlowManager documentation.

Here are some quick notes about using the app:

- The home page shows general information about the active switches in the topology. More details will be added.
- The Flows, Groups, and Meters pages show the table contents for each active switch.
- The Flow control page offers a form to add/modify/delete flow entries.
- The Group control page offers a form to add/modify/delete groups with a maximum of three buckets each.
- The Meter control pages offers a for to add/modify/delete meters.
- The Topology page shows the switches, the links between the switches and any attached hosts under teh Graph tab. It needs LLDP to work properly, you must run ryu-manager with *--observe-links* option. The Tables tab shows the topology in raw JSON.
- The Messages page shows messages and notification received by the app (Packet_In and some error messages). The page slows show the stats collected from monitored flows.
- The About page shows the License notices.

## Components

![Components](http://adhocnode.com/wp-content/uploads/2018/06/FlowManager.png)

## Recommended Environments

This application is recommended for use in a lab environment similar to the following:

- [Creating an SDN testbed](Testbed.md) by Diarmuid O Briain
- [Building an OpenFlow Lab](http://adhocnode.com/building-openflow-lab/) by Maen Artimy.

## Applications

The FlowManager can be used for many applications including the following:

- [Implementing a Hub](Implementing-a-Hub.md)
- [Implementing a Switch](Implementing-a-L2-Switch.md)
- [Port Mirroring](Port-mirroring.md)
- [Flow Tracking](flow-tracking.md)
