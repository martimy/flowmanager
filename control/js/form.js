(function () {
  var dl = '<datalist id="matchlist"> \
    <option value="IN_PORT"> \
    <option	value="ETH_DST"> \
    <option value="ETH_SRC"> \
    <option value="IPV4_SRC"> \
    <option value="IPV4_DST"> \
  </datalist>'

  var form = document.getElementById('matchform');
  var checkbox = document.getElementById('matchcheckbox');
  var table = document.getElementById('matchtable');

  // Handle 'change' events
  checkbox.addEventListener('change', function(e) {
    if(checkbox.checked) {
      document.getElementById('matchdiv').className = "hidden";
    } else {
      document.getElementById('matchdiv').className = "";
    }
  })

  // Handle 'click' events
  form.addEventListener('click', function(e) {
    if (e.target.value == '+') {
      /* If the Add button is clicked, add a new row in the table by copying
      the last HTML code of the last row, then change the button symbol.*/
      var len = table.rows.length;
      var lastrow = table.rows[len-1];
      var newrow = table.insertRow(len)
      newrow.innerHTML = lastrow.innerHTML;
      e.target.value = '-';
    } else if (e.target.value == '-') {
      line = e.target.parentNode.parentNode;
      table.deleteRow(line.rowIndex)
    }
  });


  function validMatchField(f) {
    if ( (f != '') && (matchList.indexOf(f)>=0) ) {
      return true;
    }
    return false;
  };

  // Handle 'submit' events
  form.addEventListener('submit', function(e) {
    e.preventDefault();

    var elements = this.elements;
    var count = elements.length;
    var obj = {}
    if(!elements.matchcheckbox.checked) {
      for(var i=0; i<count; i++) {
        /*Insert field/value pairs and key/value on the object. If two fields
        have the same value, then the last one remains*/
        if (elements[i].name == "matchfield") {
          var fv = elements[i].value;
          if(validMatchField(fv)) {
            obj[fv] = elements[i+1].value;
          } else {
            // do something
          }
          i++;
        }
      }
    }
    console.log(obj);
  });


  // Initialize
  var matchList = ["IN_PORT", "ETH_DST", "ETH_SRC", "IPV4_SRC", "IPV4_DST"]
  var node = document.createElement("datalist");
  for(var i=0; i<matchList.length; i++) {
    var opNode = document.createElement("option");
    var opText = document.createTextNode(matchList[i]);
    opNode.appendChild(opText);
    node.appendChild(opNode);
  }
  node.id = "matchlist"
  form.appendChild(node);

}());
