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

function CommonTabs() {
  // Create the tab structure
  function buildTabs(dps, fill_container) {
    // Add tab buttons
    var tabs = '<div class="tab">';
    for (var d in dps) {
      tabs += '<button class="tablinks">Switch_' + dps[d] + '</button>';
    }
    tabs += '</div>';
    $('#main').append(tabs);
    // Add empty containers for contents
    for (var d in dps) {
      $('#main').append('<div id="Switch_' + dps[d] + '" class="tabcontent"></div>');
    }
    fill_container(dps);
    // When a tab is clicked:
    // 1) Hide all contents,
    // 2) Make the clicked tab active, and
    // 3) Show the content of the active tab
    // 4) Save the new active tab in local storage
    $('.tablinks').on('click', function (e) {
      $('.tabcontent').hide();
      $('.tablinks').removeClass("active");
      $(this).addClass("active");
      var id = $(this).text();
      $('#' + id).show();
      localStorage.setItem('activeTab', id);
    });
    var activeTab = localStorage.getItem('activeTab');
    if (activeTab !== null) {
      //setActiveTab(activeTab);
      $('button:contains(' + activeTab + ')').addClass("active");
      $('#' + activeTab).show();
      //console.log(activeTab);
    }
  }

  function getCurrentSwitch() {
    //var sw = $('div[id^=Switch]').css("display","block");
    return $(".tab > .active").text()
  }

  return {
    buildTabs: buildTabs,
    getCurrentSwitch: getCurrentSwitch
  };
}

function CommonTables() {
    // Table template
    var tableTemplate = " <div class=\"card wide\"> \
        <div class=\"header\"><h1>{Title}</h1><span class=\"dropmenu\">Menu</span></div> \
        <div class=\"container\">{content}</div> \
        <div class=\"footing\">{footer}</div></div>";

    // remove underscore and switch to uppercase
    function hc(myString) {
        return myString.replace("_"," ").replace(/\b\w/g, l => l.toUpperCase())
    }
  
    function buildTable(title, col, body, footer) {
      var header = "<thead><tr>"
      for(i=0; i<col.length; i++){
        header += '<th data-sort="number">' + hc(col[i]) + '</th>';
      }
      header += "</tr></thead>"
  
      var content = '<table class="sortable fixed">' + header + body + '</table>'; // try also <table align="ceneer">
      //var card = tableTemplate.replace("{Title}", title).replace("{content}", content);
                                 
      var card = tableTemplate
                .replace("{Title}", title)
                .replace("{content}", content)
                .replace("{footer}", footer)

      return card;
    }
  
    function getCurrentTable(entry) {
      return $(entry).closest('div').prev('div').find('h1').text();
    }

    return {
      buildTable: buildTable,
      getCurrentTable: getCurrentTable
    }
  }
  