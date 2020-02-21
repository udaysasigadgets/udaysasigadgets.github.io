
function uPrint(s) {
    if(document.getElementById('logDiv') && document.getElementById('logDiv').style && document.getElementById('logDiv').style.display!='none') {
        document.getElementById('logDiv').innerHTML += s+'<br>';
        document.getElementById('logDiv').scrollTop=9999;
    }
}

function clearLog() {
    document.getElementById('logDiv').innerHTML = '';
}

//Have this for Backward compatibility
var americaStr = "United States,Canada,Argentina,Brazil,Chile,Mexico,";
var europeStr = "UK,Ireland,France,Germany,Spain,Italy,Sweden,Switzerland,Portugal,Belgium,Austria,Denmark,Netherlands,Norway,";
var asiaStr = "India,China,Indonesia,Malaysia,Japan,Taiwan,Singapore,Indonesia,Korea,Myanmar,Hong Kong,Philippines,Sri Lanka,Israel,Australia,New Zealand,";

var countries = new Array();

function save_options() {

  var select2 = document.getElementById("hideColumns");
  var hideColumns = select2.children[select2.selectedIndex].value;
  localStorage["hideColumns"] = hideColumns;

  countries.sort();
  localStorage["countries"] = countries;

  // Update status to let user know options were saved.
  var status = document.getElementById("optionStatus");
  status.innerHTML = "Your options have been saved successfully";
  status.style.display = "";
  setTimeout(function() {
    status.innerHTML = "";
    status.style.display = "none";
  }, 5000);
}

// Restores select box state to saved value from localStorage.
function restore_options() {
  var hideColumns = localStorage["hideColumns"];

  //Backward compatibility
  var marketType = localStorage["marketType"];
  if(marketType!=null) {
    if(marketType==1)
        countries = americaStr;
    else if(marketType==2)
        countries = europeStr;
    else if(marketType==3)
        countries = asiaStr;
    else
        countries = americaStr+europeStr+asiaStr;
  } else {
    countries = localStorage["countries"].split(',');
  }

  //countries.print();

  var select2 = document.getElementById("hideColumns");
  for (var i = 0; i < select2.children.length; i++) {
    var child = select2.children[i];
    if (child.value == hideColumns) {
      child.selected = "true";
      break;
    }
  }
  highLightOptions();
}

function highLightOptions() {

    var allElements = document.getElementsByClassName("floatDiv");
    for(var i=allElements.length-1;i>=0;i--)  {
        if(countries.contains(allElements[i].innerHTML)) {
            allElements[i].className = 'floatDivSelected';
        }
    }

}

function toggle(obj) {
    if(obj.className=='floatDiv') {
        obj.className = 'floatDivSelected';
        countries.add(obj.innerHTML);
    } else {
        obj.className = 'floatDiv';
        countries.remove(obj.innerHTML);
    }

    //countries.print();
}


Array.prototype.contains = function(obj) {
  var i = this.length;
  while (i--) {
    if (this[i] === obj) {
      return true;
    }
  }
  return false;
}

Array.prototype.add = function(obj) {
  //uPrint('Adding '+obj);
  var i = this.length;
  while (i--) {
    if (this[i] === obj) {
      return;
    }
  }
  this.push(obj);
  //uPrint('Adding '+obj+' complete');
}

Array.prototype.remove = function(obj) {
  var i = this.length;
  while (i--) {
    if (this[i] === obj) {
      this.splice(i,1);
    }
  }
}

Array.prototype.print = function() {
  var i = this.length;
  //uPrint('Number of entries : '+i);
  while (i--) {
    uPrint(this[i]);
  }
}


$(function() {
    $(".allCountries").on("click", ".floatDiv, .floatDivSelected", function() {
      if($(this).hasClass("floatDiv")) {
        $(this).removeClass("floatDiv").addClass("floatDivSelected");
        countries.add($(this).text());
      } else {
        $(this).removeClass("floatDivSelected").addClass("floatDiv");
        countries.remove($(this).text());
      }
    });

    $("#save").click(function() {
      save_options();
    });
    restore_options();
});