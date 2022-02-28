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


// Main code to handle group tables
$(function () {
    var tabsObj = new Tabs('switches');
    var tablesObj = new Tables('group');
   
    var header_of13 = {"bucket": ["Bucket", 'number'],
                        "weight": ["Weight", "number"],
                        "watch_group": ["Watch\nGroup", "number"],
                        "watch_port": ["Watch\nPort", "number"],
                        "actions": ["Actions", "alphanum"],
                        "packet_count": ["Packet\nCount", "number"], 
                        "byte_count": ["Byte\nCount", "number"]};
                        
    // Table Header Mapping Function
    function headerMapping(orgstr) {
        var map = header_of13;
        var newstr = map[orgstr] != null ? map[orgstr][0] : hc(orgstr);
        var newtype = map[orgstr] != null ? map[orgstr][1] : "number";
        return [newstr, newtype];
    };

    var footer = {"type": "Type", "duration_sec": "Duration", "ref_count": "References"};
    
    // Table Footer Mapping Function
    function footerMapping(orgstr) {
        var map = footer;
        var newstr = map[orgstr] != null ? map[orgstr] : hc(orgstr);
        return newstr;
    }

    // Create Group Table database
    function buildGroupTables(dpid, grplist) {
        var thelist = JSON.parse(fix_compatibility(JSON.stringify(grplist)));

        var fields = Object.keys(header_of13);
        var dp_tables = {};

        thelist.forEach(function(group) {
            var table_id = group['group_id'];
            // if table obj has not been created yet
            if (!dp_tables[table_id]) { 
                dp_tables[table_id] = new DPTable(table_id, "groups", "Group", fields, [], {});
                dp_tables[table_id].extra.labels = Object.keys(footer);
                dp_tables[table_id].extra.data = group;
            }
                       
            for(i in group.buckets) {
                var bucket = Object.assign(group.buckets[i], group.bucket_stats[i]);
                bucket.bucket = i;
                dp_tables[table_id].data.push(bucket);
            };

            // delete group.buckets;
            // delete group.bucket_stats;
        });
       
        var $html_code = $('<div></div>');
        for(var i in dp_tables) {
            var dp_table = dp_tables[i];
            tablesObj.makeRows(dpid, dp_table, headerMapping, cellFormating);
            tablesObj.makeFooter(dpid, dp_table, footerMapping, cellFormating);
            var $card = tablesObj.buildTableCard(dp_table);
            $html_code.append($card);
        }
        return $html_code;
    }

    // Get flows data from swicthes
    function loadGroups() {
        getSwitchData(
            "groups",
            function (sw_list) {
                tabsObj.buildTabs("#main", sw_list, "Not groups to show!")
            },
            function (all_groups) {
                for(var i in all_groups) {
                    var stats = all_groups[i].stats;
                    var desc = all_groups[i].desc;
                    var sw = Object.keys(desc)[0] // the first key is the datapath id
                    
                    var groups = [];
                    for(i in desc[sw]) {
                        groups.push(Object.assign(desc[sw][i], stats[sw][i]))
                    };
                    if(groups.length > 0) {
                        var $html_code = buildGroupTables(sw, groups);
                        tabsObj.buildContent(sw, $html_code);
                    }
                }
                tabsObj.setActive();                
            }
        );
    }
        
    // When the refresh button is clicked, clear the page and start over
    $("[name='refresh']").on('click', function() {
        loadGroups();
    })

    loadGroups();


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
