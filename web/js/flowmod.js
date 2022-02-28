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
  //var url = "http://" + location.hostname + ":8080";

  // constants
  var LABEL = 0;
  var HINT = 1;
  var EXAMPLE = 2;
  var DESC = 3;

  var actions = {};
  var matches = {};

  var $form = $('#flowmod');

  // When Enter is pressed, go to the next input instead of sumbitting
  // the form.
  $form.on('keypress', ':input', function (e) {
    if(e.which == 13) {
      e.preventDefault();
      var $canfocus = $(':input');
      console.log($canfocus.length);
      var index = $canfocus.index(this) + 1;
      console.log(this);
      if (index >= $canfocus.length) index = 0;
      if ($canfocus.eq(index).is(':disabled')) index++;
      $canfocus.eq(index).focus();
    }
  });

  // Handle 'change' events for the match checkbox
  $('#matchcheckbox').on('change', function (e) {
    if(this.checked) {
      $('#matchdiv').slideUp(100); //addClass('hidden'); //fadeOut(250);
    } else {
      $('#matchdiv').slideDown(100); //removeClass('hidden'); //fadeIn(250);
    }
  });

  // Handle table 'click' events
  /* When the '+' button is clicked, a row is added to the fields table
     based on a clone of the last row. The field input needs to be bound
     to a listener and the value input field needs to be cleaned of existing
     'placeholder'. Finally the '+' is changed to '-'
     When the '-' button is clicked, the current row is deleted
  */
  $('.extendable').on('click',function(e) {
    var target = e.target;
    if (target.value =='+') {
      addRaw(this);
      target.value = '-';
    } else if (e.target.value == '-') {
      $(target).parent().parent().remove();
    }
  });

  function addRaw(item) {
    var $row = $(item).find('tr:last');
    $(item).append('<tr>'+$row.html()+'</tr>')
    $row = $(item).find('tr:last')
    $row.find('input').eq(1).attr('placeholder', '');
    $row.find('input').eq(1).prop('disabled', false);
    var $field = $row.find('input').eq(0)
    if($field.attr('name') === 'matchfield') {
        $field.on('change', on_match_change );
    } else if ($field.attr('name') === 'applyaction') {
        $field.on('change', on_action_change );
    } else if ($field.attr('name') === 'writeaction') {
        $field.on('change', on_action_change );
    }

  }
  // Clears the current value of the list input when is comes to focus.
  $('input[list]').on('focus', function(e) {
    $(this).attr('onfocus','this.value=""');
  });

  // Get hints from data lists
  function get_hint(dict, label) {
    var l = label.trim();
    if(l === '' || l == null || !(l in dict)) {
      return '';
    }
    return dict[label][HINT];
  };

  // Action taken when a flow mod oparation input is changed
  function on_operation_change (e) {
    if (e.target.value.indexOf("del") > -1) {
      if ($('input[name="operation"]:checked').val()) {
        $('#out_fields>input').prop("disabled", false);
        // change the default value to -1
        $('#out_port').val(-1);
        $('#out_group').val(-1);
      }
    } else {
      $('#out_fields>input').prop("disabled", true);
        // reset the value
        $('#out_port').val('');
        $('#out_group').val('');
    }
  };

  // Action taken when a Match input is changed
  function on_match_change (e) {
    var $f = $('input');
    var $next = $f.eq($f.index(this) + 1); // get the next input field
    $next.val('');
    //$next.attr('placehoder','');
    $next.attr('placeholder', get_hint(matches, this.value));
  };

  // Action taken when an Action input is changed
  function on_action_change (e) {
    var $f = $('input')
    var $next = $f.eq($f.index(this) + 1);
    $next.val('');
    var hint = get_hint(actions, this.value);
    if (hint === "None") {
      $next.attr('placeholder', '');
      $next.prop('disabled', true);
    } else {
      $next.prop('disabled', false);
      $next.attr('placeholder', hint);
    }
  };

  // Bind Change events
  $('[name="operation"]').on('change', on_operation_change);
  $('[name="matchfield"]').on('change', on_match_change);
  $('[name="applyaction"]').on('change', on_action_change);
  $('[name="writeaction"]').on('change', on_action_change);

  // Handle form 'submit' events
  $form.on('submit', function(e) {
    e.preventDefault();

    // Read the form input
    var formData = readForm($form);
    var r = validate(formData, matches, actions);
    var msg = r.message;

    //console.log(formData);

    // Send the data to the server
    $.post("/flowform", JSON.stringify(formData))
      .done( function(response) {
        msg += response;
        displaySnackbar(msg);
      })
      .fail( function() {
        msg += "No response from controller.";
        displaySnackbar(msg);
      })
  });

  // Initialize the form

  // Create datalist elements used by the Match and Action input
  function init_dataList(thelist, listID) {
    var $datalist = $('<datalist>'); 
    $datalist.attr('id',listID)
    // display the key as an input option
    for(var key in thelist) {
      var $option = $('<option>');
      $option.text(key);
      $datalist.append($option);
    }
    $form.append($datalist);
  };

  // Display Snackbar
  function displaySnackbar(msg) {
      var $x = $("#snackbar");
      $x.text(msg)
      $x.toggleClass("show");
      setTimeout(function(){ $x.toggleClass("show"); }, 3000);
  }

  // Get data lists from server
  function read_dataLists() {
    // Get accepatble action types
    $.getJSON("data/actions.json").done( function(response) {
      actions = response; // assign to global var
      init_dataList(actions, "actionlist");
    })
    .fail( function() {
      $('#output').text("Could not get actions list!");
    })

    // Get accepatble match fields
    $.getJSON("data/matches.json").done( function(response) {
      matches = response; // assign to global var
      init_dataList(matches, "matchlist");
    })
    .fail( function() {
      $('#output').text("Could not get match fields list!");
    })

    // Get switches list
    $.get("/data","list=switches").done( function(response) {
      var $dps = $('#dpid');
      for (var i in response) {
        $dps.append('<option value="' + response[i] + '">SW_' + response[i] + '</option>')
      }
    })
    .fail( function() {
      $('#output').text("Cannot read switches!");
    })
  };

  if (sessionStorage.getItem('flow')) {
    $('input[name="import"]').show();
  }

  var fillObj = FlowFill(addRaw);

  $('input[name="import"]').on("click", function(e) {
    var data = sessionStorage.getItem('flow');
    var flow = JSON.parse(data);
    sessionStorage.removeItem("flow");
    $('input[name="import"]').hide();
    fillObj.fillFlowForm(flow);
  })

  read_dataLists();

});
