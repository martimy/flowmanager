// Copyright (c) 2019 Maen Artimy
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

function BigTree() {
    const svg = d3.select("svg");


    let margin = { top: 50, right: 50, bottom: 50, left: 75 }
    let width = +svg.attr("width") - margin.left - margin.right
    let height = +svg.attr("height") - margin.top - margin.bottom;

    dx = 40;            // distance between branches
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

        root.y0 = height / 2;
        root.x0 = 0;
        // Returns the array of descendant nodes, starting with the root, then followed by each child in topological order.
        // then assign an id to each node, save a copy of children, and remove the children if condition matched
        root.descendants().forEach((d, i) => {
            //d.id = i;
            d.id = getID(d);
            d._children = d.children;
            //if (d.depth && d.data.name.length !== 7) d.children = null;
        });

        function update(source) {
            // const duration = d3.event && d3.event.altKey ? 2500 : 250;
            const duration = 750;
            const nodes = root.descendants().reverse();		// reverse the array order
            const links = root.links();						// Returns an array of links for this node

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

            // Enter any new nodes at the parent's previous position.
            const nodeEnter = node.enter().append("g")
                .attr('class', 'node')
                .attr("transform", d => `translate(${source.y0},${source.x0})`)
                // .on("click", d => { 				// toggle the display of children
                //     d.children = d.children ? null : d._children;
                //     update(d);
                // });

            nodeEnter.append("circle")
                .attr("r", 5)
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
                .attr("dy", function (d) { 
                    return `${d.depth % 2 == 0 ? 1.5 : -0.5}em` 
                })
                .attr("text-anchor", function (d) {
                    return d.children ? "middle" : "start";
                })
                .text(function (d) { return d.data.name; });

            // Get the nodes that have count property
            const leaves = node.filter(function (d) {
                return d.data.count !== undefined;
            });

            // Replace the leaves text 
            leaves.select('text').remove()
            leaves.append('text')
                .attr("dy", ".35em")
                .attr("x", function (d) {
                    return d.children ? -10 : 10;
                })
                .text(function (d) {
                    return d.data.name + ` (${d.data.count})`;
                });

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
    }

    return {
        draw: draw
    }
}
