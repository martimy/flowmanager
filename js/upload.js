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
    var $form = $('#flowupload');
    //function to validate file extension

  // Display Snackbar
  // TODO: move it to a common file
  function displaySnackbar(msg) {
    var $x = $("#snackbar");
    $x.text(msg)
    $x.toggleClass("show");
    setTimeout(function(){ $x.toggleClass("show"); }, 3000);
  }


  $('#chooseFile').bind('change', function () {
    var filename = $("#chooseFile").val();
    //if (/^\s*$/.test(filename)) {
    if(!/(\.json)$/i.test(filename)) { 
      $(".file-upload").removeClass('active');
      $("#noFile").text("No file chosen..."); 
      displaySnackbar("Invalid Extension!")
    }
    else {
      $(".file-upload").addClass('active');
      $("#noFile").text(filename.replace("C:\\fakepath\\", ""));

      var $input = $("#flowscontent");
      var inputFiles = this.files;
      var inputFile = inputFiles[0];

      var reader = new FileReader();
      reader.onload = function(event) {
        $input.val(event.target.result);
        //console.log(event.target.result);
      };
      reader.onerror = function(event) {
        displaySnackbar("Error "+event.target.error.code);
      };
      reader.readAsText(inputFile);
      $(".file-submit").prop('disabled', false);
    }
  });

  

  // Handle form 'submit' events
  $form.on('submit', function(e) {
    e.preventDefault();

    var $input = $("#flowscontent");
    var data = $input.val();
    if(!data) {
        return;
    }

    //Send the data to the server
    $.post("/flowupload", data)
      .done( function(response) {
        msg = response;
        displaySnackbar(msg);
      })
      .fail( function() {
        msg = "No response from controller.";
        displaySnackbar(msg);
      })

  });
}
)

  