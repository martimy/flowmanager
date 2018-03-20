$(function () {
  // Table template
  var tableTemplate = "<div class=\"header\"><h1>{Title}</h1></div> \
      <div class=\"container\">{content}</div> \
      <div class=\"footing\"></div>";

  var dps = null;

  // remove underscore and switch to uppercase
  function hc(myString) {
  	return myString.replace("_"," ").replace(/\b\w/g, l => l.toUpperCase())
  }

  function buildTables(response) {
    // extract the flows
    dpid = parseInt(Object.keys(response)[0]);
    var rows = Object.values(response)['0'];

    // get the headers
    var col = [];
    for (var c in rows[0]) {
      col.push(c);
    }
    col.sort()
    col.reverse();

    var tables = [];
    for (var t=0; t<rows.length; t++) {
      var tb = rows[t].table_id;
      if(tb in tables) {
        tables[tb].push(rows[t]);
      } else {
        tables.push(tb);
        tables[tb] = [];
        tables[tb].push(rows[t]);
      }
    }

    /* Note that the whole content variable is just a string */
    var tid = 0;
    var header = "<thead><tr>"
    for(i=0; i<col.length; i++){
      if(col[i] === "table_id") {
        tid = i; // mark the col. num. so we can skip it late
      } else {
        header += '<th data-sort="number">' + hc(col[i]) + '</th>';
      }
    }
    header += "</tr></thead>"

    for(var t=0; t<tables.length; t++) {
      rows = tables[t];
      var body = "<tbody>";
      for (var i = 0; i < rows.length; i++) {
        body += "<tr class=\"tooltip\">"
        for (var j = 0; j < col.length; j++) {
          if(j!=tid) {
            var cell = rows[i][col[j]]
            if(typeof cell === 'object') {
              body += "<td>" + JSON.stringify(cell) + "</td>";
            } else {
              body += "<td>" + cell + "</td>";
            }
          }
        }
        body += "</tr>"
      }
      body += "</tbody>"
      var content = '<table class="sortable">' + header + body + '</table>'
      var card = tableTemplate.replace("{Title}", "Switch "+dpid + ", Table "+t).replace("{content}", content)
      $('#main').append('<div class="card wide">'+card+'</div>');
    }

  }

  function getFlows(id) {
    //$.get("/stats/flow/"+id)
    $.get("/status", {status:"flows", dpid:id})
    .done( function(response) {
      buildTables(response);
    });
  };

  // Get switches list
  function getSwitches(f) {
    $.get("/flowform","list=switches")
    .done( function(response) {
      dps = response.split(',');
      if(dps) {
        for(var d=0; d<dps.length; d++) {
          getFlows(parseInt(dps[d]));
        }
      }
    })
    .fail( function() {
      $('#error').text("Cannot read switches!");
    })
  };

  getSwitches();

  $('.refresh').on('click', function() {
    $('#main').html("");
    getSwitches();
  })

});
