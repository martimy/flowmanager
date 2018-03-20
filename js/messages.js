$(function() {
    /*
    var source = new EventSource("/logs");

    source.onmessage = function(e) {
        if(e.data !== "[]") {
            $m = $('#messages')
            $m.html(e.data + '<br>' + $m.html());
        }
    };*/

    // Get logs
    $.get("/logs", {request:"logs"})
    .done( function(response) {
        if(response !== []) {
            for(var i=0; i<response.length; i++) {
                $m = $('#messages')
                $m.html(response[i] + '<br>' + $m.html());
            }
        }
    })
    .fail( function() {
        //$('#error').text("Cannot read logs!");
    });

});