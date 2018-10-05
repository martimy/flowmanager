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
  //function to validate file extension
  var request = {"meterupload":"meters", "groupupload":"groups", "flowupload":"flows"}

  // Display Snackbar
  // TODO: move it to a common file
  function displaySnackbar(msg) {
    var $x = $("#snackbar");
    $x.text(msg)
    $x.toggleClass("show");
    setTimeout(function(){ $x.toggleClass("show"); }, 3000);
  }

  $('[name="chooseFile"]').bind('change', function () {
    var $form = $(this).closest('form');
    var filename = $(this).val();
    //if (/^\s*$/.test(filename)) {
    if(!/(\.json)$/i.test(filename)) { 
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
      reader.onload = function(event) {
        $input.val(event.target.result);
        //console.log(event.target.result);
      };
      reader.onerror = function(event) {
        displaySnackbar("Error "+event.target.error.code);
      };
      reader.readAsText(inputFile);
      $form.find(".file-submit").prop('disabled', false);
    }
  });

  // Handle form 'submit' events
  $('form').on('submit', function(e) {
    e.preventDefault();
    var $input = $(this).find(".filecontent");
    var data = $input.val();
    if(!data) {
        return;
    }

    // construct a request
    var req = JSON.stringify({"request": request[this.id], "data":JSON.parse(data)});

    //Send the data to the server
    $.post("/upload", req)
      .done( function(response) {
        var msg = response;
        displaySnackbar(msg);
      })
      .fail( function() {
        var msg = "No response from controller.";
        displaySnackbar(msg);
      })

  });
}
)

  