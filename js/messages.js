// Copyright (c) 2018-2019 Maen Artimy
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
    var tabObj = Tabs('monitor');
    var bigTree;
    let maxRows = 10;
    let pause = false
    const cookie_list = [];
    let selectedCookie = "default";

    const header = '<thead> \
    <th>Time</th> \
    <th>Type</th> \
    <th>Datapath</th> \
    <th>Table</th> \
    <th>Reason</th> \
    <th>Match</th> \
    <th>Buffer ID</th> \
    <th>Cookie</th> \
    <th>Content</th></tr></thead>';

    // var bfs = function (tree, key, collection) {
    //     if (!tree[key] || tree[key].length === 0) return;
    //     for (var i = 0; i < tree[key].length; i++) {
    //         var child = tree[key][i]
    //         collection[child.id] = child;
    //         bfs(child, key, collection);
    //     }
    //     return;
    // }

    function build_table() {
        var body = "<tbody></tbody>";
        var content = '<table id="logs" class="logtable sortable">' + header + body + '</table>'
        $('#messages').html(content);
    }

    function add_row(row) {
        if (pause) return;
        if ($('#logs tr').length > maxRows) {
            $("#logs > tbody tr:last").remove();
        }
        var body = "<tr>"
        body += "<td>" + row[0] + "</td>";
        body += "<td>" + row[1] + "</td>";
        body += "<td>" + row[2] + "</td>";
        body += "<td>" + row[3] + "</td>";
        body += "<td>" + row[4] + "</td>";
        body += "<td>" + row[5].replace('OFPMatch', '') + "</td>";
        body += "<td>" + row[6] + "</td>";
        body += "<td>" + row[7] + "</td>";
        body += "<td class=\"tooltip\"><span>" + row[8] + "</span>" + row[8] + "</td>";
        body += "</tr>";
        // Add the row at the top
        $('#logs').prepend(body);
    }

    const update_stats = {
        update: function (params) {
            j = JSON.parse(params);
            var body = "<div>" + params + "</div>";

            var $dropdown = $("#cookieoption");

            j.forEach(element => {
                let x = element.name.toString();
                if (cookie_list.indexOf(x) < 0) {
                    cookie_list.push(x);
                    $dropdown.append(new Option(x, x));
                }
            });

            // Flatten Tree
            // var flattenedCollection = {};
            // bfs(j, "name", flattenedCollection);
            let cookie = sessionStorage.getItem('selectedCookie');
            var idx = cookie_list.indexOf(cookie);
            if (idx >= 0) {
                $('#cookieoption').val(cookie);
                bigTree.draw(j[idx]);
            } else {
                bigTree.draw(j[0])
            }

            // sessionStorage.setItem('trees', params);
            return "";
        },
        log: function (params) {
            row = JSON.parse(params);
            add_row(row)
            return "";
        },
    }

    function receiveMessages() {
        var ws = new WebSocket("ws://" + location.host + "/ws");
        ws.onmessage = function (event) {
            var data = JSON.parse(event.data);

            var result = update_stats[data.method](data.params);

            var ret = { "id": data.id, "jsonrpc": "2.0", "result": result };
            this.send(JSON.stringify(ret));
        }
    }

    function startMonitor() {
        tabObj.buildTabs("#main", ["Messages", "Stats"], "Nothing to show!");

        var $svg = $('<div class="msgoptions"> \
        <button id="reset" type="button">Reset</button> Select cookie: <select id="cookieoption"> \
        <option>Default</option></select></div> \
        <svg width="1116" height="700"></svg>');

        var $messages = $('<div class="msgoptions"><button id="pause" type="button">Pause</button> \
        Show <div class="cselect"><select id="rowoption"> \
        <option value="10" selected>10</option><option value="25">25</option> \
        <option value="50">50</option></select></div> rows</div> \
        <div id="messages"></div>');

        tabObj.buildContent('Messages', $messages);
        tabObj.buildContent('Stats', $svg);
        build_table();
        bigTree = BigTree();

        // let trees = sessionStorage.getItem('trees');
        // if (trees) {
        //     update_stats.update(trees)
        // }

        receiveMessages();
        tabObj.setActive();

        $('#rowoption').change(function () {
            maxRows = $(this).val();
            while (maxRows < $('#logs > tbody tr').length) {
                $("#logs > tbody tr:last").remove();
            }
        });

        $('#pause').on("click", function () {
            pause = !pause;
            $(this).html(pause ? "Resume" : "Pause");
        });

        $('#reset').on("click", function () {
            // get selected cookie

            $.post("/resetmonitor", JSON.stringify({ "cookie": selectedCookie }))
                .done(function (response) {
                    //$('svg').empty();
                })
                .fail(function () {
                })
        });

        $('#cookieoption').on('change', function () {
            selectedCookie = $(this).val();
            sessionStorage.setItem('selectedCookie', selectedCookie);
        });

    }

    // When the refresh button is clicked, clear the page and start over
    // $('.refresh').on('click', function () {
    //     $('#main').html("");
    //     startMonitor();
    // });

    startMonitor();

});