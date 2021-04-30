function opentab(evt, Name) {
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  document.getElementById(Name).style.display = "block";
  evt.currentTarget.className += " active";
}

// function CreateForm(){
//   console.log("PermissionRequest");
//   var f = document.createElement("FORM");
//   document.body.appendChild(f);
//   var i = document.createElement("INPUT");
//   // i.setAttribute("type", "Submit");
//   document.body.appendChild(i);
//   i.setAttribute("type", SubmitForm(i.value));
// }

// function SubmitForm(x){
//   console.log(x);
  
// }

function submitform(){
  var i = getElementById("password_Input").value
  console.log(i)
}