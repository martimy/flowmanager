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
 * All global objects are here.
 *
 **/
var myGlobalObject = (function () {
	console.log("myGlobalObject");
	var dpid = 1; //current datapath (switch) ID
	var myMasterURL = ""; //"http://localhost:8080";

	// returns full url for the command sent to the SDN controller
	var url = function(command) {
		var cmd = command.replace("<dpid>",dpid); //dpidStr(dpid));
		return myMasterURL + cmd;
	};

	// sends asynchronous request to the SDN controller
	function httpGetAsync(command, callback, element) {
		//console.log("httpGetAsync");
		var COMPLETE = 4;
		var OK = 200;
		var NOTFOUND = 404;
		var UNAVAILABLE = 503;
		// this script is for sending a GET request to a server
		var xmlHttp = new XMLHttpRequest();
		xmlHttp.onreadystatechange = function() {
			if (xmlHttp.readyState == COMPLETE) {
				if(xmlHttp.status == OK) {
					callback(xmlHttp.responseText, element);
				} else {
					console.log(xmlHttp.status);
				}
			}
		}
		xmlHttp.open("GET", url(command), true); // true for asynchronous
		xmlHttp.send(null);
	}

	function httpPostAsync(command, parm, callback, element) {
		//console.log("httpPostAsync");
		var COMPLETE = 4;
		var OK = 200;
		var NOTFOUND = 404;
		var UNAVAILABLE = 503;
		// this script is for sending a GET request to a server
		var xmlHttp = new XMLHttpRequest();
		xmlHttp.onreadystatechange = function() {
			if (xmlHttp.readyState == COMPLETE) {
				if(xmlHttp.status == OK) {
					callback(xmlHttp.responseText, element);
				} else {
					console.log(xmlHttp.status);
				}
			}
		}
		xmlHttp.open("POST", url(command), true); // true for asynchronous
		//xmlHttp.setRequestHeader("Content-Type", "application/json");
		xmlHttp.setRequestHeader("Content-Type", "plain/text");
		xmlHttp.send(parm);
	}

	function dpidStr(dpid) {
		return ("000000000000000" + dpid.toString(16)).substr(-16);
	}

	function setDPID(str) {
		dpid = parseInt(str);
	}

	function getDPID() {
		return dpid;
	}

	// these are the public objects
	return {
		dpid: getDPID,
		setDPID: setDPID,
		httpGetAsync: httpGetAsync,
		httpPostAsync: httpPostAsync,
	}
})();
