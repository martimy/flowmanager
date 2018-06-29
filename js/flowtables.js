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


$(function () {
  var tabsObj = new CommonTabs();
  var tableObj = new CommonTables();

  // Create Flow Tables
  function buildFlowTables(response) {
    // Flow table headers. Missing: "duration_nsec", "length", "table_id"
    var col = ["priority", "match", "cookie", "duration_sec", "idle_timeout", "hard_timeout", "actions", "packet_count", "byte_count", "flags"]

    // Get the table contents from the controller's response
    dpid = parseInt(Object.keys(response)[0]);

    var rows = Object.values(response)['0'];
    var tables = {};
    for (var t=0; t<rows.length; t++) {
      var tb = rows[t].table_id;
      if(tb in tables) {
        tables[tb].push(rows[t]);
      } else {
        tables[tb] = [];
        tables[tb].push(rows[t]);
      }
    }

    // Construct the tables' HTML
    for(t in tables) {
      rows = tables[t];
      var body = "<tbody>";
      for (var i = 0; i < rows.length; i++) {
        body += "<tr class=\"editable\">"
        for (var j = 0; j < col.length; j++) {
            var cell = rows[i][col[j]]
            if(typeof cell === 'object') {
              // replaces somthing like 'dl_src' with 'eth_src' to comply with v1.3 naming 
              body += "<td>" + JSON.stringify(cell)
                                .replace(/dl_/g,'eth_')
                                .replace(/nw_/g,'ipv4_')
                                .replace(',',',\n') + "</td>";
            } else {
              body += "<td>" + cell + "</td>";
            }
        }
        body += "</tr>"
      }
      body += "</tbody>"

      var title = "Table "+t;
      var card = tableObj.buildTable(title, col, body, "");

      $('#Switch_'+dpid).append(card);
    }

    $(".editable").contextmenu(
    //  {
    //   selector: 'tr',
    //   callback: function(key, options) {
    //     //var content = $(this).text();
    //     alert("You clicked on: " + content);
    //   },
    //   items: {
    //     "edit": {name: "Edit", icon: ""},
    //     "delete": {name: "Delete", icon: ""},
    //   }
    // }, 
    function(e) { // save flow entry content
      e.preventDefault();
      
      var sw = tabsObj.getCurrentSwitch().replace('Switch_','');
      var table = tableObj.getCurrentTable(this).replace('Table ','');
      var flow = {"switch": sw, "table": table};
      $(this).children().each(function(index){
        flow[col[index]] = $(this).text();
      });
      localStorage.setItem('flow', JSON.stringify(flow));
    });

  }


  // Get flow entries from server and build table
  function getFlows(dps) {
    for(var id in dps) {  
        // works because the keys in dps are switch IDs in integer
        // while the value is switch ID in str
        $.get("/status", {status:"flows", dpid:id})
        .done( function(response) {
          buildFlowTables(response); 
        });
    } 
  }

  // Get the switches list from server and build the flow tables
  function getSwitches(f) {
    $.get("/flowform","list=switches")
    .done( function(response) {
      if(response) {
        tabsObj.buildTabs(response, getFlows);
      }
    })
    .fail( function() {
      $('#error').text("Cannot read switches!");
    })
  };

  // When the refresh button is clicked, clear the page and start over
  $('.refresh').on('click', function() {
    $('#main').html("");
    getSwitches();
  })

  getSwitches();
});
