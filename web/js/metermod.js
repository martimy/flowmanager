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
  // var LABEL = 0;
  // var HINT = 1;
  // var EXAMPLE = 2;
  // var DESC = 3;

  var actions = {};
  var matches = {};

  //var xhr = new XMLHttpRequest();
  var $form = $('#metermod');

  // When Enter is pressed, go to the next input instead of sumbitting
  // the form.
  // TODO: move to common
  $form.on('keypress', ':input', function (e) {
    if(e.which == 13) {
      e.preventDefault();
      var $canfocus = $(':input');
      var index = $canfocus.index(this) + 1;
      if (index >= $canfocus.length) index = 0;
      if ($canfocus.eq(index).is(':disabled')) index++;
      $canfocus.eq(index).focus();
    }
  });

  // Handle table 'click' events
  /* When the '+' button is clicked, a row is added to the fields table
     based on a clone of the last row. The field input needs to be bound
     to a listener and the value input field needs to be cleaned of existing
     'placehoder'. Finally the '+' is changed to '-'
     When is '-' button is clicked, the current row is deleted
  */
  $('.extendable').on('click',function(e) {
    var target = e.target;
    if (target.value =='+') {
      var $row = $(this).find('tr:last');
      $(this).append('<tr>'+$row.html()+'</tr>')
      $row = $(this).find('tr:last')
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
      target.value = '-';
    } else if (e.target.value == '-') {
      $(target).parent().parent().remove();
    }
  });

  // Clears the current value of the list input when is comes to focus.
  $('input[list]').on('focus', function(e) {
    $(this).attr('onfocus','this.value=""');
  });

  // Action taken when a Oparation input is changed
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
  function on_type_change (e) {
    var $f = $('input');
    var $next = $f.eq($f.index(this) + 1);
    $next.val('');
    // disable/enable fields based on selection
  };

  function on_bandtype_change() {
    var enable = $(this).val() === "DSCP_REMARK"
    $('[name="prec"]').prop('disabled', !enable);
  }

  // Bind Change events
  $('[name="operation"]').on('change', on_operation_change);
  $('[name="typelist"]').on('change', on_type_change);
  $('[name="bandtype"]').on('change', on_bandtype_change);
  
  $(':checkbox').change(function() {
    if (this.id === "OFPMF_KBPS") {
      $("#OFPMF_PKTPS").prop( "checked", !this.checked);
      
    } else if (this.id === "OFPMF_PKTPS") {
      $("#OFPMF_KBPS").prop( "checked", !this.checked);
    }
    var burst = $("#OFPMF_BURST").prop("checked");
    $('[name="burst"]').prop('disabled', !burst);
  });

  // Handle form 'submit' events
  $form.on('submit', function(e) {
    e.preventDefault();

    // Read the form input
    var formData = readForm($form);
    var r = validate(formData, matches, actions);
    var msg = r.message;

    //console.log(formData);

    // Send the data to the server
    $.post("/meterform", JSON.stringify(formData))
      .done( function(response) {
        msg += response;
        displaySnackbar(msg);
      })
      .fail( function() {
        msg += "No response from controller.";
        displaySnackbar(msg);
      })
  });

  // Setup the form

  // Display Snackbar
  function displaySnackbar(msg) {
      var $x = $("#snackbar");
      $x.text(msg)
      $x.toggleClass("show");
      setTimeout(function(){ $x.toggleClass("show"); }, 3000);
  }

  // Get data lists from the controller
  function init_form() {
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

  if (sessionStorage.getItem('meter')) {
    $('input[name="import"]').show();
  }

  //var fillObj = FlowFill(addRaw);

  $('input[name="import"]').on("click", function(e) {
    var data = sessionStorage.getItem('meter');
    var flow = JSON.parse(data);
    sessionStorage.removeItem("meter");
    $('input[name="import"]').hide();
    //fillObj.fillFlowForm(flow);
  })

  init_form();

});
