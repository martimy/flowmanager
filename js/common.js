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
function Tables(category) {
    var category = category;

    // Create table header and rows and link them to data
    function makeRows(dpid, table, hdr_format, cell_format) {
        var cols = [];
        var $col = $('<tr></tr>');

        if(category === 'flow') {
            var $checkbox = $('<input type="checkbox" class="checkall"/>');
            var $checktr = $('<th></th>').attr('data-sort', "nosort");
            $checktr.append($checkbox);      
            $col.append($checktr);
        }

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
            var $row = $('<tr></tr>'); //.addClass('editable');
            if(category === 'flow') {
                $row.append($('<td><input type="checkbox" class="rowbox"/></td>'));
            }
            item.dpid = dpid;
            for(var i in cols) {
                var field = cols[i];
                var txt = cell_format(item[field]);
                $row.append($('<td></td>').text(txt));
            }
            rows.push({
                dataitem: item,
                $row: $row
            });
        });

        //default sort - works for flows only
        if(category === 'flow') {
            function compare(a,b) {
                return b.dataitem.priority - a.dataitem.priority;
            }
            rows.sort(compare);
        }
        
        table['rows'] = rows;

        if(typeof($checkbox) !== "undefined") {
            $checkbox.change(function() {
                // Execlude hidden rows
                //$(this).closest('table').find('tr').not('.hiddenrow').find('.rowbox').prop('checked', this.checked);
                $(this).closest('table').find('.rowbox').prop('checked', this.checked);
            });
        }
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

    // Attach event listener for rows
    // function eventListener(row) {
    //     $(row.$row).unbind('click');
    //     $(row.$row).on('click', function(e) { 
    //         e.preventDefault();
    //         sessionStorage.setItem(category, JSON.stringify(row.dataitem));
    //         var msg = "Table entry copied to session storage.";
    //         displayMessage(msg);
    //     });
    // };

    // Build the table
    function updateTable(dp_table) {
        var $table = $('<table></table>').addClass('sortable').addClass('fixed');
        var $tableHead = $('<thead></thead>');
        var $tableBody = $('<tbody></tbody>');

        $tableHead.append(dp_table.$header);
        if(dp_table.rows) {
            dp_table.rows.forEach(function(row) {
                $tableBody.append(row.$row);
                //eventListener(row);
            });
        }
        $table.append($tableHead);
        $table.append($tableBody);
        
        //dp_table['$table'] = $table; //if a reference needs to be kept
        
        return $table;
    }

    // Build the card surrounding the table. The card 
    // may have additional data, such as caption and stats
    function buildTableCard(dp_table) {
        var $card = $('<div></div>').addClass('tableframe');
        var $header = $('<div></div>').addClass('header');
        var $container = $('<div></div>').addClass('container');
        var $footer = $('<div></div>').addClass('footing');

        var $title = $('<h1></h1>').text(dp_table.label + ' ' + dp_table.table_id);
        var $alerts = $('<span class="alert"</span>');
        $header.append($title);
        $header.append($alerts);
        
        if(dp_table.type === "flows") {
            var $menu = getMenu(dp_table);
            $header.append($menu);
        }

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

    function getSelectedRows(dp_table) {
        var selected = [];
        dp_table.rows.forEach(function(item) {
            var $f = item.$row.children(':has(:checkbox:checked)');
            if($f.length>0) {
                selected.push(item);
            }
        });
        return selected;
    }

    function setMenuEvents($list, dp_table) {
        $list.on('click', 'a[href=hide]', function(e) {
            e.preventDefault();
            var selected = getSelectedRows(dp_table);
            selected.forEach(function(row) {
                row.$row.addClass("hiddenrow");
            })
            if(selected.length>0) {
                $(this).closest('.header').find('.alert').text('There are ' + selected.length + ' hidden rows!');
            }
        });

        $list.on('click', 'a[href=unhide]', function(e) {
            e.preventDefault();
            dp_table.rows.forEach(function(row) {
                row.$row.removeClass("hiddenrow");
            });
            $(this).closest('.header').find('.alert').empty();
        });

        $list.on('click', 'a[href=delete]', function(e) {
            e.preventDefault();
            var selected = getSelectedRows(dp_table);
            var flows = [];
            selected.forEach(function(row){
                flows.push(row.dataitem)
            });
            if(flows.length>0) {
                $.post("/flowdel", JSON.stringify(flows))
                .done( function(response) {
                    displayMessage(response);
                    selected.forEach(function(row) {
                        row.$row.addClass("hiddenrow"); //temp
                    })
                })
                .fail( function() {
                    var msg = "No response from controller.";
                    displayMessage(msg);
                })
            }
        });

        $list.on('click', 'a[href=edit]', function(e) {
            e.preventDefault();
            var selected = getSelectedRows(dp_table);
            if(selected.length>0) {
                sessionStorage.setItem(category, JSON.stringify(selected[0].dataitem));
                var msg = "Table entry copied to session storage.";
                displayMessage(msg);
            }
        });

        $list.on('click', 'a', function(e) {
            e.preventDefault();
            var selected = getSelectedRows(dp_table);
        });
    }

    function getMenu(dp_table) {
        var $menu = $('<div></div>').addClass("dropdown");
        var $button = $('<button></button>');
        $button.html('Options');

        var $list = $('<div></div>').addClass("dropdown-content");
        $list.html('<a href="delete">Delete</a> \
            <a href="edit" disabled>Edit</a> \
            <a href="hide">Hide</a> \
            <a href="unhide">Unhide</a>');

        setMenuEvents($list, dp_table);

        $menu.append($button);
        $menu.append($list);
        
        
        return $menu;
    }

    return {
        buildTableCard: buildTableCard,
        makeFooter: makeFooter,
        makeRows: makeRows
    }
}

// Generic function to build tabs
function Tabs(category) {
    var category = category;

    // Create the tab structure
    function htmlCode(tab_labels, msg) {
        // Add tab buttons
        var tabs = '<ul class="tab-list">';
        for (var d in tab_labels) {
            var label = category === 'switches' ? 'SW_' + tab_labels[d] : tab_labels[d];
            tabs += '<li class="tab-control" data-tab="tab-' + tab_labels[d] + '">' + label + '</li>';
        }
        tabs += '</ul>';

        for (var s in tab_labels) {
            //var message = "contenet...";
            tabs += '<div class="tab-panel" id="tab-' + tab_labels[s] + '"><h1>'+msg+'</h1></div>';
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
            sessionStorage.setItem('tab_'+category, tab_id)
        })
    }

    // Append HTML
    function buildTabs(parent, tab_labels, msg) {
        var html_code =  htmlCode(tab_labels, msg)
        $(parent).empty().append(html_code);
        listenToEvents();
    }

    // Fill tab panel
    function buildContent(id, element) {
        $('#tab-'+id).empty().append(element);
    }

    // Set active tab
    function setActive() {
        $('.tab-control').removeClass('active');
        $('.tab-panel').removeClass('active');

        var tab_id = sessionStorage.getItem('tab_'+category);
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
function DPTable(id, type, label, fields, data, extra) {
    this.type = type;
    this.table_id = id;
    this.label = label;
    this.fields = fields;
    this.data = data;
    this.extra = extra;
}

// fix compatibility issue with RYU output
function fix_compatibility(odata) {
    return odata.replace(/dl_/g,'eth_')
                .replace(/nw_/g,'ipv4_')
                .replace(/eth_vlan/g,'vlan_vid')
                .replace(/tp_dst/g,'udp_dst')
                .replace(/ipv4_proto/g,'ip_proto');
}

// remove underscore and switch to uppercase
function hc(myString) {
    return myString.replace("_"," ").replace(/\b\w/g, l => l.toUpperCase())
}

// Get information from datapaths
function getSwitchData(request, f, g) {
    $.get("/data","list=switches")
    .done( function(switches) {
        if($.isEmptyObject(switches)) {
            var msg = "No switches found!";
            displayMessage(msg);
            return
        }

        // Process the switches list
        f(switches);

        var lst = [];
        var all_data = [];

        // Request flows from all switches
        for(var sw in switches) {
            lst.push(
                $.get("/status", {status:request, dpid:switches[sw]})
                .done( function(flows) {
                    all_data.push(flows)
                })
                .fail( function() {
                    var msg = "Cannot read " + request + " form " + switches[sw] + "!";
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
        var msg = "No response from server!";
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

// Table sort
var compare = {                           // Declare compare object
    number: function(a, b) {                  // Add a method called name
      a = Number(a);
      b = Number(b);
      return a - b;
    },
    alphanum: function(a, b) {                  // Add a method called name
      if (a < b) {                          // If value a is less than value b
        return -1;                          // Return -1
      } else {                              // Otherwise
        return a > b ? 1 : 0;               // If a is greater than b return 1 OR
      }                                     // if they are the same return 0
    },
    duration: function(a, b) {              // Add a method called duration
      a = a.split(':');                     // Split the time at the colon
      b = b.split(':');                     // Split the time at the colon
  
      a = Number(a[0]) * 60 + Number(a[1]); // Convert the time to seconds
      b = Number(b[0]) * 60 + Number(b[1]); // Convert the time to seconds
  
      return a - b;                         // Return a minus b
    },
    date: function(a, b) {                  // Add a method called date
      a = new Date(a);                      // New Date object to hold the date
      b = new Date(b);                      // New Date object to hold the date
  
      return a - b;                         // Return a minus b
    }
};
  
$('body').on('click', '.sortable th', function(e) {
    var $header = $(this);                  // Get the header
    var order = $header.data('sort');       // Get value of data-sort attribute
    var column;                             // Declare variable called column
    var $table = $header.parents('table');
    var $tbody = $table.find('tbody');        // Store table body
    var $controls = $table.find('th');        // Store table headers
    var rows = $tbody.find('tr').toArray();   // Store array containing rows

    // If selected item has ascending or descending class, reverse contents
    if ($header.is('.ascending') || $header.is('.descending')) {
        $header.toggleClass('ascending descending');    // Toggle to other class
        $tbody.append(rows.reverse());                // Reverse the array
    } else if(order !== "nosort") {                 // Otherwise perform a sort
        $header.addClass('ascending');                // Add class to header
        // Remove asc or desc from all other headers
        $header.siblings().removeClass('ascending descending');
        if (compare.hasOwnProperty(order)) {  // If compare object has method
        column = $controls.index(this);     // Search for column's index no

        rows.sort(function(a, b) {               // Call sort() on rows array
            a = $(a).find('td').eq(column).text(); // Get text of column in row a
            b = $(b).find('td').eq(column).text(); // Get text of column in row b
            return compare[order](a, b);           // Call compare method
        });

        $tbody.append(rows);
        }
    }
});
  