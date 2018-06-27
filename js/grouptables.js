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

  function toUser(str) {
    if (str == '4294967295') {
      return 'ANY';
    } /*else if (typeof str === 'object' && str.length == 0 ) {
      return 'DROP';
    }*/
    return str;
  }

  // Create Group Tables
  function buildGroupTables(response) {
    var tableObj = new CommonTables();

    // extract the group data
    gdesc = response.desc
    gstats = response.stats
    dpid = parseInt(Object.keys(gdesc)[0]);
    var groups = Object.values(gdesc)['0'];
    var stats = Object.values(gstats)['0'];

    // get the headers
    var col = ["bucket", "weight", "watch_group", "watch_port", "actions", "packet_count", "byte_count"];

    // get the groups
    for (var i = 0; i < groups.length; i++) {
      var body = "<tbody>";
      var buckets = groups[i].buckets;
      //console.log(buckets)
      var raw = "<tr>";
      for (var j = 0; j < buckets.length; j++) {
        raw += "<td>"+j+"</td>" // the raw order
        bucket = buckets[j];
        bucketstat = stats[i].bucket_stats[j];
        for (var k = 1; k < col.length; k++) {
          if(bucket[col[k]] != null) {
            raw += "<td>" + toUser(bucket[col[k]]) + "</td>";
          } else if(bucketstat[col[k]] != null) {
            raw += "<td>" + bucketstat[col[k]] + "</td>";
          } else {
            raw += "<td>---</td>"; 
          }
        }
        raw += "</tr>";
      }
      body += raw + "</tbody>";

      var footer = "<table class='oneliner'><tr><td>Type: " + groups[i].type + "<td></td>"
                        + "<td>Duration: " + stats[i].duration_sec + "<td></td>"
                        + "<td>Refs: " + stats[i].ref_count + "<td></td></table>"

      var title = "Group "+ groups[i].group_id;
      var card = tableObj.buildTable(title, col, body, footer);
      $('#Switch_'+dpid).append(card);
    }

  }
 
  // Get flow entries from server and build tables
  function getGroups(dps) {
    for(var id in dps) {    
      $.get("/status", {status:"groups", dpid:id})
      .done( function(response) {
        buildGroupTables(response); 
      });
    }
  };

  // Get the switches list from server and build the group tables
  function getSwitches(f) {
    $.get("/flowform","list=switches")
    .done( function(response) {
      if(response) {
        tabsObj.buildTabs(response, getGroups);
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
