
// http://bl.ocks.org/d3noob/8323795

// some explination http://www.d3noob.org/2014/01/tree-diagrams-in-d3js_11.html
// part of a book https://leanpub.com/d3-t-and-t-v4
// https://leanpub.com/D3-Tips-and-Tricks/read
// https://observablehq.com/@d3/collapsible-tree

function BigTree() {
    const svg = d3.select("svg");


    let margin = { top: 20, right: 90, bottom: 30, left: 90 }
    let width = +svg.attr("width") - margin.left - margin.right
    let height = +svg.attr("height") - margin.top - margin.bottom;

    dx = 20;            // distance between branches
    dy = width / 5;    // distance between levels

    diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x);

    // Create a new tree layout and set node size
    tree = d3.tree().size([width, height]).nodeSize([dx, dy]);

    //svg.attr("viewBox", [-margin.left, -margin.top, width, height])
    svg.style("font", "10px sans-serif")
        .style("user-select", "none");

    const ids = [];

    function getID(d) {
        let key = typeof (d.data.name) == 'number' ? d.data.name.toString() : d.data.name;
        let p = d.parent;
        while (p) {
            key += d.parent.data.name;
            p = p.parent;
        }
        let id = ids.indexOf(key);
        if (id >= 0) {
            return id;
        }
        ids.push(key);
        // return ids.indexOf(key);
        return ids.length;
    }

    const gLink = svg.append("g")
        .attr("class", "link");
    // .attr("fill", "none")
    // .attr("stroke", "#555")
    // .attr("stroke-opacity", 0.4)
    // .attr("stroke-width", 1.5);

    // The pointer-events property defines whether or not an element reacts to pointer events.
    const gNode = svg.append("g")
        .attr("cursor", "pointer")
        .attr("pointer-events", "all");

    function draw(data) {

        //Constructs a root node from the specified hierarchical data. 
        const root = d3.hierarchy(data);

        root.x0 = height / 2;
        root.y0 = 0;
        // Returns the array of descendant nodes, starting with the root, then followed by each child in topological order.
        // then assign an id to each node, save a copy of children, and remove the children if condition matched
        root.descendants().forEach((d, i) => {
            //d.id = i;
            d.id = getID(d);
            d._children = d.children;
            //if (d.depth && d.data.name.length !== 7) d.children = null;
        });

        function update(source) {
            const duration = d3.event && d3.event.altKey ? 2500 : 250;
            const nodes = root.descendants().reverse();		// reverse the array order
            const links = root.links();						// Returns an array of links for this node, where 
            // each link is an object that defines source and 
            // target properties. The source of each link is 
            // the parent node, and the target is a child node.

            // Compute the new tree layout.
            tree(root);

            let left = root;
            let right = root;
            root.eachBefore(node => {
                if (node.x < left.x) left = node;
                if (node.x > right.x) right = node;
            });

            const height = right.x - left.x + margin.top + margin.bottom;

            const transition = svg.transition()
                .duration(duration)
                .attr("viewBox", [-margin.left, left.x - margin.top, width, height])
                .tween("resize", window.ResizeObserver ? null : () => () => svg.dispatch("toggle"));

            // Update the nodes…
            const node = gNode.selectAll("g")
                .data(nodes, function (d) { return d.id = getID(d); });				// bind data or select by ID?
            //.data(nodes, d => d.id);

            // Enter any new nodes at the parent's previous position.
            const nodeEnter = node.enter().append("g")
                .attr('class', 'node')
                .attr("transform", d => `translate(${source.y0},${source.x0})`)
                // .attr("fill-opacity", 0)
                // .attr("stroke-opacity", 0)
                .on("click", d => { 				// toggle the display of children
                    d.children = d.children ? null : d._children;
                    update(d);
                });

            nodeEnter.append("circle")
                .attr("r", 2.5)
                .attr("fill", d => d._children ? "#246767" : "#fff")
                .attr("stroke-width", 2);

            // nodeEnter.append("text")
            //     .attr("dy", "0.31em")
            //     .attr("x", d => d._children ? -6 : 6)
            //     .attr("text-anchor", d => d._children ? "end" : "start")
            //     .text(d => d.data.name)
            //     .clone(true).lower()
            //     .attr("stroke-linejoin", "round")
            //     .attr("stroke-width", 3)
            //     .attr("stroke", "white");

            nodeEnter.append('text')
                .attr("dy", function (d) { return `-${d.depth % 2}em` })
                .attr("dx", function (d) {
                    return d.children || d._children ? -13 : 13;
                })
                .attr("text-anchor", function (d) {
                    return d.children || d._children ? "middle" : "start";
                })
                .text(function (d) { return d.data.name; });

            // Transition nodes to their new position.
            const nodeUpdate = node.merge(nodeEnter).transition(transition)
                .attr("transform", d => `translate(${d.y},${d.x})`)
                .attr("fill-opacity", 1)
                .attr("stroke-opacity", 1);

            // Transition exiting nodes to the parent's new position.
            const nodeExit = node.exit().transition(transition).remove()
                .attr("transform", d => `translate(${source.y},${source.x})`)
                .attr("fill-opacity", 0)
                .attr("stroke-opacity", 0);

            // Update the links…
            const link = gLink.selectAll("path")
                .data(links, d => d.target.id);

            // Enter any new links at the parent's previous position.
            const linkEnter = link.enter().append("path")
                .attr("d", d => {
                    const o = { x: source.x0, y: source.y0 };
                    return diagonal({ source: o, target: o });
                });

            // Transition links to their new position.
            link.merge(linkEnter).transition(transition)
                .attr("d", diagonal);

            // Transition exiting nodes to the parent's new position.
            link.exit().transition(transition).remove()
                .attr("d", d => {
                    const o = { x: source.x, y: source.y };
                    return diagonal({ source: o, target: o });
                });

            // Stash the old positions for transition.
            root.eachBefore(d => {
                d.x0 = d.x;
                d.y0 = d.y;
            });
        }

        update(root);

        //return svg.node();
    }

    return {
        draw: draw
    }
}
