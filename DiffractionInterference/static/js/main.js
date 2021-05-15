
// This is the function that adds the video stream. You can have it do other things (like turn off a loading element) once it receives a stream.
function connectStream(stream, videoElement) {
    if (videoElement) {
        console.log("got a stream! Putting stream in the following video" );
        console.log(videoElement);
        videoElement.srcObject = stream;
        videoElement.setAttribute("data-playing", "true");
        // videoElement.play();
    }
}

//This function runs if there is an error returned from the websocket connecting to the stream.
function errorStream(error){
    alert(error);
}

// This functions gets run when the websocket is closed.
function closeStream(videoElement) {
    if (videoElement) {
        videoElement.srcObject = null;
        videoElement.setAttribute("data-playing", "false");
        console.log("websocket closed. bye bye!");
    }
}

// This function runs when the WebSocket sends a message. Note that this is not the WebRTC Datachannel.
function onWebsocketMessage(message){
    alert(message);
}

function setupWebRTC(port, videoElement, vformat, hardwareCodec=false) {
    var signalling_server_hostname = location.hostname || "192.168.0.2";
    // var signalling_server_address = signalling_server_hostname + ':' + (port || (location.protocol === 'https:' ? 443 : 80));
    var signalling_server_address = signalling_server_hostname + location.pathname + "ws"
    var protocol = location.protocol === "https:" ? "wss:" : "ws:";
    // var address = url + ':' + (port || (protocol === 'https:' ? 443 : 80)) + '/stream/webrtc';
    // var address = location.hostname + ':' + (port || (protocol === 'https:' ? 443 : 80)) + '/stream/webrtc';
    // protocol = "wss:";
    // var address = url + "/webrtc";
    var wsurl = protocol + '//' + signalling_server_address;

    console.log(videoElement);
    if (videoElement && videoElement.getAttribute('data-playing') == "false") {
        var signalObj = new signal(wsurl, videoElement, vformat, hardwareCodec, connectStream, errorStream, closeStream, onWebsocketMessage)
    }
    return signalObj
}

var setExposure, exposureValue, setBrightness, brightnessValue, setContrast, contrastValue
var exposureDisplay, cameraControl, exposureSlider, brightnessDisplay, brightnessSlider, contrastDisplay, contrastSlider
var cartSlider, cartDisplay, cartValue, setCart
var extremaModal, stageModal

function controllerResponseHandler(cmd) {
    var components = cmd.split("/");
    var device = components[0]
    var info = components[1]
    var infoValue = components[2]

    if (infoValue == "limit") {
        extremaModal.modal("show")
    }

    if (device == "Stage") {
        stageModal.modal("hide")
    }
}   

$("document").ready(function () {
    var stepsPerMM= 0.5; //This value is set by finalized mechanical arrangements.
    var currentPosition = 0;
    var liveStream = document.getElementById("v");
    var staticCrossHairs = document.getElementById('imgCrossHairs')
    extremaModal = $("#extremaModal")
    stageModal = $("#stageModal")
    exposureDisplay = $("#expVal")[0]
    exposureSlider = $("#exposureSlider")[0]
    brightnessDisplay = $("#briVal")[0]
    brightnessSlider = $("#brightnessSlider")[0]
    contrastDisplay = $("#conVal")[0]
    contrastSlider = $("#contrastSlider")[0]
    cameraControl = $("#cameraControl")[0]
    mcameraControl = $("#ModalCamera")[0]
    cartDisplay = $("#cartVal")[0]
    cartSlider = $('#cartSlider')[0]

  
//for modal
    var loadingModal = $("#loadingModal")
    var mWrapList = ["#mapster_wrap_0", "#mapster_wrap_1"]

    loadingModal.on("shown.bs.modal", function(e){
        intervalId = setInterval(function() {
            if(!dataChannel){
                return
            }    
            //Run when all mwraps exist.
            viewCam.click()
            console.log("hiding modal")
            //Hide Loading Screen
            loadingModal.modal("hide")
            //Stop repeating check
            clearInterval(intervalId)
    
        }, 500)
    })
    loadingModal.modal('show')




    // OffCam.addEventListener('click', function() {
    //     dataChannel.send("Camera/camera/off")
    // })

    //for Time Limit
     window.setTimeout(timeOutHandler,10800000)
 
     function timeOutHandler(){
        //  TEMP CHANGE
         mainCamSignal.hangup()
         alert("Your session has timed out.")
     }
 
     function startTimer(duration, display) {
         var timer = duration, hours, minutes, seconds;
         setInterval(function () {
            hours = Math.floor(parseInt(timer / 3600, 10));
            minutes = Math.floor(parseInt(timer % 3600 / 60 , 10));
            seconds = Math.floor(parseInt(timer % 3600 % 60, 10));
        
            hours = hours <10 ? "0" + hours : hours;
            minutes = minutes < 10 ? "0" + minutes : minutes;
            seconds = seconds < 10 ? "0" + seconds : seconds;
             
            display.textContent = hours + ":" + minutes + ":" + seconds;
     
             if (--timer < 0) {
                 timer = duration;
             }
         }, 1000);
     }
     
     window.onload = function () {
         var threeHours = 3 * 60 * 60,
             display = document.querySelector('#time');
         startTimer(threeHours, display);
     
         TransparencyOff.style.display = "block";                      
         TransparencyOn.style.display = "none"; 
        }
 
    // for Diffraction Slits
    
    var A02 = document.getElementById('a02')
    var A04 = document.getElementById('a04');
    var A08 = document.getElementById('a08');
    var A16 = document.getElementById('a16');

    var VaryWidth = document.getElementById('a02-20');

    var SingleOpen = document.getElementById('singleOpen');
    var LineSlit = document.getElementById('line+slit');
    var LittleHole = document.getElementById('ø0.2');
    var BigHole = document.getElementById('ø0.4');

    var Square = document.getElementById('square');
    var Hex = document.getElementById('hex');
    var Dots = document.getElementById('dots');
    var Holes = document.getElementById('holes');

    // for Interference Slits
    var A04D25 = document.getElementById('a04d25');
    var A04D50 = document.getElementById('a04d50');
    var A08D25 = document.getElementById('a08d25');
    var A08D50 = document.getElementById('a08d50');

    var varySpacing = document.getElementById('a04d0125-075');

    var TwoSlit = document.getElementById('2slit');
    var ThreeSlit = document.getElementById('3slit');
    var FourSlit = document.getElementById('4slit');
    var FiveSlit = document.getElementById('5slit');
   
    var MultiOpen = document.getElementById('multiOpen');
    var FarClose = document.getElementById('farClose');
    var WideThin = document.getElementById('wideThin');
    var ThreeTwo = document.getElementById('threeTwo');
    

    //for Screen
    var screenWhite = document.getElementById('openEye');
    var screenClear = document.getElementById('closedEye');
    var TransparencyOff = document.getElementById('TransparencyOFF');
    var TransparencyOn = document.getElementById('TransparencyON');
    TransparencyOn.style.display="none";
    TransparencyOff.style.display="block";

    //for Background
    var darkSwitch = document.getElementById('darkSwitch')
    var DarkTOGGLE = document.getElementById('darkTOGGLE');
    var DarkState = false;

    //for Ambient Light
    var lightSwitch = document.getElementById('lightSwitch');
    var AmbientTOGGLE = document.getElementById('ambientTOGGLE');
    var AmbientState = false;

    // for Nudging Slits
    var nudgeUp = document.getElementById("up")
    var nudgeDown = document.getElementById("down")
    var nudgeSteps = 25
    var nudgeSingleSteps = 50
    var lastSlit = "none"

    //for Stage Motion
    var stageCloser=document.getElementById('closer')
    var stageFarther=document.getElementById('farther')
    var stageSteps = 250;
    var moveStageTo = 0;
    var currValue = cartSlider.value;
    var prevValue;

    //for Laser Power
    //UNCOMMENT WHEN ADDED -- THEN MOVE EVENT LISTENER DOWN TO PROPER LOCATION
    var laser = document.getElementById("laserSwitch")
    var laserState = false;
    laser.style.opacity=0.2;
 
    //for Snapshot 
    var snapShot = document.getElementById("pushButton")
    

    //BEGIN Switches 
    //BEGIN Ambient Toggling 
     
    AmbientTOGGLE.addEventListener('click', function(){
        console.log("Ambient light was switched");
        if(AmbientState){
            dataChannel.send("Ambient/off/")            //use this command with GPIO
            AmbientState=false;
            AmbientTOGGLE.title="Click here to turn ON";
            lightSwitch.style.transform='rotate(0deg)';
                     }
        else{
            dataChannel.send("Ambient/on/")                 //use this command with GPIO
            AmbientState=true;
            AmbientTOGGLE.title="Click here to turn OFF";
            lightSwitch.style.transform='rotate(180deg)';
        }
    })

    //END Ambient Toggling
    
    //BEGIN Background Toggling
      
    DarkTOGGLE.addEventListener('click', function(){
           if(!DarkState){
            console.log("Background was darkened. Controls were hidden.");
            //hide controls; turn background black
            // $('img').css("visibility", "hidden")
            $('body').css("background", "black")
            darkSwitch.style.visibility = "visible"
            laser.style.visibility = "visible"
            DarkState=true;
            DarkTOGGLE.title="Click here to reveal controls";
            darkSwitch.style.transform='rotate(180deg)';
                     }
        else{
            console.log("Background was lit. Controls were revealed.");
            //reveal controls; turn background white
            $('img').css("visibility", "visible")
            $('body').css("background", "white")
            if (!staticCrossHairsStatus) {
                staticCrossHairs.style.visibility = "hidden"
            }   
            DarkState=false;
            DarkTOGGLE.title="Click here to darken the background";
            darkSwitch.style.transform='rotate(0deg)';
        }
    })

   //END Background Toggling

    //BEGIN Screen Toggling

    screenWhite.addEventListener('click', function(){
        console.log("Screen power was turned off, thus the screen is opaque");
        // if (!eyeFirstClick) {
        //     eyeFirstClick = false
        //     dataChannel.send("Screen/off/");
        //     console.log("Eye clicked for the first time")
        // }  
        dataChannel.send("ASDIpdu/off/Screen");
        TransparencyOff.style.display = "block";                      
        TransparencyOn.style.display = "none";  
    })
    screenClear.addEventListener('click', function(){        
        console.log("Screen power was turned on, thus the screen is clear");         
        dataChannel.send("ASDIpdu/on/Screen");
        TransparencyOff.style.display = "none";                      
        TransparencyOn.style.display = "block"; 
    })

    //BEGIN Laser
    laser.addEventListener("click", function() {
        if (laserState) {
            console.log("Laser was turned off")
            dataChannel.send("ASDIpdu/off/Laser")
            laserState = false;
            laser.style.opacity=0.2;
        } else {
            console.log("Laser was turned on")
            dataChannel.send("ASDIpdu/on/Laser")
            laserState = true;
            laser.style.opacity=1;
        }
    })
   //END Laser
    
    //BEGIN SnapShot
    // snapShot.addEventListener("click", function () {
    //     console.log("Snapshot was taken")
    //     // Do unknown stuff here to make a picture happen.
    // })
    //END SnapShot

    // END Switches

   // BEGIN Single Slit Wheel Buttons
{
    A02.addEventListener('click', function(event) {
        console.log("A02 was clicked");
        event.stopPropagation();
        dataChannel.send("MultiSlits/goto/MultiOpen");
        dataChannel.send("SingleSlits/goto/A02");
        lastSlit = "single"
    })
    A04.addEventListener('click', function(event) {
        console.log("A04 was clicked");
        event.stopPropagation();
        dataChannel.send("MultiSlits/goto/MultiOpen");
        dataChannel.send("SingleSlits/goto/A04");
        lastSlit = "single"
    })
    A08.addEventListener('click', function(event) {
        console.log("A08 was clicked");
        event.stopPropagation();
        dataChannel.send("MultiSlits/goto/MultiOpen");
        dataChannel.send("SingleSlits/goto/A08");
        lastSlit = "single"
    })
    A16.addEventListener('click', function(event) {
        console.log("A16 was clicked");
        event.stopPropagation();
        dataChannel.send("MultiSlits/goto/MultiOpen");
        dataChannel.send("SingleSlits/goto/A16");
        lastSlit = "single"
    })
    VaryWidth.addEventListener('click', function(event) {
        console.log("Variable Width Slit was clicked");
        event.stopPropagation();
        dataChannel.send("MultiSlits/goto/MultiOpen");
        dataChannel.send("SingleSlits/goto/VaryWidth");
        lastSlit = "single"
    })
    SingleOpen.addEventListener('click', function(event) {
        console.log("SingleOpen was clicked");
        event.stopPropagation();
        dataChannel.send("MultiSlits/goto/MultiOpen");
        dataChannel.send("SingleSlits/goto/SingleOpen");
        lastSlit = "single"
    })
    LineSlit.addEventListener('click', function(event) {
        console.log("Line+Slit was clicked");
        event.stopPropagation();
        dataChannel.send("MultiSlits/goto/MultiOpen");
        dataChannel.send("SingleSlits/goto/LineSlit");
        lastSlit = "single"
    })
    LittleHole.addEventListener('click', function(event) {
        console.log("Little hole was clicked");
        event.stopPropagation();
        dataChannel.send("MultiSlits/goto/MultiOpen");
        dataChannel.send("SingleSlits/goto/LittleHole");
        lastSlit = "single"
    })
    BigHole.addEventListener('click', function(event) {
        console.log("Big hole was clicked");
        event.stopPropagation();
        dataChannel.send("MultiSlits/goto/MultiOpen");
        dataChannel.send("SingleSlits/goto/BigHole");
        lastSlit = "single"
    })
    Square.addEventListener('click', function(event) {
        console.log("Square grid was clicked");
        event.stopPropagation();
        dataChannel.send("MultiSlits/goto/MultiOpen");
        dataChannel.send("SingleSlits/goto/Square");
        lastSlit = "single"
    })
    Hex.addEventListener('click', function(event) {
        console.log("Hexagonal grid was clicked");
        event.stopPropagation();
        dataChannel.send("MultiSlits/goto/MultiOpen");
        dataChannel.send("SingleSlits/goto/Hex");
        lastSlit = "single"
    })
    Dots.addEventListener('click', function(event) {
        console.log("Random dots was clicked");
        event.stopPropagation();
        dataChannel.send("MultiSlits/goto/MultiOpen");
        dataChannel.send("SingleSlits/goto/Dots");
        lastSlit = "single"
    })
    Holes.addEventListener('click', function(event) {
        console.log("Random holes was clicked");
        event.stopPropagation();
        dataChannel.send("MultiSlits/goto/MultiOpen");
        dataChannel.send("SingleSlits/goto/Holes");
        lastSlit = "single"
    })
}
   // END Single Slite Wheel Buttons
   
   // BEGIN Multiple Slits Wheel Buttons
{
    A04D25.addEventListener('click', function(event) {
        console.log("a=0.04, d=0.25 was clicked");
        event.stopPropagation();
        dataChannel.send("SingleSlits/goto/SingleOpen");
        dataChannel.send("MultiSlits/goto/A04D25");
        lastSlit = "multi"
    })
    A04D50.addEventListener('click', function(event) {
        console.log("a=0.04, d=0.50 was clicked");
        event.stopPropagation();
        dataChannel.send("SingleSlits/goto/SingleOpen");
        dataChannel.send("MultiSlits/goto/A04D50");
        lastSlit = "multi"
    })
    A08D25.addEventListener('click', function(event) {
        console.log("a=0.08, d=0.25 was clicked");
        event.stopPropagation();
        dataChannel.send("SingleSlits/goto/SingleOpen");
        dataChannel.send("MultiSlits/goto/A08D25");
        lastSlit = "multi"
    })
    A08D50.addEventListener('click', function(event) {
        console.log("a=0.08, d=0.50 was clicked");
        event.stopPropagation();
        dataChannel.send("SingleSlits/goto/SingleOpen");
        dataChannel.send("MultiSlits/goto/A08D50");
        lastSlit = "multi"
    })
    varySpacing.addEventListener('click', function(event) {
        console.log("Variable Slit Spacing was clicked");
        event.stopPropagation();
        dataChannel.send("SingleSlits/goto/SingleOpen");
        dataChannel.send("MultiSlits/goto/VarySpacing");
        lastSlit = "multi"
    })
    TwoSlit.addEventListener('click', function(event) {
        console.log("2 slits was clicked");
        event.stopPropagation();
        dataChannel.send("SingleSlits/goto/SingleOpen");
        dataChannel.send("MultiSlits/goto/TwoSlit");
        lastSlit = "multi"
    })
    ThreeSlit.addEventListener('click', function(event) {
        console.log("3 slits was clicked");
        event.stopPropagation();
        dataChannel.send("SingleSlits/goto/SingleOpen");
        dataChannel.send("MultiSlits/goto/ThreeSlit");
        lastSlit = "multi"
    })
    FourSlit.addEventListener('click', function(event) {
        console.log("4 slits was clicked");
        event.stopPropagation();
        dataChannel.send("SingleSlits/goto/SingleOpen");
        dataChannel.send("MultiSlits/goto/FourSlit");
        lastSlit = "multi"
    })
    FiveSlit.addEventListener('click', function(event) {
        console.log("5 slits was clicked");
        event.stopPropagation();
        dataChannel.send("SingleSlits/goto/SingleOpen");
        dataChannel.send("MultiSlits/goto/FiveSlit");
        lastSlit = "multi"
    })
    MultiOpen.addEventListener('click', function(event) {
        console.log("2 slits vs 1 slit was clicked");
        event.stopPropagation();
        dataChannel.send("SingleSlits/goto/SingleOpen");
        dataChannel.send("MultiSlits/goto/MultiOpen");
        lastSlit = "multi"
    })
    FarClose.addEventListener('click', function(event) {
        console.log("Comparison of slit separations was clicked");
        event.stopPropagation();
        dataChannel.send("SingleSlits/goto/SingleOpen");
        dataChannel.send("MultiSlits/goto/FarClose");
        lastSlit = "multi"
    })
    WideThin.addEventListener('click', function(event) {
        console.log("Wide slit vs thin slit was clicked");
        event.stopPropagation();
        dataChannel.send("SingleSlits/goto/SingleOpen");
        dataChannel.send("MultiSlits/goto/WideThin");
        lastSlit = "multi"
    })
    ThreeTwo.addEventListener('click', function(event) {
        console.log("3 slits vs 2 slit was clicked");
        event.stopPropagation();
        dataChannel.send("SingleSlits/goto/SingleOpen");
        dataChannel.send("MultiSlits/goto/ThreeTwo");
        lastSlit = "multi"
    })
}
    // END Single Slite Wheel Buttons

    // BEGIN Stage Motion
    stageCloser.addEventListener('click', function() {
        console.log("Stage moved closer to slits.")
        moveStageTo = Math.round(currValue - ((stageSteps*100)/9750))
        dataChannel.send("Stage/move/" + (-stageSteps))
        cartSlider.value = moveStageTo
        cartDisplay.innerHTML = cartSlider.value
        currValue = cartSlider.value
    })

    stageFarther.addEventListener('click', function() {
        console.log("Stage moved farther from slits.")
        moveStageTo = Math.round(+currValue+((stageSteps*100)/9750))
        dataChannel.send("Stage/move/" + stageSteps)
        cartSlider.value = moveStageTo
        cartDisplay.innerHTML = cartSlider.value
        currValue = cartSlider.value
    })

    getCartSliderValue = function(){
        currValue = cartSlider.value
        prevValue = currValue
    }

    setCart = function(){
        console.log("move cart to "+cartSlider.value)
        moveStageTo = Math.round(9750*((cartSlider.value-prevValue)/100))
        if (moveStageTo > 9750/6) {
            showStageModal()
        }
        dataChannel.send("Stage/move/"+ moveStageTo)
        currValue = cartSlider.value
    }

    async function showStageModal() {
        stageModal.modal("show")
        await sleep(2500)
    }
    
    cartValue = function(){
        cartDisplay.innerHTML=cartSlider.value
        currValue = cartSlider.value
    }
    
    // END Stage Motion

    // BEGIN Nudge of Slits
    // Motion defined with respect looking at face
    nudgeUp.addEventListener("click", function() {
        if (lastSlit == "single") {
            console.log("Nudging Single Slit Up")
            dataChannel.send("SingleSlits/move/" + (-nudgeSingleSteps))
        } else if (lastSlit == "multi") {
            console.log("Nudging Multi Slit Up")
            dataChannel.send("MultiSlits/move/" + nudgeSteps)
        } else {
            console.log("No slit to move yet.")
        }
    })

    nudgeDown.addEventListener("click", function() {
        if (lastSlit == "single") {
            console.log("Nudging Single Slit Down")
            dataChannel.send("SingleSlits/move/" + nudgeSingleSteps)
        } else if (lastSlit == "multi") {
            console.log("Nudging Multi Slit Down")
            dataChannel.send("MultiSlits/move/" + (-nudgeSteps))
        } else {
            console.log("No slit to move yet.")
        }
    })
    // END Nudge of Slits

    // BEGIN Camera Switching
    var viewCam = document.getElementById("ViewCam");
    var rulerCam = document.getElementById("RulerCam");
    var screenCam = document.getElementById("ScreenCam");

            
                     
    function sleep(ms){
        return new Promise(r => setTimeout(r, ms));
    }

    async function updateCameraSetting(setting, newValue) {
        dataChannel.send("Camera/imageMod/" + setting + "," + newValue)
        currentCameraSettings[setting] = newValue
    }

    async function updateManyCameraSettings(currentSettings, newSettings) {
        for (const setting in newSettings) {
            var newValue = newSettings[setting]
            var oldValue = currentSettings[setting]
            if (newValue !== oldValue) {
                console.log("Updating " + setting)
                updateCameraSetting(setting, newValue)
                await sleep(50)
            }
        }

    }

    var cameraDefaults = {
        "frame_rate":15,
        "brightness": 50,
        "contrast": 0,
        "saturation": 0,
        "red_balance": 100,
        "blue_balance": 100,
        "shutter_speed": 0,
        "iso_sensitivity": 400,
        "awb_mode": 0,
        "exposure_mode": 1,
        "drc_strength": 0
    }

    var defaultScreenCameraSettings = {
        "frame_rate":2,
        "brightness": 50,
        "contrast": 0,
        "saturation": 0,
        "red_balance": 100,
        "blue_balance": 100,
        "shutter_speed": 6000,
        "iso_sensitivity": 400,
        "awb_mode": 6,
        "exposure_mode": 5,
        "drc_strength": 0
    }

    var currentCameraSettings = JSON.parse(JSON.stringify(cameraDefaults))
    var screenCameraSettings = JSON.parse(JSON.stringify(defaultScreenCameraSettings))


    setExposure = function(){
        updateCameraSetting("shutter_speed", exposureSlider.value)
        screenCameraSettings["shutter_speed"] = exposureSlider.value
        // dataChannel.send("Camera/imageMod/shutter_speed,"+exposureSlider.value)
    }
    
    exposureValue = function(){
        exposureDisplay.innerHTML=exposureSlider.value
    }
    
    setBrightness = function(){
        updateCameraSetting("brightness", brightnessSlider.value)
        screenCameraSettings["brightness"] = brightnessSlider.value
        // dataChannel.send("Camera/imageMod/brightness,"+brightnessSlider.value)
    }
    
    brightnessValue = function(){
        brightnessDisplay.innerHTML=brightnessSlider.value + "%"
    }
    
    setContrast = function(){
        updateCameraSetting("contrast", contrastSlider.value)
        screenCameraSettings["contrast"] = contrastSlider.value
        // dataChannel.send("Camera/imageMod/contrast,"+contrastSlider.value)
    }
    
    contrastValue = function(){
        contrastDisplay.innerHTML=contrastSlider.value + "%"
    }
    



    viewCam.addEventListener("click", function() {
        console.log("Switched to view cam")
        dataChannel.send("Camera/camera/b")
        // await sleep(100);
        updateManyCameraSettings(currentCameraSettings, cameraDefaults) 
        liveStream.style.transform = "rotate(0deg)"
        // cameraControl.style.display = "None"
        mcameraControl.style.display = "None"
    })

    rulerCam.addEventListener("click", function() {
        console.log("Switched to ruler cam")
        dataChannel.send("Camera/camera/a") //Needs to be updated to proper camera
        // await sleep(100)
        updateManyCameraSettings(currentCameraSettings, cameraDefaults)
        liveStream.style.transform = "rotate(0deg)"
        // cameraControl.style.display = "None"
        mcameraControl.style.display = "None"
    })

    screenCam.addEventListener("click", function() {
        console.log("Switched to screen cam")
        dataChannel.send("Camera/camera/c")
        // await sleep(100)
        updateManyCameraSettings(currentCameraSettings, screenCameraSettings)
        // cameraControl.style.display = "Block"
        mcameraControl.style.display = "Block"
    })
    // END Camera Switching

     //for LiveFeed  
     var mainCamSignal = setupWebRTC(8081, liveStream, 100);
   

 
 //map highlights - This is the script that styles effect of mouseOver and clicks on image maps

    // $('#openEye').mapster({
    //     mapKey:'id',
    //     fillColor: 'f5f5b5',
    //     fillOpacity: 0.6,
    //     render_select: { 
    //         fillOpacity: 0.3
    //     },
    //     singleSelect: true
    //     // scaleMap: true
    // }).parent().css({"margin":"0 auto"});

    // $('#closedEye').mapster({
    //     mapKey:'id',
    //     fillColor: 'f5f5b5',
    //     fillOpacity: 0.6,
    //     render_select: { 
    //         fillOpacity: 0.3
    //     },
    //     singleSelect: true
    //     // scaleMap: true
    // }).parent().css({"margin":"0 auto"});

    $('#myModalCamera').draggable()

    $('#diffractionSlitsPic').mapster({
    mapKey:'id',
    fillColor: 'f5f5b5',
    fillOpacity: 0.6,
    render_select: { 
        fillOpacity: 0.3
    },
    singleSelect: true
    // scaleMap: true
  }).parent().css({"margin":"0 auto"});

  $('#interferenceSlitsPic').mapster({
    mapKey:'id',
    fillColor: 'f5f5b5',
    fillOpacity: 0.6,
    render_select: { 
        fillOpacity: 0.3
    },
    singleSelect: true
    // scaleMap: true
  }).parent().css({"margin":"0 auto"}); 


  $('#schematic').mapster({
    mapKey:'id',
    fillColor: 'f5f5b5',
    fillOpacity: 0.6,
    render_select: { 
        fillOpacity: 0.3
    },
    singleSelect: true
    // scaleMap: true
  }).parent().css({"margin":"0 auto"}); 

//   $('#lightSwitch').mapster({
//     mapKey:'id',
//     fillColor: 'f5f5b5',
//     fillOpacity: 0.6,
//     render_select: { 
//         fillOpacity: 0.3
//     },
//     singleSelect: true
//     // scaleMap: true
//   }).parent().css({"margin":"0 auto"}); 
  
//   $('#laserSwitch').mapster({
//     mapKey:'id',
//     fillColor: 'f5f5b5',
//     fillOpacity: 0.6,
//     render_select: { 
//         fillOpacity: 0.3
//     },
//     singleSelect: true
//     // scaleMap: true
//   }).parent().css({"margin":"0 auto"}); 
  
//   $('#darkSwitch').mapster({
//     mapKey:'id',
//     fillColor: 'f5f5b5',
//     fillOpacity: 0.6,
//     render_select: { 
//         fillOpacity: 0.3
//     },
//     singleSelect: true
//     // scaleMap: true
//   }).parent().css({"margin":"0 auto"}); 
  
  window.addEventListener('beforeunload', function(e) {
        // // TEMP CHANGE
        mainCamSignal.hangup();
        // // TEMP CHANGE
        dataChannel.close();
    })
  
//   console.log('mapster calls have been made');
  

    // var mWrap0 = document.getElementById('mapster_wrap_0');
    // var mWrap1 = document.getElementById('mapster_wrap_1');
    // var mWrap2 = document.getElementById('mapster_wrap_2');
    // var mWrap3 = document.getElementById('mapster_wrap_3');
    // var mWrap4 = document.getElementById('mapster_wrap_4');
    // var mWrap5 = document.getElementById('mapster_wrap_5');
    // var mWrap6 = document.getElementById('mapster_wrap_6');
    // var mWrap7 = document.getElementById('mapster_wrap_7');
    // var mWrap8 = document.getElementById('mapster_wrap_8');
    

//   var image = $('#themap');  <- need one of these for each map

  
//   var resizing,
//       body= $(body),
//       win=$(window),
//       diffW=win.width() - image.width(),
//       lastw=win.innerWidth(),
//       lasth=win.innerHeight();
  
//   var resize = function() {
//       var win= $(window),
//           width=win.width(), height=win.height();
//       // only try to resize every 200 ms 
//       if (resizing) {
//           return;
//       }
//       if (lastw !== width || lasth !== height) {
//           resizing=true;
//           image.mapster('resize',width-diffW,0,200);     
//           lastw=width;
//           lasth=height;
//           setTimeout(function() {
//               resizing=false;
//               resize();
//           },200);
//       } else {
  
//       }
//   };
//   $(window).bind('resize',resize);
});








//THIS SERVES TO HELP INTERPRET VCODEC CASE NUMBERS
// function select_remote_hw_vcodec() {
// document.getElementById('remote_hw_vcodec').checked = true;
// var vformat = document.getElementById('remote_vformat').value;
// switch (vformat) {
//     case '5':
//         document.getElementById('remote-video').style.width = "320px";
//         document.getElementById('remote-video').style.height = "240px";
//         break;
//     case '10':
//         document.getElementById('remote-video').style.width = "320px";
//         document.getElementById('remote-video').style.height = "240px";
//         break;
//     case '20':
//         document.getElementById('remote-video').style.width = "352px";
//         document.getElementById('remote-video').style.height = "288px";
//         break;
//     case '25':
//         document.getElementById('remote-video').style.width = "640px";
//         document.getElementById('remote-video').style.height = "480px";
//         break;
//     case '30':
//         document.getElementById('remote-video').style.width = "640px";
//         document.getElementById('remote-video').style.height = "480px";
//         break;
//     case '35':
//         document.getElementById('remote-video').style.width = "800px";
//         document.getElementById('remote-video').style.height = "480px";
//         break;
//     case '40':
//         document.getElementById('remote-video').style.width = "960px";
//         document.getElementById('remote-video').style.height = "720px";
//         break;
//     case '50':
//         document.getElementById('remote-video').style.width = "1024px";
//         document.getElementById('remote-video').style.height = "768px";
//         break;
//     case '55':
//         document.getElementById('remote-video').style.width = "1280px";
//         document.getElementById('remote-video').style.height = "720px";
//         break;
//     case '60':
//         document.getElementById('remote-video').style.width = "1280px";
//         document.getElementById('remote-video').style.height = "720px";
//         break;
//     case '63':
//         document.getElementById('remote-video').style.width = "1280px";
//         document.getElementById('remote-video').style.height = "720px";
//         break;
//     case '65':
//         document.getElementById('remote-video').style.width = "1280px";
//         document.getElementById('remote-video').style.height = "768px";
//         break;
//     case '70':
//         document.getElementById('remote-video').style.width = "1280px";
//         document.getElementById('remote-video').style.height = "768px";
//         break;
//     case '75':
//         document.getElementById('remote-video').style.width = "1536px";
//         document.getElementById('remote-video').style.height = "768px";
//         break;
//     case '80':
//         document.getElementById('remote-video').style.width = "1280px";
//         document.getElementById('remote-video').style.height = "960px";
//         break;
//     case '90':
//         document.getElementById('remote-video').style.width = "1600px";
//         document.getElementById('remote-video').style.height = "768px";
//         break;
//     case '95':
//         document.getElementById('remote-video').style.width = "1640px";
//         document.getElementById('remote-video').style.height = "1232px";
//         break;
//     case '97':
//         document.getElementById('remote-video').style.width = "1640px";
//         document.getElementById('remote-video').style.height = "1232px";
//         break;
//     case '98':
//         document.getElementById('remote-video').style.width = "1792px";
//         document.getElementById('remote-video').style.height = "896px";
//         break;
//     case '99':
//         document.getElementById('remote-video').style.width = "1792px";
//         document.getElementById('remote-video').style.height = "896px";
//         break;
//     case '100':
//         document.getElementById('remote-video').style.width = "1920px";
//         document.getElementById('remote-video').style.height = "1080px";
//         break;
//     case '105':
//         document.getElementById('remote-video').style.width = "1920px";
//         document.getElementById('remote-video').style.height = "1080px";
//         break;
//     default:
//         document.getElementById('remote-video').style.width = "1280px";
//         document.getElementById('remote-video').style.height = "720px";
//     }
