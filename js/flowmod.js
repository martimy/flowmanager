/*
Linked to control.html to read user input for flow table modification.
Copyright (c) Maen Artimy, 2018
*/

$(function () {
  //var url = "http://" + location.hostname + ":8080";

  // constants
  var LABEL = 0;
  var HINT = 1;
  var EXAMPLE = 2;
  var DESC = 3;

  var actions = {};
  var matches = {};

  //var xhr = new XMLHttpRequest();
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

  // Handle 'change' events
  $('#matchcheckbox').on('change', function (e) {
    if(this.checked) {
      $('#matchdiv').slideUp(100); //addClass('hidden'); //fadeOut(250);
    } else {
      $('#matchdiv').slideDown(100); //removeClass('hidden'); //fadeIn(250);
    }
  });

  // Handle table 'click' events
  /* When the '+' button is clicked, a row is added to the fields table
     based on a clone of the last row. The field input needs to be bond
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

  // Get hints from data lists
  function get_hint(dict, label) {
    var l = label.trim();
    if(l === '' || l == null || !(l in dict)) {
      return '';
    }
    return dict[label][HINT];
  };

  // Action taken when a Oparation input is changed
  function on_operation_change (e) {
    if (e.target.value.indexOf("del") > -1) {
      if ($('input[name="operation"]:checked').val()) {
        $('#out_fields>input').prop("disabled", false);
      }
    } else {
      $('#out_fields>input').prop("disabled", true);
    }
  };

  // Action taken when a Match input is changed
  function on_match_change (e) {
    var $f = $('input');
    var $next = $f.eq($f.index(this) + 1);
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

  // Setup the form

  // Initialize datalists used by the Match and Action input
  // the lists come form the controller (SDN app actually)
  function init_dataList(thelist, listID) {
    var $datalist = $('<datalist>');
    $datalist.attr('id',listID)
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

  // Get data lists from the controller
  function read_dataLists() {
    // Get accepatble action types
    $.get("/flowform","list=actions").done( function(response) {
      var data_all = response.split('|');
      for (var i=0; i<data_all.length; i++) {
        var label = data_all[i++];
        var hint = data_all[i++];
        var desc = data_all[i++];
        var example = data_all[i];
        actions[label] = [label, hint, example, desc];
      }
      init_dataList(actions, "actionlist");
    })
    .fail( function() {
      $('#output').text("What happened 1!");
    })

    // Get accepatble match fields
    $.get("/flowform","list=matches").done( function(response) {
      var data_all = response.split('|');
      for (var i=0; i<data_all.length; i++) {
        var label = data_all[i++];
        var hint = data_all[i++];
        var example = data_all[i];
        matches[label] = [label, hint, example];
      }
      init_dataList(matches, "matchlist");
    })
    .fail( function() {
      $('#output').text("What happened 2!");
    })

    // Get switches list
    $.get("/flowform","list=switches").done( function(response) {
      console.log(response);
      var $dps = $('#dpid');
      var dpath = response.split(',');
      for (var i=0; i<dpath.length; i++) {
        $dps.append('<option value="' + dpath[i] + '">SW_' + dpath[i] + '</option>')
      }
    })
    .fail( function() {
      $('#output').text("Cannot read switches!");
    })
  };

  read_dataLists();

});
