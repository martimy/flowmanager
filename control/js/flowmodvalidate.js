// Read form data
function readKeyValue(str1, str2, out) {
  $('tr').has(str1).each(function() {
    var $key = $(this).find(str1).val().trim();
    var $value = $(this).find(str2).val().trim();
    if($key != '') {
      out[$key] = $value;
    }
  });
}


function readForm($form) {
  var formData = {};
  var $all = $form.find(':input');

  formData['dpid'] = parseInt($('#dpid').val())

  // Read number fields
  var $nums = $all.filter('[type=number]');
  $nums.each( function() {
    var n = parseInt(this.value);
    formData[this.id] = isNaN(n) ? 0 : n;
  })
  // goto table must be > table_id

  // Read checkboxes
  var $ckb = $all.filter('[type=checkbox]');
  $ckb.each( function() {
    formData[this.id] = this.checked;
  })

  // Read Match fields and values
  var matchObj = {};
  if(!formData["matchcheckbox"]) {
    readKeyValue('[name="matchfield"]', '[name="matchvalue"]', matchObj);
  }

  // Read Apply Actions fields and values
  var applyObj = {};
  readKeyValue('[name="applyaction"]', '[name="applyvalue"]', applyObj);

  // Read Actions fields and values
  var writeObj = {};
  readKeyValue('[name="writeaction"]', '[name="writevalue"]', writeObj);

  formData.match = matchObj;
  formData.apply = applyObj;
  formData.write = writeObj;

  return formData;
}

function toInt(fields, info, msg, flag) {
  var HINT = 1;
  for(var key in fields) {
    if (key ==='' || key == null || !(key in info)) {
      msg += 'Field ' + key + ' is undefined!';
      flag = false;
    } else {
        var isInt = info[key][HINT].indexOf('int') !== -1;
        if (isInt) {
          var num = parseInt(fields[key]);
          if (isNaN(num)) {
            flag = false;
            msg += 'Invalid value for field ' + key + "!";
          } else {
            fields[key] = num;
          }
        }
    }
  }
  flag = true;
}

function validate(formData, matchflds, actionflds) {
  var r = {"valid":{}, "message":"" };

  toInt(formData.match, matchflds, r.message, r.valid.match)
  toInt(formData.apply, actionflds, r.message, r.valid.apply)
  toInt(formData.match, actionflds, r.message, r.valid.write)

  return r;
}
