function CreateFlowTableFromJSON(jsondata, elementid) {
	var jsonobj = JSON.parse(jsondata);
	
	// extract the flows
	var flows = jsonobj['OFPFlowStatsReply']['body']
	var rows = [];
	for (var line in flows) {
		rows.push(flows[line]['OFPFlowStats']);
	}
	// get the headers
	var col = [];
	for (var c in rows[0]) {
		col.push(c);
	}
	col.reverse();	
	
	// CREATE DYNAMIC TABLE.
	var table = document.createElement("table");

	// CREATE HTML TABLE HEADER ROW USING THE EXTRACTED HEADERS ABOVE.
	var tr = table.insertRow(-1);                   // TABLE ROW.
	for (var i = 0; i < col.length; i++) {
		var th = document.createElement("th");      // TABLE HEADER.
		th.innerHTML = col[i];
		tr.appendChild(th);
	}

	// ADD JSON DATA TO THE TABLE AS ROWS.
	for (var i = 0; i < flows.length; i++) {
		tr = table.insertRow(-1);
		for (var j = 0; j < col.length; j++) {
			var tabCell = tr.insertCell(-1);

			if(typeof rows[i][col[j]] === 'object') {
				tabCell.innerHTML = "details";
			} else {
				tabCell.innerHTML = rows[i][col[j]];
			}
		}
	}
	
	var divContainer = document.getElementById("flowtable");
	divContainer.innerHTML = "";
	divContainer.appendChild(table);	
}

function showDetails(name) {
alert(name);
	var div = document.getElementById(name);
	//div.setAttribute("style", "display: block");
	//div.style.visibility= "visible";
}

function toggle(showHideDiv) {
	var ele = document.getElementById(showHideDiv);
	if(ele.style.display == "block") {
    		ele.style.display = "none";
  	}
	else {
		ele.style.display = "block";
	}
} 
