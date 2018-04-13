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

  function buildTabs(dps) {
    var tabs = '<div class="tab">';
    for(var d=0; d<dps.length; d++) {
      tabs += '<button class="tablinks">Switch_'+dps[d]+'</button>';
    }
    tabs += '</div>';
    $('#main').append(tabs);

    for(var d=0; d<dps.length; d++) {
      $('#main').append('<div id="Switch_'+dps[d]+'" class="tabcontent"></div>');
    }

    for(var d=0; d<dps.length; d++) {
      getFlows(parseInt(dps[d]));
    } 

    $('.tablinks').on('click', function(e) {
      $('.tabcontent').hide();      
      $('.tablinks').removeClass("active");
      $(this).addClass("active");
      var id = $(this).text(); //.replace('Switch ','');
      $('#'+id).show() //.css('display','inline-block');
    })
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
      //$('#main').append('<div id="Switch_'+dpid+'" class="card wide tabcontent">'+card+'</div>');
      $('#Switch_'+dpid).append(card);
    }

  }

  // Get flow entries from server and build tables
  function getFlows(id) {
    var flows = null;
    $.get("/status", {status:"flows", dpid:id})
    .done( function(response) {
      buildTables(response); 
    });
  };

  // Get the switches list deom server and build the flow tables
  function getSwitches(f) {
    $.get("/flowform","list=switches")
    .done( function(response) {
      dps = response.split(',');
      if(dps) {
        buildTabs(dps);
        for(var d=0; d<dps.length; d++) {
          //getFlows(parseInt(dps[d]));
        }
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
