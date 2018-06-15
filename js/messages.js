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

$(function() {
    var header = '<thead><tr data-sort="number"> \
    <th data-sort="date">Time</th> \
    <th data-sort="name">Level</th> \
    <th data-sort="name">Message</th></tr></thead>';

    // Get logs
    function getLogs() {
        $.get("/logs", {request:"logs"})
        .done( function(response) {
            if(response !== []) {
                var body = "<tbody>";
                var start = Math.max(0, response.length-25);
                for(var i=start; i<response.length; i++) {
                    var row = response[i];
                    body += "<tr>"
                    body += "<td>" + row[0] + "</td>";
                    body += "<td>" + row[1] + "</td>";
                    body += "<td class=\"tooltip\"><span>" + row[2] + "</span>" + row[2] + "</td>";
                    body += "</tr>";
                }
                body += "</tbody>";
                var content = '<table class="logtable sortable">' + header + body + '</table>'   
                $m = $('#main');
                $m.html(content);
            }
        })
        .fail( function() {
            //$('#error').text("Cannot read logs!");
        });
    }

    // When the refresh button is clicked, clear the page and start over
    $('.refresh').on('click', function() {
        $('#main').html("");
        getLogs();
    });

    getLogs();
});