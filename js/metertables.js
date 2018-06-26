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
  var dps = null;
  var tabsObj = new CommonTabs();
  
  function toUser(str) {
    if (str == '4294967295') {
      return 'ANY';
    } /*else if (typeof str === 'object' && str.length == 0 ) {
      return 'DROP';
    }*/
    return str;
  }

  // Create Meter Tables
  function buildMeterTables(response) {
    var tableObj = new CommonTables();

    // extract the meter data
    gdesc = response.desc
    gstats = response.stats

    dpid = parseInt(Object.keys(gdesc)[0]);
    var groups = Object.values(gdesc)['0'];
    var stats = Object.values(gstats)['0'];

    // get the headers
    var col = ["band", "type", "rate", "burst_size", "packet_band_count", "byte_band_count"];

    // get the meters
    for (var i = 0; i < groups.length; i++) {
      var body = "<tbody>";
      var buckets = groups[i].bands;
      //console.log(buckets)
      var raw = "<tr>";
      for (var j = 0; j < buckets.length; j++) {
        raw += "<td>"+j+"</td>" // the raw order
        bucket = buckets[j];
        bucketstat = stats[i].band_stats[j];
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

      var footer = "<table class='oneliner'><tr><td>Duration: " + stats[i].duration_sec + "</td>"
                        + "<td>Flows: " + stats[i].flow_count + "</td>"
                        + "<td>Packets: " + stats[i].packet_in_count + "</td>"                        
                        + "<td>Bytes: " + stats[i].byte_in_count + "</td></tr></table>"

      var title = "Meter: "+ groups[i].meter_id;
      var card = tableObj.buildTable(title, col, body, footer);
      $('#Switch_'+dpid).append(card);
    }

  };

  // Fill the containers with data
  function filler(dps) {
    for(var d in dps) {
      getMeters(dps[d]);
    }
  }

  // Get flow entries from server and build tables
  function getMeters(id) {
    var flows = null;
    $.get("/status", {status:"meters", dpid:id})
    .done( function(response) {
      buildMeterTables(response); 
    });
  };

  // Get the switches list from server and build the group tables
  function getSwitches(f) {
    $.get("/flowform","list=switches")
    .done( function(response) {
      if(response) {
        tabsObj.buildTabs(response, filler);
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
