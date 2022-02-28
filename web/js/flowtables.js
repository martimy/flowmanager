// Copyright (c) 2018 Maen Artimy
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


// Main code to handle flow tables
$(function () {
    var tabsObj = new Tabs('switches');
    var tablesObj = new Tables('flow');

    // Flow fields supported by OF1.3
    var header_of13 = {
        "priority": ["Priority", "number"],
        "match": ["Match Fields", "alphanum"],
        "cookie": ["Cookie", "number"],
        "duration_sec": ["Duration", "number"],
        "idle_timeout": ["Idle\nTimeout", "number"],
        "hard_timeout": ["Hard\nTimeout", "number"],
        "actions": ["Instructions", "alphanum"],
        "packet_count": ["Packet\nCount", "number"],
        "byte_count": ["Byte\nCount", "number"],
        "flags": ["Flags", "number"]
    }

    // Table Header Mapping Function
    function headerMapping(orgstr) {
        var map = header_of13;
        var newstr = map[orgstr] != null ? map[orgstr][0] : hc(orgstr);
        var newtype = map[orgstr] != null ? map[orgstr][1] : "number";
        return [newstr, newtype];
    }

    // Create Flow Table database
    function buildFlowTables(dpid, flwlist) {
        var thelist = JSON.parse(fix_compatibility(JSON.stringify(flwlist)));

        var fields = Object.keys(header_of13);
        var dp_tables = {};

        thelist.forEach(function (flow) {
            var table_id = flow['table_id'];
            if (!dp_tables[table_id]) {
                dp_tables[table_id] = new DPTable(table_id, "flows", "Flow Table", fields, [], dpid);
            }
            dp_tables[table_id].data.push(flow);
        });

        //console.log(db_tables)
        var $envelope = $('<div></div>');
        for (var i in dp_tables) {
            var dp_table = dp_tables[i]
            tablesObj.makeRows(dpid, dp_table, headerMapping, cellFormating);
            var $card = tablesObj.buildTableCard(dp_table);
            $envelope.append($card);
        }
        return $envelope;
    }

    // Get flows data from swicthes
    function loadFlows() {
        getSwitchData(
            "flows",
            function (sw_list) {
                tabsObj.buildTabs("#main", sw_list, "Not flows to show!");
            },
            function (all_flows) {
                for (var i in all_flows) {
                    var sw = Object.keys(all_flows[i])[0] // the first key is the datapath id
                    var flows = all_flows[i][sw]
                    if (flows.length > 0) {
                        var $envelope = buildFlowTables(sw, flows);
                        tabsObj.buildContent(sw, $envelope);
                    }
                }
                tabsObj.setActive();
            }
        );
    }

    // When the refresh button is clicked, clear the page and start over
    $("[name='refresh']").on('click', function () {
        loadFlows();
    })

    loadFlows();


    // function startRefresh() {
    //     setTimeout(startRefresh,10000);
    //     loadFlows();
    // }

    // startRefresh()

    // function autoRefreshPage() {
    //     loadFlows();
    // }
    // setInterval(loadFlows, 5000);

})
