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