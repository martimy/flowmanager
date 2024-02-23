# Copyright (c) 2018-2023 Maen Artimy
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
This module receives all API requests
"""

from curses.ascii import isdigit
import sys
import random
import logging

from ryu.base import app_manager
from ryu.lib import ofctl_v1_3
from ryu.topology.api import get_all_switch, get_all_link, get_all_host
from flowtracker import Tracker


PYTHON3 = sys.version_info > (3, 0)
logger = logging.getLogger("flowmanager")


class CtrlApi:

    MAGIC_COOKIE = 0x00007AB700000000

    def __init__(self, app):
        """Constructor"""
        self.app = app
        # dpset will be removed eventually
        self.dpset = self.app.dpset
        self.ofctl = ofctl_v1_3
        self.waiters = {}
        self.rpc_clients = []
        self.tracker = Tracker()

        self.port_id = {
            "IN_PORT": 0xFFFFFFF8,
            "TABLE": 0xFFFFFFF9,
            "NORMAL": 0xFFFFFFFA,
            "FLOOD": 0xFFFFFFFB,
            "ALL": 0xFFFFFFFC,
            "CONTROLLER": 0xFFFFFFFD,
            "LOCAL": 0xFFFFFFFE,
            "ANY": 0xFFFFFFFF,
        }

        self.reqfunction = {
            "switchdesc": self.ofctl.get_desc_stats,
            "portdesc": self.ofctl.get_port_desc,
            "portstat": self.ofctl.get_port_stats,
            "flowsumm": self.ofctl.get_aggregate_flow_stats,
            "flowstat": self.ofctl.get_flow_stats,
            "tablestat": self.ofctl.get_table_stats,
            "tablefeature": self.ofctl.get_table_features,
            "queueconfig": self.ofctl.get_queue_config,
            "queuestat": self.ofctl.get_queue_stats,
            "meterstat": self.ofctl.get_meter_stats,
            "meterconfig": self.ofctl.get_meter_config,
            "meterfeatures": self.ofctl.get_meter_features,
            "groupdesc": self.ofctl.get_group_desc,
            "groupstat": self.ofctl.get_group_stats,
            "groupfeatures": self.ofctl.get_group_features,
            "role": self.ofctl.get_role,
        }

        # Get log file path
        handler = logger.handlers[0]
        self.logfile = handler.baseFilename

        logger.debug("Created Ctrl_Api")

    def get_tracker(self):
        return self.tracker

    def get_waiters(self):
        """Returns list of waiters"""
        return self.waiters

    def get_actions(self, parser, action_set):
        """TBD"""
        actions = []
        a_dict = {
            "SET_FIELD": (parser.OFPActionSetField, "field"),
            "COPY_TTL_OUT": (parser.OFPActionCopyTtlOut, None),
            "COPY_TTL_IN": (parser.OFPActionCopyTtlIn, None),
            "POP_PBB": (parser.OFPActionPopPbb, None),
            "PUSH_PBB": (parser.OFPActionPushPbb, "ethertype"),
            "POP_MPLS": (parser.OFPActionPopMpls, "ethertype"),
            "PUSH_MPLS": (parser.OFPActionPushMpls, "ethertype"),
            "POP_VLAN": (parser.OFPActionPopVlan, None),
            "PUSH_VLAN": (parser.OFPActionPushVlan, "ethertype"),
            "DEC_MPLS_TTL": (parser.OFPActionDecMplsTtl, None),
            "SET_MPLS_TTL": (parser.OFPActionSetMplsTtl, "mpls_ttl"),
            "DEC_NW_TTL": (parser.OFPActionDecNwTtl, None),
            "SET_NW_TTL": (parser.OFPActionSetNwTtl, "nw_ttl"),
            "SET_QUEUE": (parser.OFPActionSetQueue, "queue_id"),
            "GROUP": (parser.OFPActionGroup, "group_id"),
            "OUTPUT": (parser.OFPActionOutput, "port"),
        }

        for action in action_set:
            key = list(action.keys())[0]  # There should be only one key
            value = action[key]
            if key in a_dict:
                found_action = a_dict[key][0]  # the action
                if a_dict[key][1]:  # check if the action needs a value
                    kwargs = {}
                    if a_dict[key][1] == "field":
                        a_value = value.split("=")
                        val = 0
                        if len(a_value) > 1:
                            x = a_value[1]
                            val = (
                                int(x)
                                if x.isdigit()
                                else int(x, 16)
                                if x.startswith("0x")
                                else x
                            )
                        kwargs = {a_value[0]: val}
                    elif a_dict[key][1] == "port":
                        a_value = value.upper()
                        val = (
                            self.port_id[a_value]
                            if a_value in self.port_id
                            else int(a_value)
                        )
                        kwargs = {a_dict[key][1]: val}
                    elif a_dict[key][1] == "ethertype":
                        ethertype = (
                            int(value)
                            if value.isdigit()
                            else int(value, 16)
                            if value.startswith("0x")
                            else value
                        )
                        kwargs = {a_dict[key][1]: ethertype}
                    else:
                        kwargs = {a_dict[key][1]: int(value)}
                    actions.append(found_action(**kwargs))
                else:
                    actions.append(found_action())
                print(actions)
            else:
                raise Exception("Action {} not supported!".format(key))
        return actions

    def _get_instructions(self, actions, ofproto, parser):
        """TBD"""
        # instructions
        inst = []
        apply_actions = []
        write_actions = []

        for item in actions:
            # Python 2 has both types
            if isinstance(item, str) or (not PYTHON3 and isinstance(item, unicode)):
                if item.startswith("WRITE_METADATA"):
                    metadata = item.split(":")[1].split("/")
                    # expecting hex data
                    inst += [
                        parser.OFPInstructionWriteMetadata(
                            int(metadata[0], 16), int(metadata[1], 16)
                        )
                    ]
                elif item.startswith("GOTO_TABLE"):
                    table_id = int(item.split(":")[1])
                    inst += [parser.OFPInstructionGotoTable(table_id)]
                elif item.startswith("METER"):
                    meter_id = int(item.split(":")[1])
                    inst += [parser.OFPInstructionMeter(meter_id)]
                elif item.startswith("CLEAR_ACTIONS"):
                    inst += [
                        parser.OFPInstructionActions(ofproto.OFPIT_CLEAR_ACTIONS, [])
                    ]
                else:  # Apply Actions
                    action = item.split(":")
                    apply_actions += [{action[0]: action[1]}]

            elif isinstance(item, dict):  # WRITE ACTIONS
                wractions = item["WRITE_ACTIONS"]
                for witem in wractions:
                    action = witem.split(":")
                    write_actions += [{action[0]: action[1]}]

        if apply_actions:
            applyActions = self.get_actions(parser, apply_actions)
            inst += [
                parser.OFPInstructionActions(ofproto.OFPIT_APPLY_ACTIONS, applyActions)
            ]

        if write_actions:
            writeActions = self.get_actions(parser, write_actions)
            inst += [
                parser.OFPInstructionActions(ofproto.OFPIT_WRITE_ACTIONS, writeActions)
            ]

        return inst

    def read_logs(self):
        items = []
        with open(self.logfile, "r") as my_file:
            while True:
                line = my_file.readline()
                if not line:
                    break
                lst = line.split("\t")
                items.append(lst)
                # items.append(line)
        return items

    # methods linked to web api

    def process_meter_upload(self, configlist):
        """Sends meters to the switch to update meter tables."""
        switches = [str(t[0]) for t in self.get_switches()]
        for swconfig in configlist:  # for each
            dpid = list(swconfig.keys())[0]

            if dpid not in switches:
                break

            for flow in swconfig[dpid]:
                flow["dpid"] = dpid
                flow["operation"] = "add"
                _ = self.process_meter_message(flow)
        return "Meters added successfully!"

    def process_group_upload(self, configlist):
        """Sends groups to the switch to update group tables."""
        switches = [str(t[0]) for t in self.get_switches()]
        for swconfig in configlist:  # for each
            dpid = list(swconfig.keys())[0]

            if dpid not in switches:
                break

            for flow in swconfig[dpid]:
                flow["dpid"] = dpid
                flow["operation"] = "add"
                _ = self.process_group_message(flow)
        return "Groups added successfully!"

    def process_flow_upload(self, configlist):
        """Sends flows to the switch to update flow tables."""

        # config_tree = {}
        switches = [str(t[0]) for t in self.get_switches()]
        for swconfig in configlist:  # for each
            dpid = list(swconfig.keys())[0]
            if dpid not in switches:
                break
            for flow in swconfig[dpid]:
                flow["dpid"] = dpid
                flow["operation"] = "add"
                _ = self.process_flow_message(flow)
        return "Flows added successfully!"

    # @set_ev_cls(event.EventSwitchEnter)

    def get_topology_data(self):
        """Get Topology Data"""
        switch_list = get_all_switch(self.app)
        switches = [switch.to_dict() for switch in switch_list]
        links_list = get_all_link(self.app)
        links = [link.to_dict() for link in links_list]
        host_list = get_all_host(self.app)

        # To remove hosts that are not removed by controller
        ports = []
        for switch in switch_list:
            ports += switch.ports
        port_macs = [p.hw_addr for p in ports]
        n_host_list = [h for h in host_list if h.port.hw_addr in port_macs]

        hosts = [h.to_dict() for h in n_host_list]
        return {"switches": switches, "links": links, "hosts": hosts}

    def delete_flow_list(self, flowlist):
        """Delete a set of flows"""
        for item in flowlist:
            item["operation"] = "delst"
            _ = self.process_flow_message(item)

            # if the flow was monitored
            if item["cookie"] & self.MAGIC_COOKIE == self.MAGIC_COOKIE:
                self.tracker.untrack(item["cookie"])
        return "Flows deleted successfully!"

    def monitor_flow_list(self, flowlist):
        """Monitor a Flow"""
        # Here we need to update the flow entries by adding a magic cookie
        # and adding Apply Action: "OUTPUT:CONTROLLER" to the instructions

        for item in flowlist:
            item["operation"] = "add"
            item["cookie"] = self.MAGIC_COOKIE | random.randint(1, 0xFFFFFFFF)
            item["priority"] += 1
            item["idle_timeout"] = 0
            item["hard_timeout"] = 0
            if "OUTPUT:CONTROLLER" not in item["actions"]:
                item["actions"] += ["OUTPUT:CONTROLLER"]
            _ = self.process_flow_message(item)

        return "Flows are monitored!"

    def rest_flow_monitoring(self, req):
        """Reset Flow Monitoring"""
        cookie = req["cookie"]
        if cookie == "default":
            self.tracker.reset(self.MAGIC_COOKIE)
        else:
            self.tracker.reset(int(cookie))

        return ""

    def get_switches(self):
        """Returns switch infor."""
        return self.dpset.get_all()

    def get_stats(self, req, dpid):
        """Returns various stats"""
        data_path = self.dpset.get(int(str(dpid), 0))
        if not data_path:
            return
        if req == "flows":
            return self.ofctl.get_flow_stats(data_path, self.waiters)
        elif req == "groups":
            return {
                "desc": self.ofctl.get_group_desc(data_path, self.waiters),
                "stats": self.ofctl.get_group_stats(data_path, self.waiters),
            }
        elif req == "meters":
            return {
                "desc": self.ofctl.get_meter_config(data_path, self.waiters),
                "stats": self.ofctl.get_meter_stats(data_path, self.waiters),
            }

    def get_stats_request(self, request, dpid):
        """Get stats using ryu's api"""
        data_path = self.dpset.get(dpid)
        func = self.reqfunction.get(request, None)
        if data_path and func:
            return func(data_path, self.waiters)
        return None

    def process_flow_message(self, flow_entry):
        """Process Flow Mod message"""
        dpid = int(flow_entry.get("dpid", 0))
        data_path = self.dpset.get(dpid)
        if not data_path:
            return "Datapath does not exist!"

        ofproto = data_path.ofproto
        parser = data_path.ofproto_parser

        command = {
            "add": ofproto.OFPFC_ADD,
            "mod": ofproto.OFPFC_MODIFY,
            "modst": ofproto.OFPFC_MODIFY_STRICT,
            "del": ofproto.OFPFC_DELETE,
            "delst": ofproto.OFPFC_DELETE_STRICT,
        }

        # Initialize arguments for the flow mod message
        msg_kwargs = {
            "datapath": data_path,
            "command": command.get(flow_entry["operation"], ofproto.OFPFC_ADD),
            "buffer_id": ofproto.OFP_NO_BUFFER,
        }

        msg_kwargs["table_id"] = flow_entry.get("table_id", 0)

        # Match fields
        mf = flow_entry.get("match", None)
        # convert port names to numbers
        if "in_port" in mf:
            x = mf["in_port"]
            mf["in_port"] = self.port_id[x] if x in self.port_id else x
        # convert masks to tuples
        for f in mf:
            mask_pos = str(mf[f]).find("/")
            if mask_pos >= 0:
                parts = mf[f].split("/")
                mf[f] = (parts[0], parts[1])
            if str(mf[f]).startswith("0x"):
                mf[f] = int(mf[f], 16)

        msg_kwargs["match"] = parser.OFPMatch(**mf) if mf else None

        msg_kwargs["hard_timeout"] = flow_entry.get("hard_timeout", 0)
        msg_kwargs["idle_timeout"] = flow_entry.get("idle_timeout", 0)
        msg_kwargs["priority"] = flow_entry.get("priority", 0)
        msg_kwargs["cookie"] = flow_entry.get("cookie", 0)
        msg_kwargs["cookie_mask"] = flow_entry.get("cookie_mask", 0)
        op = flow_entry.get("out_port", -1)  # make it 0
        og = flow_entry.get("out_group", -1)
        msg_kwargs["out_port"] = ofproto.OFPP_ANY if op <= 0 else op
        msg_kwargs["out_group"] = ofproto.OFPG_ANY if og <= 0 else og

        # instructions
        inst = []
        if "actions" in flow_entry:  # Ryu's format
            inst = self._get_instructions(flow_entry["actions"], ofproto, parser)
        else:  # FlowManager's format
            # Goto meter
            if ("meter_id" in flow_entry) and flow_entry["meter_id"]:
                inst += [parser.OFPInstructionMeter(flow_entry["meter_id"])]
            # Apply Actions
            if ("apply" in flow_entry) and flow_entry["apply"]:
                applyActions = self.get_actions(parser, flow_entry["apply"])
                inst += [
                    parser.OFPInstructionActions(
                        ofproto.OFPIT_APPLY_ACTIONS, applyActions
                    )
                ]
            # Clear Actions
            if ("clearactions" in flow_entry) and flow_entry["clearactions"]:
                inst += [parser.OFPInstructionActions(ofproto.OFPIT_CLEAR_ACTIONS, [])]
            # Write Actions
            if ("write" in flow_entry) and flow_entry["write"]:
                # bc actions must be unique they are in dict
                # from dict to list
                toList = [{k: flow_entry["write"][k]} for k in flow_entry["write"]]
                # print(toList)
                writeActions = self.get_actions(parser, toList)
                inst += [
                    parser.OFPInstructionActions(
                        ofproto.OFPIT_WRITE_ACTIONS, writeActions
                    )
                ]
            # Write Metadata
            if ("metadata" in flow_entry) and flow_entry["metadata"]:
                meta_mask = flow_entry.get("metadata_mask", 0)
                inst += [
                    parser.OFPInstructionWriteMetadata(
                        flow_entry["metadata"], meta_mask
                    )
                ]
            # Goto Table Metadata
            if ("goto" in flow_entry) and flow_entry["goto"]:
                inst += [parser.OFPInstructionGotoTable(table_id=flow_entry["goto"])]

        msg_kwargs["instructions"] = inst

        # Flags
        flags = 0
        flags += 0x01 if flow_entry.get("SEND_FLOW_REM", False) else 0
        flags += 0x02 if flow_entry.get("CHECK_OVERLAP", False) else 0
        flags += 0x04 if flow_entry.get("RESET_COUNTS", False) else 0
        flags += 0x08 if flow_entry.get("NO_PKT_COUNTS", False) else 0
        flags += 0x10 if flow_entry.get("NO_BYT_COUNTS", False) else 0

        msg_kwargs["flags"] = flags

        # ryu/ryu/ofproto/ofproto_v1_3_parser.py
        msg = parser.OFPFlowMod(**msg_kwargs)
        try:
            data_path.send_msg(msg)  # ryu/ryu/controller/controller.py
        except KeyError as err:
            return "Unrecognized field " + err.__repr__()
        except Exception as err:
            print(msg)
            return "Error " + err.__repr__()

        return "Message sent successfully."

    def process_group_message(self, d):
        """Sends group form data to the switch to update group tables."""
        dpid = int(d.get("dpid", 0))
        data_path = self.dpset.get(dpid)
        if not data_path:
            return "Datapath does not exist!"

        ofproto = data_path.ofproto
        parser = data_path.ofproto_parser

        command = {
            "add": ofproto.OFPGC_ADD,
            "mod": ofproto.OFPGC_MODIFY,
            "del": ofproto.OFPGC_DELETE,
        }

        cmd = command.get(d["operation"], ofproto.OFPGC_ADD)

        type_convert = {
            "ALL": data_path.ofproto.OFPGT_ALL,
            "SELECT": data_path.ofproto.OFPGT_SELECT,
            "INDIRECT": data_path.ofproto.OFPGT_INDIRECT,
            "FF": data_path.ofproto.OFPGT_FF,
        }

        gtype = type_convert.get(d["type"])

        group_id = d["group_id"]

        buckets = []
        for bucket in d["buckets"]:
            weight = bucket.get("weight", 0)
            watch_port = bucket.get("watch_port", ofproto.OFPP_ANY)
            watch_group = bucket.get("watch_group", data_path.ofproto.OFPG_ANY)
            actions = []
            if bucket["actions"]:
                actions_list = []
                if isinstance(bucket["actions"][0], str) or (
                    not PYTHON3 and isinstance(bucket["actions"][0], unicode)
                ):
                    # Ryu's format
                    for i in bucket["actions"]:
                        x = i.split(":", 1)
                        y = (
                            x[1].replace("{", "").replace("}", "").strip()
                            if len(x) > 1
                            else ""
                        )
                        y = y.replace(":", "=", 1) if x[0] == "SET_FIELD" else y
                        actions_list.append({x[0]: y})
                else:  # FlowManager's format
                    actions_list = bucket["actions"]
                actions = self.get_actions(parser, actions_list)
                buckets.append(
                    data_path.ofproto_parser.OFPBucket(
                        weight, watch_port, watch_group, actions
                    )
                )

        # print(dp, cmd, gtype, group_id, buckets)
        group_mod = parser.OFPGroupMod(data_path, cmd, gtype, group_id, buckets)

        try:
            data_path.send_msg(group_mod)  # ryu/ryu/controller/controller.py
        except KeyError as err:
            return err.__repr__()
        except Exception as err:
            return err.__repr__()

        return "Message sent successfully."

    def process_meter_message(self, d):
        """Sends meter form data to the switch to update meter table."""
        dpid = int(d.get("dpid", 0))
        data_path = self.dpset.get(dpid)
        if not data_path:
            return "Datapath does not exist!"

        ofproto = data_path.ofproto
        parser = data_path.ofproto_parser

        command = {
            "add": ofproto.OFPMC_ADD,
            "mod": ofproto.OFPMC_MODIFY,
            "del": ofproto.OFPMC_DELETE,
        }
        cmd = command.get(d["operation"], ofproto.OFPMC_ADD)

        meter_id = d["meter_id"]

        flags = 0
        bands = []
        if "flags" in d:  # Ryu's format
            print(d["flags"])
            for f in d["flags"]:
                flags += 0x01 if f == "KBPS" else 0
                flags += 0x02 if f == "PKTPS" else 0
                flags += 0x04 if f == "BURST" else 0
                flags += 0x08 if f == "STATS" else 0

            for band in d["bands"]:
                if band["type"] == "DROP":
                    bands += [
                        parser.OFPMeterBandDrop(
                            rate=band["rate"], burst_size=band["burst_size"]
                        )
                    ]
                elif band["type"] == "DSCP_REMARK":
                    bands += [
                        parser.OFPMeterBandDscpRemark(
                            rate=band["rate"],
                            burst_size=band["burst_size"],
                            prec_level=band["prec_level"],
                        )
                    ]

        else:  # FlowManager's format
            flags += 0x01 if d["OFPMF_KBPS"] else 0
            flags += 0x02 if d["OFPMF_PKTPS"] else 0
            flags += 0x04 if d["OFPMF_BURST"] else 0
            flags += 0x08 if d["OFPMF_STATS"] else 0

            # Flags must have KBPS or PKTPS
            flags = flags if (flags & 0x03) else (flags | 0x01)

            for band in d["bands"]:
                # mtype = type_convert.get(band[0])
                if band[0] == "DROP":
                    bands += [parser.OFPMeterBandDrop(rate=band[1], burst_size=band[2])]
                elif band[0] == "DSCP_REMARK":
                    bands += [
                        parser.OFPMeterBandDscpRemark(
                            rate=band[1], burst_size=band[2], prec_level=band[3]
                        )
                    ]

        meter_mod = parser.OFPMeterMod(data_path, cmd, flags, meter_id, bands)
        try:
            data_path.send_msg(meter_mod)
        except KeyError as err:
            return err.__repr__()
        except Exception as err:
            return err.__repr__()

        return "Message sent successfully."

    # def get_flow_stats(self, req, dpid): # unused
    #     flow = {}  # no filters
    #     dp = self.dpset.get(int(str(dpid), 0))
    #     return self.ofctl.get_flow_stats(dp, self.waiters, flow)


# This is is needed for get_topology_data()
app_manager.require_app("ryu.topology.switches", api_style=True)
