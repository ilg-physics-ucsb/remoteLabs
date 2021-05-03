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

function validatePassword(P){
  var i = "physics";
  if(i == P){
    return true
  }
  else{
    return false
  }
}

function validateForm(evt, Name){
  evt.preventDefault();
  var i = document.getElementById("passwordInput");
  console.log(i.value);
  if(validatePassword(i.value)){
    window.open("https://ilg-physics-ucsb.github.io/physics5l-remotelabs-manual/"+Name, "_blank");
    return true;
  }
  else{
    alert("incorrect password");
    return false;
  }
}

function openForm(LabName){
  var f = document.getElementById(LabName);
  if(f.style.display === "none"){
    f.style.display = "block"
  }
  else{
    f.style.display = "none"
  }
}