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
    const tabObj = Tabs('topology');
    const size = 60;
    const radius = 8;

    // Define the div for the tooltip
    const div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    function add_prefix(obj) {
        return String(obj).replace(/^0+/, "Switch_");
    }

    function trim_zeros(obj) {
        return String(obj).replace(/^0+/, "");
    }

    // Takes JSON data and convert to a graph format that D3 understands:
    // var topDesc = {
    //     "nodes": [
    //       {"id": "0000000000000001", "type": "switch"},
    //       {"id": "0000000000000002", "type": "switch"},
    //       {"id": "16:18:83:a8:4d:1c", "type": "host"},
    //       ...
    //     ],
    //     "links": [
    //         {"source": "0000000000000002", "target": "0000000000000003", 
    //          "port": {"source": "00000003", "target": "00000002"}, "value": 4},
    //       ...
    //     ]}
    function toGraph(top) {
        var nodes = [];
        var links = [];

        var lst = top.switches;
        for (var i = 0; i < lst.length; i++) {
            nodes.push({ "id": lst[i].dpid, "type": "switch" });
        }

        if (top.links.length > 0) {
            lst = top.links;
            for (var i = 0; i < lst.length; i++) {
                if (lst[i].src.dpid < lst[i].dst.dpid) { // prevent duplicate links
                    links.push({
                        "source": lst[i].src.dpid, "target": lst[i].dst.dpid, "value": 4,
                        "port": { "source": lst[i].src.port_no, "target": lst[i].dst.port_no }
                    });
                }
            }
        } else if (top.switches.length > 1) { // represent the network with a cloud
            nodes.push({ "id": 0, "type": "cloud" });
            for (var i = 0; i < lst.length; i++) {
                links.push({
                    "source": 0, "target": lst[i].dpid, "value": 4,
                    "port": { "source": 0, "target": 0 }
                });
            }
        }

        lst = top.hosts;
        for (var i = 0; i < lst.length; i++) {
            nodes.push({ "id": lst[i].mac, "type": "host" });
            links.push({
                "source": lst[i].port.dpid, "target": lst[i].mac, "value": 2,
                "port": { "source": lst[i].port.port_no, "target": 0 }
            });
        }

        return { "nodes": nodes, "links": links };
    }

    // Plot the topology using D3.js
    // Many online tutorials explain how this works. Example: www.puzzlr.org/force-graphs-with-d3
    function plotGraph(graph) {
        var svg = d3.select("svg");
        var width = +svg.attr("width");
        var height = +svg.attr("height");

        //custom force to put everything in a box 
        function box_force() {
            var curr_node;
            for (var i = 0, n = graph.nodes.length; i < n; ++i) {
                curr_node = graph.nodes[i];
                curr_node.x = Math.max(radius, Math.min(width - radius, curr_node.x));
                curr_node.y = Math.max(radius, Math.min(height - radius, curr_node.y));
            }
        }

        // Create a force layout simulation

        // Link: attraction force
        // chanrge: repulsion force
        // x: attracts the nodes to the horizontal centre
        // y: attracts the hosts the bottom while other nodes are attrcated to the top
        // centre: atracts to the centre
        // collision: avoids node collision
        // box: keeps all nodes inside
        var simulation = d3.forceSimulation()
            .nodes(graph.nodes)
            .force("link", d3.forceLink(graph.links).id(function (d) { return d.id; }).distance(size * 2))
            .force("charge", d3.forceManyBody().strength(-size * 30))
            .force("x", d3.forceX(width / 2))
            .force("y", d3.forceY(function (d) {
                if (d.type === "host") {
                    return 3 * height / 4
                } else {
                    return 1 * height / 4
                }
            }).strength(0.25))
            .force("centre", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(35))
            .force("box", box_force);

        // Create nodes with image and text
        var node = svg.append("g")
            .attr("class", "nodes")
            .selectAll(".node")
            .data(graph.nodes)
            .enter().append("g")
            // .attr("id", function (d) { return "N" + d.id; })
            .attr("class", "node");

        node.append("image")
            .attr("xlink:href", function (d) {
                if (d.type === "switch") {
                    return "/home/img/switch.svg"
                } else if (d.type === "cloud") {
                    return "/home/img/cloud.svg"
                } else {
                    return "/home/img/pc.svg"
                }
            })
            .on("mouseover", handleMouseOver)
            .on("mouseout", handleMouseOut)

        node.append("text")
            .attr("class", "label")
            .attr("dy", size + 14)
            .text(function (d) { return d.id; });
            // .text(function (d) { return d.id.replace(/^0+/, ''); });


        // Create links with lines, circles, and text
        var link = svg.append("g")
            .attr("class", "links")
            .selectAll(".link")
            .data(graph.links)
            .enter().append("g")
            .attr("class", "link");

        link.append("line")
            .attr("stroke-width", function (d) { return d.value; });

        link.append("circle")
            .attr("class", "start")
            .attr("r", radius)

        link.append("circle")
            .attr("class", "end")
            .attr("r", radius)

        link.append("text")
            .attr("class", "start")
            .text(function (d) { return trim_zeros(d.port.source); })

        link.append("text")
            .attr("class", "end")
            .text(function (d) { return trim_zeros(d.port.target); })

        // Simulation steps
        function tickActions() {
            function norm(d) {
                return Math.sqrt((d.target.x - d.source.x) ** 2 + (d.target.y - d.source.y) ** 2);
            }

            node
                .attr("transform", function (d) { return "translate(" + (d.x - size / 2) + "," + (d.y - size / 2) + ")"; });
            link
                .attr("transform", function (d) { return "translate(" + d.source.x + "," + d.source.y + ")"; });

            link.selectAll("line")
                .attr("x1", function (d) { return (d.target.x - d.source.x) * size / 2 / norm(d); })
                .attr("y1", function (d) { return (d.target.y - d.source.y) * size / 2 / norm(d); })
                .attr("x2", function (d) { return (d.target.x - d.source.x) * (1 - size / 2 / norm(d)); })
                .attr("y2", function (d) { return (d.target.y - d.source.y) * (1 - size / 2 / norm(d)); })

            // position of the link start port
            link.selectAll("circle.start")
                .attr("cx", function (d) { return (d.target.x - d.source.x) * size / 2 / norm(d); })
                .attr("cy", function (d) { return (d.target.y - d.source.y) * size / 2 / norm(d); })

            // psotion of the link end port
            link.selectAll("circle.end")
                .attr("cx", function (d) { return (d.target.x - d.source.x) * (1 - size / 2 / norm(d)); })
                .attr("cy", function (d) { return (d.target.y - d.source.y) * (1 - size / 2 / norm(d)); })

            link.selectAll("text.start")
                .attr("dx", function (d) { return (d.target.x - d.source.x) * size / 2 / norm(d); })
                .attr("dy", function (d) { return (d.target.y - d.source.y) * size / 2 / norm(d); })

            link.selectAll("text.end")
                .attr("dx", function (d) { return (d.target.x - d.source.x) * (1 - size / 2 / norm(d)); })
                .attr("dy", function (d) { return (d.target.y - d.source.y) * (1 - size / 2 / norm(d)); })

        }

        // Handling mouse drag
        node.call(d3.drag()
            .on("start", drag_start)
            .on("drag", drag_drag)
            .on("end", drag_end));

        function drag_start(d) {
            if (!d3.event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function drag_drag(d) {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        }

        function drag_end(d) {
            if (!d3.event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

        // Handling mouse over
        function handleMouseOver(d) {
            div.transition()
                .duration(200)
                .style("opacity", .9);
            div.html(d.type + ": " + d.id)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        }

        function handleMouseOut(d) {
            div.transition()
                .duration(500)
                .style("opacity", 0);
        }

        // drag_handler(node);

        // run tickActions in every simulation step
        simulation.on("tick", tickActions);

    }

    // Display the raw topology data 
    function listTopology(network) {
        data = "<h1>Switches</h1>" + JSON.stringify(network.switches) + "<br>";
        data += "<h1>Links</h1>" + JSON.stringify(network.links) + "<br>";
        data += "<h1>Hosts</h1>" + JSON.stringify(network.hosts) + "<br>";
        $('#data').html(data);
    }

    function getTopology() {
        tabObj.buildTabs("#main", ["Graph", "Tables"], "Nothing to show!");
        var $svg = $('<svg width="1116" height="600"></svg>');
        var $data = $('<div id="data"></div>');
        tabObj.buildContent('Graph', $svg);
        tabObj.buildContent('Tables', $data);
        d3.json("/topology").then(function (data) {
            listTopology(data)
            plotGraph(toGraph(data));
        });
        tabObj.setActive();
    }

    // When the refresh button is clicked, clear the page and start over
    $('.refresh').on('click', function () {
        //$('svg').html("");
        getTopology();
    });

    getTopology();

});