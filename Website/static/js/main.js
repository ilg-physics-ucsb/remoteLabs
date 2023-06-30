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
  var I = "Physics"
  if(i == P || I == P){
    return true
  }
  else{
    console.log(P)
    return false
  }
}

function validateForm(evt, Name, LabName){
  evt.preventDefault();
  var i = document.getElementById("passwordInput"+LabName)
  if(validatePassword(i.value)){
    window.open("https://ilg-physics-ucsb.github.io/physics5l-remotelabs-manual/"+Name, "_blank");
    return true;
  }
  else{
    alert("incorrect password");
    return false;
  }
}

function openForm(evt, Name){
  var i, formcontent, formlinks;
  formcontent = document.getElementsByClassName("formContent");
  for (i = 0; i < formcontent.length; i++) {
    formcontent[i].style.display = "none";
  }
  formlinks = document.getElementsByClassName("formLinks");
  for (i = 0; i < formlinks.length; i++) {
    formlinks[i].className = formlinks[i].className.replace(" active", "");
  }

  document.getElementById(Name).style.display = "block";
  evt.currentTarget.className += " active";
}