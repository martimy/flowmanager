$(function() {
    var size = 60;

    // var topDesc = {
    //     "nodes": [
    //       {"id": "Myriel", "group": 1},
    //       {"id": "Napoleon", "group": 1},
    //       {"id": "Mlle.Baptistine", "group": 1},
    //       {"id": "Mme.Magloire", "group": 2},
    //       {"id": "CountessdeLo", "group": 2}
    //     ],
    //     "links": [
    //         {"source": "Napoleon", "target": "Myriel", "value": 10},
    //         {"source": "Mlle.Baptistine", "target": "Myriel", "value": 8},
    //         {"source": "Mme.Magloire", "target": "Myriel", "value": 10},
    //         {"source": "Mme.Magloire", "target": "Mlle.Baptistine", "value": 6},
    //         {"source": "CountessdeLo", "target": "Myriel", "value": 1},
    //     ]}

    function add_prefix(obj) {
        return String(obj).replace(/^0+/, "Switch_");
    }
     
    function trim_zeros(obj) {
        return String(obj).replace(/^0+/, "");
    }

    // Takes JSON data and convert to a graph format that D3 understands
    function toGraph(top) {
        var nodes = [];
        var links = [];

        var lst = top.switches;
        for(var i=0; i<lst.length; i++) {
            nodes.push({"id":lst[i].dpid, "type": "switch"});
        }

        lst = top.links;
        for(var i=0; i<lst.length; i++) {
            if(lst[i].src.dpid < lst[i].dst.dpid) { // prevent duplicate links
               links.push({"source":lst[i].src.dpid, "target":lst[i].dst.dpid, "value": 4, 
                  "port":{"source": lst[i].src.port_no, "target":lst[i].dst.port_no}});
            }
        }

        lst = top.hosts;
        for(var i=0; i<lst.length; i++) {
            nodes.push({"id":lst[i].mac, "type": "host"});
            links.push({"source":lst[i].port.dpid, "target":lst[i].mac, 
                        "value": 2, 
                        "port":{"source":lst[i].port.port_no, "target":0}});
        }

        //console.log(nodes);
        return {"nodes": nodes, "links": links};
    }

    function plot(graph) {
        var svg = d3.select("svg");
        var width = +svg.attr("width");
        var height = +svg.attr("height");

        var simulation = d3.forceSimulation()
            .nodes(graph.nodes)
            .force("charge_force", d3.forceManyBody().strength(-size*10))
            .force("center_force", d3.forceCenter(width / 2, height / 2))
            .force("links", d3.forceLink(graph.links).id(function(d) { return d.id; }).distance(size*2))

        // Create nodes with image and text
        var node = svg.append("g")
            .attr("class", "nodes")
          .selectAll(".node")
            .data(graph.nodes)
          .enter().append("g")
            .attr("class", "node");
        
        node.append("image")
            .attr("xlink:href", function(d) { 
                if(d.type === "switch") {
                    return "/home/img/switch.svg"
                } else {
                    return "/home/img/host.svg"
                } 
            })
            .on("mouseover", handleMouseOver)
            .on("mouseout", handleMouseOut)
       
        node.append("text")
            .attr("class", "label")
            .attr("dy", size + 14)
            .text(function(d) { return d.id; });
       
        // Create links with lines, circles, and text
        var link = svg.append("g")
            .attr("class", "links")
          .selectAll(".link")
            .data(graph.links)
          .enter().append("g")
            .attr("class", "link");
                    
        link.append("line")
            .attr("stroke-width", function(d) { return d.value; });

        link.append("circle")
            .attr("class", "start")
            .attr("r","8")
        
        link.append("circle")
            .attr("class", "end")
            .attr("r","8")
        
        link.append("text")
            .attr("class", "start")
            .text(function(d) { return trim_zeros(d.port.source); })
       
        link.append("text")
            .attr("class", "end")        
            .text(function(d) { return trim_zeros(d.port.target); })


        function tickActions() {
            function norm(d) {
                return Math.sqrt((d.target.x - d.source.x)**2 + (d.target.y - d.source.y)**2);
            }

            node
                .attr("transform", function(d) { return "translate(" + (d.x - size/2) + "," + (d.y - size/2)+ ")"; });
            link
                .attr("transform", function(d) { return "translate(" + d.source.x  + "," + d.source.y  + ")"; });

            link.selectAll("line")
                .attr("x1", function(d) { return (d.target.x - d.source.x) * size/2/norm(d); })
                .attr("y1", function(d) { return (d.target.y - d.source.y) * size/2/norm(d); })
                .attr("x2", function(d) { return (d.target.x - d.source.x) * (1 - size/2/norm(d)); })
                .attr("y2", function(d) { return (d.target.y - d.source.y) * (1 - size/2/norm(d)); })
            
            link.selectAll("circle.start")
                .attr("cx", function(d) { return (d.target.x - d.source.x) * size/2/norm(d); })
                .attr("cy", function(d) { return (d.target.y - d.source.y) * size/2/norm(d); })
            
            link.selectAll("circle.end")
                .attr("cx", function(d) { return (d.target.x - d.source.x) * (1 - size/2/norm(d)); })
                .attr("cy", function(d) { return (d.target.y - d.source.y) * (1 - size/2/norm(d)); })

            link.selectAll("text.start")
                .attr("dx", function(d) { return (d.target.x - d.source.x) * size/2/norm(d); })
                .attr("dy", function(d) { return (d.target.y - d.source.y) * size/2/norm(d); })

            link.selectAll("text.end")
                .attr("dx", function(d) { return (d.target.x - d.source.x) * (1 - size/2/norm(d)); })
                .attr("dy", function(d) { return (d.target.y - d.source.y) * (1 - size/2/norm(d)); })   

          }
 
        var drag_handler = d3.drag()
            .on("start", drag_start)
            .on("drag", drag_drag)
            .on("end", drag_end);

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
            d.fx = null; //d.x;
            d.fy = null; //d.y;
        }
        
        function handleMouseOver(d, i) {
            // d3.select(this)
            //     .attr("width", 2*size)
            //     .attr("height", 2*size);
        }

        function handleMouseOut(d, i) {
            // d3.select(this)
            //     .attr("width", size)
            //     .attr("height", size);
        }

        drag_handler(node);

        simulation.on("tick", tickActions );
    }

    // Get Topology
    function getTopology() {
        $.get("/topology", {request:"topology"})
        .done( function(response) {
            if(response !== []) {
                // create an svg to draw in
                // var svg = d3.select("main")
                // .append("svg")
                // .attr("width", 1130)
                // .attr("height", 600)
                // .append('g')
                // //.attr('transform', 'translate(' + margin.top + ',' + margin.left + ')');

                data = "<h1>Switches</h1>" + JSON.stringify(response.switches) + "<br>";
                data += "<h1>Links</h1>" + JSON.stringify(response.links) + "<br>";
                data += "<h1>Hosts</h1>" + JSON.stringify(response.hosts) + "<br>";
                $('#data').html(data);
                var topDesc = toGraph(response);
                console.log(topDesc);
                plot(topDesc);
            }
        })
        .fail( function() {
            console.log("Cannot read topology!");
        });
    }

    // When the refresh button is clicked, clear the page and start over
    $('.refresh').on('click', function() {
        $('svg').html("");
        getTopology();
    });

    getTopology();
});