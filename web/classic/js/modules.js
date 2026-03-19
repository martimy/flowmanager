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

/**
 * Definition of modules.
 *
 **/

// Makes a GET request to the controller
function BaseModule(command) {
	var cmd = command;
	var go = myGlobalObject;

	var run = function(element) {
		go.httpGetAsync(cmd, this.callback, element);
	};

	var callback = function(jsondata, element) {
		console.log(element);
	}

	return {
		callback: callback,
		run: run
	}
}

// Makes a POST request to the controller
function BasePostModule(command) {
	var cmd = command;
	var go = myGlobalObject;
	var idx;
	var parm = "";

	var dpInFilter = function (e, x) {
		idx = x;
		e.innerHTML ="Filter: <input class=\"filterInput\" size=20><button onClick=\"mainFilterFunc(this.parentElement,"+idx+")\">Send</button>";
	};

	var run = function(element) {
		go.httpPostAsync(cmd, this.param, this.callback, element);
	};

	var callback = function(jsondata, element) {
		console.log(element);
	}

	return {
		idx: this.idx,
		param: this.param,
		dpInFilter: dpInFilter,
		callback: callback,
		run: run
	}
}

function hc(myString) {
	return myString.replace("_"," ").replace(/\b\w/g, l => l.toUpperCase())
}

// Populates the Switch ID card
var dpList = function (jsondata, element) {
	var switches = JSON.parse(jsondata);
	var found = false;

	//var html = "";
	element.innerHTML = "";
	var ul = document.createElement("ul");
	ul.setAttribute("id", "swlist");
	for(var s in switches) {
		var num = +switches[s]; //("000000000000000" + switches[s].toString(16)).substr(-16);
		//html += num + "<br>";

		var li = document.createElement("li");
		li.innerHTML = num;
		if(switches[s] === myGlobalObject.dpid()) {
			li.classList.add("selected");
			found = true;
		}
		li.addEventListener("click", clickMe);
		ul.appendChild(li);
	}
	element.appendChild(ul);
	//element.innerHTML = html;
	if (!found && document.getElementById("swlist").firstChild) {
		var name  = document.getElementById("swlist").firstChild.innerHTML
		myGlobalObject.setDPID(name)
		moduleManager.loadModules(views);
	}
};

var dpStruct = function (jsondata, element) {
	var jsonobj = JSON.parse(jsondata);
	if(!jsonobj) return;
	var switchName = Object.keys(jsonobj);
	var struct = jsonobj[switchName];
	var html = "";
	for(var key in struct) {
		html += hc(key) + " : " + struct[key] + "<br>";
	}
	element.innerHTML = html;
};

var dpTable = function (jsondata, element) {
	var dispObj = function(obj) {
		// JSON to string?
		var str = "";
		if(Array.isArray(obj)) {
			for(var item in obj) {
				if(obj[item] instanceof Object) {

				}	else {
					str += obj[item].replace(":","=") + "<br>";
				}
			}
			return str;
		} else {
			var allKeys = Object.keys(obj);
			for(var key in allKeys) {
				str += allKeys[key] + " = " + obj[allKeys[key]] + "<br>";
			}
		}
		return str;
	};

	var jsonobj = JSON.parse(jsondata);
	if(!jsonobj) return;

	var switchName = Object.keys(jsonobj);

	// extract the flows
	var rows = jsonobj[switchName];

	// get the headers
	var col = [];
	for (var c in rows[0]) {
		col.push(c);
	}
	col.sort(); // A, B, C, ...
	col.reverse(); // ..., C, B, A

	// CREATE DYNAMIC TABLE.
	var table = document.createElement("table");
	//table.classList.add("fixed_headers");

	// CREATE HTML TABLE HEADER ROW USING THE EXTRACTED HEADERS ABOVE.
	var tr = table.insertRow(-1);                   // TABLE ROW.
	for (var i = 0; i < col.length; i++) {
		var th = document.createElement("th");      // TABLE HEADER.
		th.innerHTML = col[i].replace("_","<br>");
		tr.appendChild(th);
	}

	// ADD JSON DATA TO THE TABLE AS ROWS.
	for (var i = 0; i < rows.length; i++) {
		tr = table.insertRow(-1);
		for (var j = 0; j < col.length; j++) {
			var tabCell = tr.insertCell(-1);

			if(typeof rows[i][col[j]] === 'object') {
				//tabCell.innerHTML = dispObj(rows[i][col[j]]);
				tabCell.innerHTML = JSON.stringify(rows[i][col[j]]);
			} else {
				tabCell.innerHTML = rows[i][col[j]];
			}
		}
	}
	element.innerHTML = "";
	table.align = "center";
	element.appendChild(table);
}

// Populate the cards with data
var moduleManager = (function () {
	var time = 15000; //10 sec
	var myViews = [];

	var loadModules = function(views) {
		myViews.length = 0; // it is supposed to be the best way to clear an array
		self.clearInterval();

		for (var idx in views) {
			if(views[idx].call) {
				var card = document.getElementById(views[idx].id);
				var container = card.childNodes.item(CONTAINER_IDX);

				var myModule;
				if(views[idx].post) {
					myModule = new BasePostModule(views[idx].cmd);
					var bar = card.childNodes.item(BAR_IDX);
					myModule.dpInFilter(bar, idx);
				} else {
					myModule = new BaseModule(views[idx].cmd);
				}
				myModule.callback = views[idx].call;
				myModule.run(container);
				views[idx].module = myModule;		// we need this to refresh
				views[idx].container = container;	// we need this to refresh

				if(views[idx].ref) { // refresh is required
					myViews.push(views[idx]);
				};
			}
		}
		//myViews = views;
	};

	var refreshModules = function() {
		for (var idx in myViews) {
			myViews[idx].module.run(myViews[idx].container);
		}
	}

	var interval = self.setInterval(refreshModules,time);

	var setInterval = function(newtime) {
		time = newtime;
		interval = self.setInterval(loadModules,time);
	}

	var getInterval = function() {
		console.log(time);
	}

	return {
		setInterval: setInterval,
		loadModules: loadModules
	}
})();

function clickMe(e) {
	//console.log(e);
	myGlobalObject.setDPID(e.currentTarget.innerHTML);
	moduleManager.loadModules(views);
}

function mainFilterFunc(element, idx) {
	var str = element.getElementsByClassName("filterInput")[0].value;
	views[idx].module.param = str;
	views[idx].module.run(views[idx].container);
}
