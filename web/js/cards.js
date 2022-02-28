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


var BAR_IDX = 1;
var CONTAINER_IDX = 2;

var cardControl = ( function() {
	console.log("cardControl");
	var expand = function(e) {
		var size = e.parentElement.parentElement.parentElement.style.width;
		if(size==='96%') { // first value of size is ""
			e.parentElement.parentElement.parentElement.style.width = '45%';
		} else {
			e.parentElement.parentElement.parentElement.style.width = '96%';
		}
		//e.classList.toggle("active");
	};

	var collapse = function(e) {
		var c = e.parentElement.parentElement.parentElement.childNodes.item(CONTAINER_IDX);
		var disp = c.style.display;
		if(disp == "none") {
			c.style.display = "block"
		} else {
			c.style.display = "none";
		}
	};

	return {
		expand: expand,
		collapse: collapse
	}
})();

// Generate cards dynamicly based on the template given by local 'html' variable
// and data from the 'views' list. Cards are added to the 'parent' element
// passed as argument.
var generateCards = ( function() {
	console.log("generateCards");
	var html = 	"<div class=\"header\"><h1>{Title}</h1> \
			<div class=\"topnav\"><a href=\"javascript:void(0)\" onclick=\"cardControl.collapse(this)\">&#8722;</a> \
			<a href=\"javascript:void(0)\" onclick=\"cardControl.expand(this)\">&#8596;</a> \
			</div></div><div class=\"bar\"></div><div class=\"container\"><p>No data to display...</p> \
			</div><div class=\"footing\"></div>";

	// <a href=\"#refresh\">&#8634;</a>

	var run = function(views, parent) {
		console.log("generateCards.run");
		var doc = document.getElementById(parent);
		doc.innerHTML = "";
		for (var idx in views) {
			var d = document.createElement("div");
			d.id = views[idx].id;
			d.classList.add("card");
			var card = html.replace("{Title}", views[idx].dsc);
			d.innerHTML = card;
			doc.appendChild(d);
		}
	};

	/*var loadModules = function(views) {
		for (var idx in views) {
			if(views[idx].call) {
				var card = document.getElementById(views[idx].id);
				var container = card.childNodes.item(CONTAINER_IDX)

				var myModule = new BaseModule(views[idx].cmd);
				myModule.callback = views[idx].call;
				myModule.run(container);
			}
		}
	};*/

	return {
		run: run
	}
})();

var views = [
{id:"mSwitch", cmd:"/data?list=switches", dsc:"Switch ID(s)", call:dpList, ref:true},
{id:"mSwitchDesc", cmd:"/data?switchdesc=<dpid>", dsc:"Switch Desc", call:dpStruct},
{id:"mPortDesc", cmd:"/data?portdesc=<dpid>", dsc:"Port Desc", call:dpTable, ref:true},
{id:"mPorts", cmd:"/data?portstat=<dpid>", dsc:"Ports stats", call:dpTable, ref:true},
{id:"mAggFlows", cmd:"/data?flowsumm=<dpid>", dsc:"Flow Summary", call:dpTable, ref:true},
{id:"mTableStats", cmd:"/data?tablestat=<dpid>", dsc:"Table stats", call:dpTable, ref:true},
//{id:"mTableFeature", cmd:"/data?tablefeature=<dpid>", dsc:"Table Features", call:dpTable, ref:true},
//{id:"mQueueStats", cmd:"/data?queuestat=<dpid>", dsc:"Queue Stats", call:dpTable, ref:true},
//{id:"mQueueConfig", cmd:"/data?queueconfig=<dpid>", dsc:"Queue Configuration", call:dpTable, ref:true},
//{id:"mMeters", cmd:"/data?meterstat=<dpid>", dsc:"Meter stats", call:dpTable, ref:true}
];
