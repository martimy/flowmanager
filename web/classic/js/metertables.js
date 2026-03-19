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
    var tablesObj = new Tables('meter');

    var header_of13 = {"band": ["Band", 'number'],
                        "type": ["Type", "number"],
                        "rate": ["Rate", "number"],
                        "burst_size": ["Burst Size", "number"],
                        "prec_level": ["Prec Level", "number"]};

    // Table Header Mapping Function
    function headerMapping(orgstr) {
        var map = header_of13;
        var newstr = map[orgstr] != null ? map[orgstr][0] : hc(orgstr);
        var newtype = map[orgstr] != null ? map[orgstr][1] : "number";
        return [newstr, newtype];
    };

    var footer = {"flow_count": "Flow Count", "packet_in_count": "Packets", "byte_in_count": "Bytes", "duration_sec": "Duration", "flags": "Flags"};

    // Table Footer Mapping Function
    function footerMapping(orgstr) {
        var map = footer;
        var newstr = map[orgstr] != null ? map[orgstr] : hc(orgstr);
        return newstr;
    }

    // Format the cell content
    function meterCellFormating(cell) {
        var newcell = cell;
        if(Array.isArray(cell)) {
            newcell = JSON.stringify(cell);
            newcell = newcell.replace(/^\[/,'').replace(/\]$/,'').replace(/"/g,'');
        }
        return newcell;
    }

    // Create Meter Table database
    function buildMeterTables(dpid, mtrlist) {
        var thelist = JSON.parse(fix_compatibility(JSON.stringify(mtrlist)));

        var fields = Object.keys(header_of13);
        var dp_tables = {};

        thelist.forEach(function(meter) {
            var table_id = meter['meter_id'];
            // if table obj has not been created yet
            if (!dp_tables[table_id]) {
                dp_tables[table_id] = new DPTable(table_id, "meters", "Meter", fields, [], {});
                dp_tables[table_id].extra.labels = Object.keys(footer);
                dp_tables[table_id].extra.data = meter;
            }

            for(i in meter.bands) {
                var band = Object.assign(meter.bands[i], meter.band_stats[i]);
                band.band = i;
                dp_tables[table_id].data.push(band);
            };

            // delete group.buckets;
            // delete group.bucket_stats;
        });

        var $html_code = $('<div></div>');
        for(var i in dp_tables) {
            var dp_table = dp_tables[i];
            tablesObj.makeRows(dpid, dp_table, headerMapping, cellFormating);
            tablesObj.makeFooter(dpid, dp_table, footerMapping, meterCellFormating);
            var $card = tablesObj.buildTableCard(dp_table);
            $html_code.append($card);
        }
        return $html_code;
    }

    // Get flows data from swicthes
    function loadMeters() {
        getSwitchData(
            "meters",
            function (sw_list) {
                tabsObj.buildTabs("#main", sw_list, "Not meters to show!")
            },
            function (all_meters) {
                for(var i in all_meters) {
                    var stats = all_meters[i].stats;
                    var desc = all_meters[i].desc;
                    var sw = Object.keys(desc)[0] // the first key is the datapath id

                    var meters = [];
                    for(i in desc[sw]) {
                        meters.push(Object.assign(desc[sw][i], stats[sw][i]))
                    };
                    if(meters.length > 0) {
                        var $html_code = buildMeterTables(sw, meters);
                        tabsObj.buildContent(sw, $html_code);
                    }
                }
                tabsObj.setActive();
            }
        );
    }

    // When the refresh button is clicked, clear the page and start over
    $("[name='refresh']").on('click', function() {
        loadMeters();
    })

    loadMeters();


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
