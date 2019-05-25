
// http://bl.ocks.org/d3noob/8323795

// some explination http://www.d3noob.org/2014/01/tree-diagrams-in-d3js_11.html
// part of a book https://leanpub.com/d3-t-and-t-v4
// https://leanpub.com/D3-Tips-and-Tricks/read


function BigTree() {

    var svg = d3.select("svg");

    // Set the dimensions and margins of the diagram
    let margin = { top: 20, right: 90, bottom: 30, left: 90 }
    let width = +svg.attr("width") - margin.left - margin.right
    let height = +svg.attr("height") - margin.top - margin.bottom;

    // append the svg object to the body of the page
    // appends a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    svg.append("g")
        .attr("transform", `translate( ${margin.left} ,${margin.top} )`);

    var duration = 750, ids = [], root;

    // declares a tree layout and assigns the size
    var aTree = d3.tree().size([height, width]);

    function getID(d) {
        let key = d.data.name;
        if (d.parent) {
            key += d.parent.data.name;
        }
        let id = ids.indexOf(key);
        if (id >= 0) {
            return id;
        }
        ids.push(key);
        return ids.indexOf(key);
    }

    function draw(startData) {

        // Assigns parent, children, height, depth
        root = d3.hierarchy(startData, function (d) { return d.children; });
        root.x0 = height / 2;
        root.y0 = 0;

        // Collapse after the second level
        //root.children.forEach(collapse);
        update(root);
    }

    // Collapse the node and all it's children
    function collapse(d) {
        if (d.children) {
            d._children = d.children
            d._children.forEach(collapse)
            d.children = null
        }
    }

    function update(source) {
        let i = 0;
        // Assigns the x and y position for the nodes
        var treeData = aTree(root);

        // Compute the new tree layout.
        var nodes = treeData.descendants(),
            links = treeData.descendants().slice(1);

        // Normalize for fixed-depth.
        nodes.forEach(function (d) { d.y = d.depth * 200 });

        // ****************** Nodes section ***************************

        // Update the nodes...
        var node = svg.selectAll('g.node')
            .data(nodes, function (d) { return d.id = getID(d); });
            //.data(nodes, function (d) { return d.id || (d.id = ++i); });
            
        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter().append('g')
            .attr('class', 'node')
            .attr("transform", function (d) {
                return `translate( ${source.y0} , ${source.x0})`;
            })
            .on('click', click);

        // Add Circle for the nodes
        nodeEnter.append('circle')
            .attr('class', 'node')
            .attr('r', 1e-6)
            .style("fill", function (d) {
                return d._children ? "#246767" : "#fff";
            });

        // Add labels for the nodes
        nodeEnter.append('text')
            .attr("dy", function(d) { return `-${d.depth}em` })
            .attr("dx", function (d) {
                return d.children || d._children ? -13 : 13;
            })
            .attr("text-anchor", function (d) {
                return d.children || d._children ? "middle" : "start";
            })
            .text(function (d) { return d.data.name; });


        // UPDATE
        var nodeUpdate = nodeEnter.merge(node);

        // Transition to the proper position for the node
        nodeUpdate.transition()
            .duration(duration)
            .attr("transform", function (d) {
                return `translate( ${d.y} , ${d.x} )`;
            });

        // Update the node attributes and style
        nodeUpdate.select('circle.node')
            .attr('r', 5)
            .style("fill", function (d) {
                return d._children ? "#246767" : "#fff";
            })
            .attr('cursor', 'pointer');


        // Remove any exiting nodes
        var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function (d) {
                return `translate( ${source.y} , ${source.x} )`;
            })
            .remove();

        // On exit reduce the node circles size to 0
        nodeExit.select('circle')
            .attr('r', 1e-6);

        // On exit reduce the opacity of text labels
        nodeExit.select('text')
            .style('fill-opacity', 1e-6);

        // ****************** links section ***************************

        // Update the links...
        var link = svg.selectAll('path.link')
            .data(links, function (d) { return d.id; });

        // Enter any new links at the parent's previous position.
        var linkEnter = link.enter().insert('path', "g")
            .attr("class", "link")
            .attr('d', function (d) {
                var o = { x: source.x0, y: source.y0 }
                return diagonal(o, o)
            });

        // UPDATE
        var linkUpdate = linkEnter.merge(link);

        // Transition back to the parent element position
        linkUpdate.transition()
            .duration(duration)
            .attr('d', function (d) { return diagonal(d, d.parent) });

        // Remove any exiting links
        var linkExit = link.exit().transition()
            .duration(duration)
            .attr('d', function (d) {
                var o = { x: source.x, y: source.y }
                return diagonal(o, o)
            })
            .remove();

        // Store the old positions for transition.
        nodes.forEach(function (d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });

        // Creates a curved (diagonal) path from parent to the child nodes
        function diagonal(s, d) {
            path = `M ${s.y} ${s.x} C ${(s.y + d.y) / 2} ${s.x}, ${(s.y + d.y) / 2} ${d.x}, ${d.y} ${d.x}`
            return path
        }

        var leaves = node.filter(function (d) {
            return d.data.count !== undefined;
        });

        leaves.select('text').remove()
        leaves.append('text')
            .attr("dy", ".35em")
            .attr("x", function (d) {
                return d.children || d._children ? -13 : 13;
            })
            .attr("text-anchor", function (d) {
                return d.children || d._children ? "end" : "start";
            })
            .text(function (d) {
                return d.data.name + ` (${d.data.count})`;
            });


    }

    // Toggle children on click.
    function click(d) {

        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
        update(d);
    }
    return {
        draw: draw,
        update: update
    }
}

