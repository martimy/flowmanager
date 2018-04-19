$(function() {
    var header = '<thead><tr data-sort="number"> \
    <th data-sort="number">Time</th> \
    <th data-sort="number">Source</th> \
    <th data-sort="number">Level</th> \
    <th data-sort="number">Message</th></tr></thead>';

    // Get logs
    function getLogs() {
        $.get("/logs", {request:"logs"})
        .done( function(response) {
            if(response !== []) {
                var body = "<tbody>";
                for(var i=0; i<response.length; i++) {
                    var row = response[i];
                    body += "<tr class=\"tooltip\">"
                    for(var j=0; j<row.length; j++) {  
                        body += "<td>" + row[j] + "</td>";
                    }
                }
                body += "</tbody>";
                var content = '<table class="sortable">' + header + body + '</table>'   
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