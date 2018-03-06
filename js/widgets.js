/**
 * Definition of widgets.
 *
 **/
function BaseWidget(command) {
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

/**
 * The widget displaying active switches.
 **/
var mySwitchWidget = new BaseWidget("/stats/switches");
mySwitchWidget.callback = function (jsondata, element) {
	//var html = "<H1>Active Switches</H1>";
	var switches = JSON.parse(jsondata);
	//var switches = jsonobj['Switches']
	
	var container = document.getElementById(element);
	containeum = ("000000000000000" + switches[s].toString(16)).substr(-16);
		var p = document.createElement("a");
		p.innerHTML = num;
		p.addEvr.innerHTML = "";
	for(var s in switches) {
		var nentListener("click", clickMe);
		container.appendChild(p);
	}
};


var tinyWidget = new BaseWidget("/stats/flow/{dpid}");
tinyWidget.callback = CreateFlowTableFromJSON;	// this is defined in a separate file

/* ********************************** */

var myList = [
	{widget:tinyWidget, parent:"divleft"}/*, 
	{widget:mySwitchWidget, parent:"myDropdown"}*/
];

var widgetManager = (function (list) {
	var time = 15000; //10 sec

	function loadAll() {
		self.clearInterval();
		for(var idx in list) {
			list[idx].widget.run(list[idx].parent);
		};
	}
	
	var interval = self.setInterval(loadAll,time);	
	
	var setInterval = function(newtime) {
		time = newtime;
		interval = self.setInterval(loadAll,time);
	}
	
	var getInterval = function() {
		console.log(time);
	}
	
	return {
		setInterval: setInterval,
		//getInterval: getInterval,
		loadAll: loadAll
	}
})(myList);

//widgetManager.setInterval(30000);
//widgetManager.getInterval();