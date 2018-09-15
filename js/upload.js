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
    function validaExtension(fld)  {
        if(!/(\.json)$/i.test(fld)) 
        {
            return false;
        }
        return true;
    }

  // Display Snackbar
  // TODO: move it to a common file
  function displaySnackbar(msg) {
    var $x = $("#snackbar");
    $x.text(msg)
    $x.toggleClass("show");
    setTimeout(function(){ $x.toggleClass("show"); }, 3000);
  }

  // Handle form 'submit' events
  $form.on('submit', function(e) {
    e.preventDefault();
    console.log('hello')
    // Read the form input
    //var formData = {};

    var filename = $("[name='file']").val();
    console.log(filename)
    valid = validaExtension(filename)
    if(!valid) {
        displaySnackbar("Invalid extenstion!");
    }

    //console.log(formData);

    // Send the data to the server
    // $.post("/flowform", JSON.stringify(formData))
    //   .done( function(response) {
    //     msg += response;
    //     displaySnackbar(msg);
    //   })
    //   .fail( function() {
    //     msg += "No response from controller.";
    //     displaySnackbar(msg);
    //   })

  });
}
)
