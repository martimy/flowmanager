var updateWidgets = (function () {

	var updateAll = function() {
		console.log(mySwitchWidget.display());
	};
	
	return {
		updateAll: updateAll
	}
})();

var switchWidget = (function () {
	var html = "<h1>Active Switches</h1><p>00000001</p>";
	
	var writeHTML = function(element) {
		document.getElementById(element).innerHTML = html;
	};
	
	return {
		writeHTML: writeHTML
	}
})();

var bootstrap = (function() {

	var loadwidgets = function(widgets) {
		for(var key in widgets){
			var myElement = document.getElementById(key);
			//var JavaScriptCode = document.createElement("script");	
			var js1 = '<script>document.getElementById("' + key + '").innerHTML = ' + '"<p>Hello JavaScript!</p>";</script>';
			//var js1 = widgets[key] + "?v" + Math.random();
			myElement.innerHTML = js1;
			
			//JavaScriptCode.setAttribute("src", js1);
			//document.getElementById(key).appendChild(JavaScriptCode);
		}
	};
	return {
		loadwidgets: loadwidgets
	}
})();

updateWidgets.updateAll();