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


// Generic function to build tables
function Tables(label) {
    var type = label;

    // Create table header and rows and link them to data
    function makeRows(dpid, table, hdr_format, cell_format) {
        // table = { table_id: <table_id>,
        //           fields: <array of strings>,
        //           data: <array of objects> }

        var cols = [];
        var $col = $('<tr></tr>');
        for(var i in table.fields) {
            cols.push(table.fields[i]);
            var $hdr = $('<th></th>');
            var format = hdr_format(table.fields[i]);
            $hdr.text(format[0]);
            $hdr.attr('data-sort', format[1]);
            $col.append($hdr);
        }
        table['$header'] = $col;

        var rows = [];
        table.data.forEach(function(item) {
            var $row = $('<tr></tr>').addClass('editable');
            item.dpid = dpid;
            for(var i in cols) {
                var field = cols[i];
                var txt = cell_format(item[field]);
                $row.append($('<td></td>').text(txt));
            }
            rows.push({
                datum: item,
                $row: $row
            });
        });

        //default sort - works for flows only
        if(type === 'flow') {
            function compare(a,b) {
                return b.datum.priority - a.datum.priority;
            }
            rows.sort(compare);
        }

        table['rows'] = rows;

        //return table;
    }

    function makeFooter(dpid, table, ftr_format, cell_format) {
        var $footer = $('<table></table>').addClass('oneliner');

        var $col = $('<tr></tr>');
        for(var i in table.extra.labels) {
            var item = table.extra.labels[i];
            var $hdr = $('<td></td>');           
            var label = ftr_format(item);
            var data = cell_format(table.extra.data[item]);
            $hdr.text(label + " : " + data);
            $col.append($hdr);
        }
        $footer.append($col);
        table['$footer'] = $footer;
    }

    // Attach event listener
    function eventListener(row) {
        $(row.$row).unbind('click');
        $(row.$row).on('click', function(e) { 
            e.preventDefault();
            sessionStorage.setItem(type, JSON.stringify(row.datum));
            msg = "Table entry copied to session storage.";
            displayMessage(msg+type);
        });
    };

    // Build the table
    function updateTable(dp_table) {
        var $table = $('<table></table>').addClass('sortable').addClass('fixed');
        var $tableHead = $('<thead></thead>');
        var $tableBody = $('<tbody></tbody>');

        $tableHead.append(dp_table.$header);
        if(dp_table.rows) {
            dp_table.rows.forEach(function(row) {
                $tableBody.append(row.$row);
                eventListener(row);
            });
        }
        $table.append($tableHead);
        $table.append($tableBody);
        return $table;
    }

    // Build the card surrounding the table the card 
    // may have additional data, such as caption and stats
    function buildTableCard(dp_table) {
        var $card = $('<div></div>').addClass('card').addClass('wide');
        var $header = $('<div></div>').addClass('header');
        var $container = $('<div></div>').addClass('container');
        var $footer = $('<div></div>').addClass('footing');

        var $title = $('<h1></h1>').text(dp_table.label + ' ' + dp_table.table_id);
        $header.append($title);

        var $table = updateTable(dp_table);
        $container.append($table);

        if(dp_table.$footer) {
            $footer.append(dp_table.$footer);
        }

        $card.append($header);
        $card.append($container);
        $card.append($footer);

        return $card;
    }

    return {
        buildTableCard: buildTableCard,
        makeFooter: makeFooter,
        makeRows: makeRows
    }
}

// Generic function to build tabs
function Tabs() {
    // Create the tab structure
    function htmlCode(tab_names, msg) {
        // Add tab buttons
        var tabs = '<ul class="tab-list">';
        for (var d in tab_names) {
            tabs += '<li class="tab-control" data-tab="tab-' + tab_names[d] + '">SW_' + tab_names[d] + '</li>';
        }
        tabs += '</ul>';

        for (var s in tab_names) {
            //var message = "contenet...";
            tabs += '<div class="tab-panel" id="tab-' + tab_names[s] + '">'+msg+'</div>';
        }
        return tabs;
    }      

    // Listen to user events
    function listenToEvents() {
        // only one tab list is allowed per page
        $('.tab-list').on('click', '.tab-control', function(){
            //var tab_id = $(this).attr('data-tab');
            var tab_id = $(this).data('tab');

            $('.tab-control').removeClass('active');
            $('.tab-panel').removeClass('active');
    
            $(this).addClass('active');
            $("#"+tab_id).addClass('active');
            sessionStorage.setItem('activeTab', tab_id)
        })
    }

    // Append HTML
    function buildTabs(parent, tab_names, msg) {
        var html_code =  htmlCode(tab_names, msg)
        $(parent).empty().append(html_code);
        listenToEvents();
    }

    // Fill tab panel
    function buildContent(id, data) {
        $('#tab-'+id).empty().append(data);
    }

    // Set active tab
    function setActive() {
        $('.tab-control').removeClass('active');
        $('.tab-panel').removeClass('active');

        var tab_id = sessionStorage.getItem('activeTab');
        if(tab_id === null) {
            var $first = $('.tab-control').first();
            //var tab_id = $first.attr('data-tab');
            var tab_id = $first.data('tab');
            $first.addClass('active');
            $("#"+tab_id).addClass('active');
        } else {
            var $first = $('[data-tab='+tab_id+']')
            $first.addClass('active');
            $("#"+tab_id).addClass('active');
        }
    }
  
    return {
      buildTabs: buildTabs,
      buildContent: buildContent,
      setActive: setActive
    };
}

// Display messages
function displayMessage(msg) {
    var $x = $("#snackbar");
    $x.text(msg)
    $x.toggleClass("show");
    setTimeout(function(){ $x.toggleClass("show"); }, 3000);
}

// Download JSON file as text
function downloadFile(filename, data) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

// Generic Datapath Data Object
function DPTable(id, label, fields, data, extra) {
    this.table_id = id;
    this.label = label;
    this.fields = fields;
    this.data = data;
    this.extra = extra;
}

// fix compatibility issue with RYU output
function fix_compatibility(odata) {
    return odata.replace(/dl_/g,'eth_').replace(/nw_/g,'ipv4_');
}

// remove underscore and switch to uppercase
function hc(myString) {
    return myString.replace("_"," ").replace(/\b\w/g, l => l.toUpperCase())
}

// Get information from datapaths
function getSwitchData(request, f, g) {
    $.get("/data","list=switches")
    .done( function(switches) {
        if (!switches) return;

        // Process the switches list
        f(switches);

        var lst = [];
        var all_data = []

        // Request flows from all switches
        for(var sw in switches) {
            lst.push(
                $.get("/status", {status:request, dpid:switches[sw]})
                .done( function(flows) {
                    all_data.push(flows)
                })
                .fail( function() {
                    msg = "Cannot read " + request + " form " + switches[sw] + "!";
                    displayMessage(msg);
                })
            )
        }

        // Wait for all switches to reply 
        $.when.apply(this,lst).then(function() {
            // Process the flows
            g(all_data);
        });

    })
    .fail( function() {
        msg = "Cannot read datapaths!";
        displayMessage(msg);
    })
}

// Format the cell content
function cellFormating(cell) {
    var newcell = cell;

    if(typeof cell === 'object') {
        newcell = JSON.stringify(cell);
        newcell = newcell.replace('{}','ANY').replace('[]','DROP')
                    .replace(/{/g,'').replace(/}/g,'')
                    .replace(/^\[/,'').replace(/\]$/,'')
                    .replace(/":/g,'" = ').replace(/"/g,'')
                    .replace(/,/g,'\n');
    } else if (cell === 4294967295 ) {
        newcell = 'ANY';
    }
    return newcell;
}
