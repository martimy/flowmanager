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

  var $form = $('#confbackup');
  var all_switches = [];
  var request = { "meterupload": "meters", "groupupload": "groups", "flowupload": "flows" }

  // Get information from datapaths
  function getSwitchData(request, switches, g) {
    if ($.isEmptyObject(switches)) {
      g([]);
    }
    var lst = [];
    var all_data = [];
    // Request flows from all switches
    for (var sw in switches) {
      lst.push(
        $.get("/status", { status: request, dpid: switches[sw] })
          .done(function (flows) {
            all_data.push(flows)
          })
          .fail(function () {
            var msg = "Cannot read " + request + " form " + switches[sw] + "!";
            displayMessage(msg);
          })
      )
    }

    // Wait for all switches to reply 
    $.when.apply(this, lst).then(function () {
      g(all_data);
    });

  }

  // When Enter is pressed, go to the next input instead of sumbitting
  // the form.
  $form.on('keypress', ':input', function (e) {
    if (e.which == 13) {
      e.preventDefault();
      var $canfocus = $(':input');
      var index = $canfocus.index(this) + 1;
      if (index >= $canfocus.length) index = 0;
      if ($canfocus.eq(index).is(':disabled')) index++;
      $canfocus.eq(index).focus();
    }
  });

  // Handle 'change' events for the match checkbox
  $('#matchcheckbox').on('change', function (e) {
    if (this.checked) {
      $('#matchdiv').slideUp(100); //addClass('hidden'); //fadeOut(250);
    } else {
      $('#matchdiv').slideDown(100); //removeClass('hidden'); //fadeIn(250);
    }
  });

  // Display Snackbar
  // TODO: move it to a common file
  function displaySnackbar(msg) {
    var $x = $("#snackbar");
    $x.text(msg)
    $x.toggleClass("show");
    setTimeout(function () { $x.toggleClass("show"); }, 3000);
  }

  // Check if the file is valid backup file
  function validFile(data) {
    return data.indexOf("FLOWMANAGER_v1.0") >= 0;
  }

  $('[name="chooseFile"]').bind('change', function () {
    //var $form = $(this).closest('form');
    var filename = $(this).val();
    if (!/(\.bk)$/i.test(filename)) {
      $form.find(".file-upload").removeClass('active');
      $form.find(".file-select-name").text("No file chosen...");
      $form.find(".filecontent").val("No content...");
      displaySnackbar("Invalid Extension!")
    }
    else {
      $form.find(".file-upload").addClass('active');
      $form.find(".file-select-name").text(filename.replace("C:\\fakepath\\", ""));


      var $input = $form.find(".filecontent");
      var inputFiles = this.files;
      var inputFile = inputFiles[0];

      var reader = new FileReader();
      reader.onload = function (event) {
        $input.val(event.target.result);
        //console.log(event.target.result);
      };
      reader.onerror = function (event) {
        displaySnackbar("Error " + event.target.error.code);
      };
      reader.readAsText(inputFile);
      $form.find(".file-submit").prop('disabled', false);
    }
  });

  // Handle form 'submit' events
  $form.on('click', '[name="restore"]', function (e) {
    e.preventDefault();
    var $input = $form.find(".filecontent");
    var data = $input.val();

    if (!data | !validFile(data)) {
      displaySnackbar("Invalid file format!");
      return;
    }

    //Send the data to the server
    $.post("/upload", data)
      .done(function (response) {
        var msg = response;
        displaySnackbar(msg);
      })
      .fail(function () {
        var msg = "No response from controller.";
        displaySnackbar(msg);
      })

  });

  function getConfiguration(switches) {
    var conf = {
      "format": "FLOWMANAGER_v1.0",
      "switches": switches,
    }

    getSwitchData(
      "meters",
      switches,
      function (all_data) {
        var data = [];
        for (d in all_data) {
          data.push(all_data[d]["desc"]);
        }
        conf["meters"] = JSON.parse(fix_compatibility(JSON.stringify(data)));
        getSwitchData(
          "groups",
          switches,
          function (all_data) {
            var data = [];
            for (d in all_data) {
              data.push(all_data[d]["desc"]);
            }
            conf["groups"] = JSON.parse(fix_compatibility(JSON.stringify(data)));
            getSwitchData(
              "flows",
              switches,
              function (all_data) {
                conf["flows"] = JSON.parse(fix_compatibility(JSON.stringify(all_data)));
                if ($('#pretty').is(':checked')) {
                  conf = JSON.stringify(conf, undefined, 2);
                } else {
                  conf = JSON.stringify(conf);
                }
                var filename = "backup_" + Date.now() + ".bk"
                downloadFile(filename, conf);
              }
            );
          }
        );
      }
    );
  }

  $form.on('click', '[name="save"]', function (e) {
    e.preventDefault();
    var switches = [];
    $("#dpid option:selected").each(function () {
      switches.push(this.value); // or $(this).val()
    });
    switches = switches.includes("ALL") ? all_switches : switches;
    getConfiguration(switches);
  });

  // Get list of active datapaths
  function getActiveSwitches() {
    // Get switches list
    $.get("/data", "list=switches")
      .done(function (response) {
        var $dps = $('#dpid');
        for (var i in response) {
          all_switches.push(response[i]);
          $dps.append('<option value="' + response[i] + '">SW_' + response[i] + '</option>')
        }
      })
      .fail(function () {
        $('#output').text("Cannot read switches!");
      })
  }

  getActiveSwitches();
})

