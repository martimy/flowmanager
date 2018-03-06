function CreateFlowTableFromJSON(jsondata, elementid) {
	var jsonobj = JSON.parse(jsondata);
	
	var switchName = Object.keys(jsonobj);
	
	// extract the flows
	var rows = Object.values(jsonobj)['0'];
	
	// get the headers
	var col = [];
	for (var c in rows[0]) {
		col.push(c);
	}
	col.sort()
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
	for (var i = 0; i < rows.length; i++) {
		tr = table.insertRow(-1);
		for (var j = 0; j < col.length; j++) {
			var tabCell = tr.insertCell(-1);

			if(typeof rows[i][col[j]] === 'object') {
				tabCell.innerHTML = "details";
				//JSON.stringify(rows[i][col[j]]);
			} else {
				tabCell.innerHTML = rows[i][col[j]];
			}
		}
	}
	
	var divContainer = document.getElementById(elementid);
	divContainer.innerHTML = "<h1>Flows of switch #" + switchName + "</h1>" ;
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
