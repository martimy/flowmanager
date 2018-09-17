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

    if(rows.length == 0) {
      $('#Switch_'+dpid).append("There are no flow entries!");
      return
    }

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

    // clicking on a flow entry saves the flow entry content
    // in the local storage
    $(".editable").unbind('click');
    $(".editable").on('click', function(e) { 
      e.preventDefault();
      var flow = {}
      flow["switch"] = tabsObj.getCurrentSwitch().replace('Switch_','');
      flow["table"] = tableObj.getCurrentTable(this).replace('Table ','');
      $(this).children().each(function(index){
        flow[col[index]] = $(this).text();
      });
      localStorage.setItem('flow', JSON.stringify(flow));
      msg = "Flow entry copied to local storage.";
      displaySnackbar(msg);
      //$(".dropmenu").css({'top':e.pageY, 'left':e.pageX, 'position':'absolute'});
      //$(".dropmenu").css("display","block");
    });

  }

  // Get flow entries from server and build table
  function getFlows(dps) {
    for(var id in dps) {  
        $.get("/status", {status:"flows", dpid:id})
        .done( function(response) {
          buildFlowTables(response); 
        });
    } 
  }

  // Get the switches list from server and build the flow tables
  function getSwitches(f) {
    $.get("/data","list=switches")
    .done( function(response) {
      if(response) {
        tabsObj.buildTabs(response, getFlows); 
      }
    })
    .fail( function() {
      msg = "Cannot read switches!";
      displaySnackbar(msg);
    })
  };

  // Display Snackbar
  function displaySnackbar(msg) {
    var $x = $("#snackbar");
    $x.text(msg)
    $x.toggleClass("show");
    setTimeout(function(){ $x.toggleClass("show"); }, 3000);
  }

  // When the refresh button is clicked, clear the page and start over
  $("[name='refresh']").on('click', function() {
    $('#main').html("");
    getSwitches();
  })

  $("[name='save']").on('click', function() {
     // Download a file to local disk
    function download(filename, odata) {
      // compatibility issue
      data = odata.replace(/dl_src/g, "eth_src")
        .replace(/dl_dst/g, "eth_dst")
        .replace(/dl_type/g, "eth_type")
      var element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data));
      element.setAttribute('download', filename);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }

    $.get("/data","list=switches")
      .done( function(switches){
        var lst = []
        var all_flows = []

        for(sw in switches) {
          lst.push(
            $.get("/status", {status:"flows", dpid:switches[sw]})
            .done( function(flows) {
              console.log(flows)
              all_flows.push(flows)
            })
          )
        }
        // Wait for all switches to reply 
        $.when.apply(this,lst).then(function() {
          // console.log("are they finsihed")
          // console.log(all_flows)
          var filename = "flows_"+Date.now()+".json"
          download(filename, JSON.stringify(all_flows, undefined, 2));
        });
  
      })
  })


  localStorage.removeItem('flow');  
  getSwitches();
});
