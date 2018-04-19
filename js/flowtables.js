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

  // Create the tab structure
  function buildTabs(dps) {
    // Add tab buttons
    var tabs = '<div class="tab">';
    for(var d in dps) {
      tabs += '<button class="tablinks">Switch_'+dps[d]+'</button>';
    }
    tabs += '</div>';
    $('#main').append(tabs);

    // Add empty containers for contents
    for(var d in dps) {
      $('#main').append('<div id="Switch_'+dps[d]+'" class="tabcontent"></div>');
    }

    // Fill the containers with flow tables
    for(var d in dps) {
      getFlows(dps[d]);
    } 

    // When a tab is clicked:
    // 1) Hide all contents,
    // 2) Make the clicked tab active, and
    // 3) Show the content of the active tab
    // 4) Save the new active tab in local storage
    $('.tablinks').on('click', function(e) {
      $('.tabcontent').hide();      
      $('.tablinks').removeClass("active");
      $(this).addClass("active");
      var id = $(this).text();
      $('#'+id).show();
      localStorage.setItem('activeTab', id);
    })

    var activeTab = localStorage.getItem('activeTab');
    if(activeTab !== null) {
      //setActiveTab(activeTab);
      $('button:contains('+ activeTab +')').addClass("active");
      $('#'+activeTab).show();
      //console.log(activeTab);
    } 
  }

  // Create Flow Tables
  function buildFlowTables(response) {
    // extract the flows
    dpid = parseInt(Object.keys(response)[0]);
    var rows = Object.values(response)['0'];

    // get the headers
    var col = [];
    for (var c in rows[0]) {
      col.push(c);
    }
    // TODO: make column order custom
    // Sort the column names
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
      buildFlowTables(response); 
    });
  };

  // Get the switches list from server and build the flow tables
  function getSwitches(f) {
    $.get("/flowform","list=switches")
    .done( function(response) {
      if(response) {
        buildTabs(response);
      }
    })
    .fail( function() {
      $('#error').text("Cannot read switches!");
    })
  };

  // Get the last active tab
  function getActive() {
    var name;
    if(localStorage.getItem('activeTab') === null) {
        localStorage.setItem('name', name);
    } else {
        name = localStorage.getItem('name');
    }

  }

  // When the refresh button is clicked, clear the page and start over
  $('.refresh').on('click', function() {
    $('#main').html("");
    getSwitches();
  })


  getSwitches();
});
