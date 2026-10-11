


var setExposure, exposureValue, setBrightness, brightnessValue, setContrast, contrastValue
var exposureDisplay, cameraControl, exposureSlider, brightnessDisplay, brightnessSlider, contrastDisplay, contrastSlider
var cartSlider, cartDisplay, cartValue, setCart
var extremaModal, stageModal, contactModal, bootModal

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

    if (device == "Messenger") {
        console.log("Received Messenger")
        if (info == "contactModal") {
            if (infoValue == "show") {
                contactModal.modal("show")
            }
        }
    }

    if (device == "Messenger") {
        console.log("Received Messenger")
        if (info == "bootModal") {
            if (infoValue == "show") {
                bootModal.modal("show")
            }
        }
    }
}   

$("document").ready(function () {
    var stepsPerMM= 0.5; //This value is set by finalized mechanical arrangements.
    var currentPosition = 0;
    var liveStream = document.getElementById("video");
    var staticCrossHairs = document.getElementById('imgCrossHairs')
    extremaModal = $("#extremaModal")
    contactModal = $("#contactModal")
    bootModal = $("#bootModal")
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

    function reportCommandError(error) {
        console.error("ReMLA command failed", error);
    }

  
//for modal
    var loadingModal = $("#loadingModal")
    var mWrapList = ["#mapster_wrap_0", "#mapster_wrap_1"]

    loadingModal.on("shown.bs.modal", function(e){
        intervalId = setInterval(function() {
            if(!window.remlaJsonConnected){
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
    //     remlaCommand("Camera", "camera", ["off"])
    // })

    //for Time Limit
     window.setTimeout(timeOutHandler,10800000)
 
     function timeOutHandler(){
        //  TEMP CHANGE
        //  mainCamSignal.hangup()
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

    var slitSelectionQueue = Promise.resolve();

    function selectSlit(type, selection) {
        slitSelectionQueue = slitSelectionQueue.then(async function() {
            var activeDevice = type == "single" ? "SingleSlits" : "MultiSlits";
            var inactiveDevice = type == "single" ? "MultiSlits" : "SingleSlits";
            var inactiveSelection = type == "single" ? "MultiOpen" : "SingleOpen";
            await remlaCommand(inactiveDevice, "goto", [inactiveSelection]);
            await remlaCommand(activeDevice, "goto", [selection]);
            lastSlit = type;
        }).catch(reportCommandError);
    }

    function queueSlitNudge(singleSteps, multiSteps) {
        slitSelectionQueue = slitSelectionQueue.then(async function() {
            if (lastSlit == "single") {
                await remlaCommand("SingleSlits", "move", [singleSteps]);
            } else if (lastSlit == "multi") {
                await remlaCommand("MultiSlits", "move", [multiSteps]);
            } else {
                console.log("No slit to move yet.");
            }
        }).catch(reportCommandError);
    }
    

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
    var ambientCommandPending = false;

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
    var stageMovePending = false;

    function setStageControlsPending(isPending) {
        var pointerEvents = isPending ? "none" : "auto";
        stageCloser.style.pointerEvents = pointerEvents;
        stageFarther.style.pointerEvents = pointerEvents;
        cartSlider.disabled = isPending;
    }

    async function requestStageMove(steps, onSuccess, onFailure) {
        if (stageMovePending) {
            return;
        }
        stageMovePending = true;
        setStageControlsPending(true);
        try {
            await remlaCommand("Stage", "move", [steps]);
            onSuccess();
        } catch (error) {
            if (onFailure) {
                onFailure();
            }
            reportCommandError(error);
        } finally {
            stageMovePending = false;
            setStageControlsPending(false);
        }
    }

    //for Laser Power
    //UNCOMMENT WHEN ADDED -- THEN MOVE EVENT LISTENER DOWN TO PROPER LOCATION
    var laser = document.getElementById("laserSwitch")
    var laserState = false;
    laser.style.opacity=0.2;
    var pendingPowerCommand = null;

    function setPowerControlsPending(isPending) {
        var pointerEvents = isPending ? "none" : "auto";
        laser.style.pointerEvents = pointerEvents;
        screenWhite.style.pointerEvents = pointerEvents;
        screenClear.style.pointerEvents = pointerEvents;
    }

    function applyPowerResult(commandName, target) {
        if (commandName == "off" && target == "Screen") {
            TransparencyOff.style.display = "block";
            TransparencyOn.style.display = "none";
        } else if (commandName == "on" && target == "Screen") {
            TransparencyOff.style.display = "none";
            TransparencyOn.style.display = "block";
        } else if (commandName == "off" && target == "Laser") {
            laserState = false;
            laser.style.opacity = 0.2;
        } else if (commandName == "on" && target == "Laser") {
            laserState = true;
            laser.style.opacity = 1;
        }
    }

    async function requestPowerCommand(commandName, target) {
        if (pendingPowerCommand) {
            return;
        }
        pendingPowerCommand = { commandName, target };
        setPowerControlsPending(true);
        try {
            await remlaCommand("ASDIpdu", commandName, [target]);
            applyPowerResult(commandName, target);
        } catch (error) {
            console.error("Power command failed", error);
            laser.title = "Power command failed. Try again.";
            screenWhite.title = "Power command failed. Try again.";
            screenClear.title = "Power command failed. Try again.";
        } finally {
            pendingPowerCommand = null;
            setPowerControlsPending(false);
        }
    }
 
    //for Snapshot 
    var snapShot = document.getElementById("pushButton")
    

    //BEGIN Switches 
    //BEGIN Ambient Toggling 
     
    AmbientTOGGLE.addEventListener('click', async function(){
        if (ambientCommandPending) {
            return;
        }
        console.log("Ambient light was switched");
        var nextState = !AmbientState;
        ambientCommandPending = true;
        AmbientTOGGLE.style.pointerEvents = "none";
        try {
            await remlaCommand("Ambient", nextState ? "on" : "off", [])
            AmbientState = nextState;
        } catch (error) {
            reportCommandError(error);
            return;
        } finally {
            ambientCommandPending = false;
            AmbientTOGGLE.style.pointerEvents = "auto";
        }
        if(AmbientState){
            AmbientTOGGLE.title="Click here to turn OFF";
            lightSwitch.style.transform='rotate(180deg)';
        }
        else{
            AmbientState=false;
            AmbientTOGGLE.title="Click here to turn ON";
            lightSwitch.style.transform='rotate(0deg)';
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
        //     remlaCommand("Screen", "off", []);
        //     console.log("Eye clicked for the first time")
        // }  
        requestPowerCommand("off", "Screen");
    })
    screenClear.addEventListener('click', function(){        
        console.log("Screen power was turned on, thus the screen is clear");         
        requestPowerCommand("on", "Screen");
    })

    //BEGIN Laser
    laser.addEventListener("click", function() {
        if (laserState) {
            console.log("Laser was turned off")
            requestPowerCommand("off", "Laser")
        } else {
            console.log("Laser was turned on")
            requestPowerCommand("on", "Laser")
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
        selectSlit("single", "A02");
    })
    A04.addEventListener('click', function(event) {
        console.log("A04 was clicked");
        event.stopPropagation();
        selectSlit("single", "A04");
    })
    A08.addEventListener('click', function(event) {
        console.log("A08 was clicked");
        event.stopPropagation();
        selectSlit("single", "A08");
    })
    A16.addEventListener('click', function(event) {
        console.log("A16 was clicked");
        event.stopPropagation();
        selectSlit("single", "A16");
    })
    VaryWidth.addEventListener('click', function(event) {
        console.log("Variable Width Slit was clicked");
        event.stopPropagation();
        selectSlit("single", "VaryWidth");
    })
    SingleOpen.addEventListener('click', function(event) {
        console.log("SingleOpen was clicked");
        event.stopPropagation();
        selectSlit("single", "SingleOpen");
    })
    LineSlit.addEventListener('click', function(event) {
        console.log("Line+Slit was clicked");
        event.stopPropagation();
        selectSlit("single", "LineSlit");
    })
    LittleHole.addEventListener('click', function(event) {
        console.log("Little hole was clicked");
        event.stopPropagation();
        selectSlit("single", "LittleHole");
    })
    BigHole.addEventListener('click', function(event) {
        console.log("Big hole was clicked");
        event.stopPropagation();
        selectSlit("single", "BigHole");
    })
    Square.addEventListener('click', function(event) {
        console.log("Square grid was clicked");
        event.stopPropagation();
        selectSlit("single", "Square");
    })
    Hex.addEventListener('click', function(event) {
        console.log("Hexagonal grid was clicked");
        event.stopPropagation();
        selectSlit("single", "Hex");
    })
    Dots.addEventListener('click', function(event) {
        console.log("Random dots was clicked");
        event.stopPropagation();
        selectSlit("single", "Dots");
    })
    Holes.addEventListener('click', function(event) {
        console.log("Random holes was clicked");
        event.stopPropagation();
        selectSlit("single", "Holes");
    })
}
   // END Single Slite Wheel Buttons
   
   // BEGIN Multiple Slits Wheel Buttons
{
    A04D25.addEventListener('click', function(event) {
        console.log("a=0.04, d=0.25 was clicked");
        event.stopPropagation();
        selectSlit("multi", "A04D25");
    })
    A04D50.addEventListener('click', function(event) {
        console.log("a=0.04, d=0.50 was clicked");
        event.stopPropagation();
        selectSlit("multi", "A04D50");
    })
    A08D25.addEventListener('click', function(event) {
        console.log("a=0.08, d=0.25 was clicked");
        event.stopPropagation();
        selectSlit("multi", "A08D25");
    })
    A08D50.addEventListener('click', function(event) {
        console.log("a=0.08, d=0.50 was clicked");
        event.stopPropagation();
        selectSlit("multi", "A08D50");
    })
    varySpacing.addEventListener('click', function(event) {
        console.log("Variable Slit Spacing was clicked");
        event.stopPropagation();
        selectSlit("multi", "VarySpacing");
    })
    TwoSlit.addEventListener('click', function(event) {
        console.log("2 slits was clicked");
        event.stopPropagation();
        selectSlit("multi", "TwoSlit");
    })
    ThreeSlit.addEventListener('click', function(event) {
        console.log("3 slits was clicked");
        event.stopPropagation();
        selectSlit("multi", "ThreeSlit");
    })
    FourSlit.addEventListener('click', function(event) {
        console.log("4 slits was clicked");
        event.stopPropagation();
        selectSlit("multi", "FourSlit");
    })
    FiveSlit.addEventListener('click', function(event) {
        console.log("5 slits was clicked");
        event.stopPropagation();
        selectSlit("multi", "FiveSlit");
    })
    MultiOpen.addEventListener('click', function(event) {
        console.log("2 slits vs 1 slit was clicked");
        event.stopPropagation();
        selectSlit("multi", "MultiOpen");
    })
    FarClose.addEventListener('click', function(event) {
        console.log("Comparison of slit separations was clicked");
        event.stopPropagation();
        selectSlit("multi", "FarClose");
    })
    WideThin.addEventListener('click', function(event) {
        console.log("Wide slit vs thin slit was clicked");
        event.stopPropagation();
        selectSlit("multi", "WideThin");
    })
    ThreeTwo.addEventListener('click', function(event) {
        console.log("3 slits vs 2 slit was clicked");
        event.stopPropagation();
        selectSlit("multi", "ThreeTwo");
    })
}
    // END Single Slite Wheel Buttons

    // BEGIN Stage Motion
    stageCloser.addEventListener('click', function() {
        if (stageMovePending) {
            return;
        }
        console.log("Stage moved closer to slits.")
        var nextStagePosition = Math.round(currValue - ((stageSteps*100)/9750))
        requestStageMove(-stageSteps, function() {
            cartSlider.value = nextStagePosition
            cartDisplay.innerHTML = cartSlider.value
            currValue = cartSlider.value
        })
    })

    stageFarther.addEventListener('click', function() {
        if (stageMovePending) {
            return;
        }
        console.log("Stage moved farther from slits.")
        var nextStagePosition = Math.round(+currValue+((stageSteps*100)/9750))
        requestStageMove(stageSteps, function() {
            cartSlider.value = nextStagePosition
            cartDisplay.innerHTML = cartSlider.value
            currValue = cartSlider.value
        })
    })

    getCartSliderValue = function(){
        currValue = cartSlider.value
        prevValue = currValue
    }

    setCart = function(){
        if (stageMovePending) {
            return;
        }
        console.log("move cart to "+cartSlider.value)
        var requestedPosition = cartSlider.value
        var requestedMove = Math.round(9750*((requestedPosition-prevValue)/100))
        if (Math.abs(requestedMove) > 9750/6) {
            console.log("Show Modal")
            showStageModal()
        }
        requestStageMove(requestedMove, function() {
            currValue = requestedPosition
        }, function() {
            cartSlider.value = prevValue
            cartDisplay.innerHTML = prevValue
            currValue = prevValue
        })
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
        queueSlitNudge(-nudgeSingleSteps, nudgeSteps)
    })

    nudgeDown.addEventListener("click", function() {
        queueSlitNudge(nudgeSingleSteps, -nudgeSteps)
    })
    // END Nudge of Slits

    // BEGIN Camera Switching
    var viewCam = document.getElementById("ViewCam");
    var rulerCam = document.getElementById("RulerCam");
    var screenCam = document.getElementById("ScreenCam");

            
                     
    function sleep(ms){
        return new Promise(r => setTimeout(r, ms));
    }

    function sliderNumber(slider) {
        return parseFloat(slider.value)
    }

    const supportedCameraSettings = new Set([
        "brightness",
        "contrast",
        "saturation",
        "aeenable",
        "exposuretime"
    ])

    async function updateCameraSetting(setting, newValue) {
        if (!supportedCameraSettings.has(setting)) {
            console.log("Skipping unsupported camera setting " + setting)
            return
        }
        try {
            await remlaCommand("Camera", "imageMod", [setting, newValue])
            currentCameraSettings[setting] = newValue
        } catch (error) {
            reportCommandError(error)
        }
    }

    async function updateManyCameraSettings(currentSettings, newSettings) {
        for (const setting in newSettings) {
            var newValue = newSettings[setting]
            var oldValue = currentSettings[setting]
            if (newValue !== oldValue) {
                console.log("Updating " + setting)
                await updateCameraSetting(setting, newValue)
            }
        }

    }

    var cameraDefaults = {
        "brightness": 0.0,
        "contrast": 1.0,
        "saturation": 1.0,
        "aeenable": true
    }

    var defaultScreenCameraSettings = {
        "brightness": 0.0,
        "contrast": 1.0,
        "saturation": 1.0,
        "aeenable": false,
        "exposuretime": 6000
    }

    var currentCameraSettings = JSON.parse(JSON.stringify(cameraDefaults))
    var screenCameraSettings = JSON.parse(JSON.stringify(defaultScreenCameraSettings))


    setExposure = function(){
        updateCameraSetting("exposuretime", exposureSlider.value)
        screenCameraSettings["exposuretime"] = exposureSlider.value
        // remlaCommand("Camera", "imageMod", ["exposuretime", exposureSlider.value])
    }
    
    exposureValue = function(){
        exposureDisplay.innerHTML=exposureSlider.value
    }
    
    setBrightness = function(){
        const value = sliderNumber(brightnessSlider)
        updateCameraSetting("brightness", value)
        screenCameraSettings["brightness"] = value
        // remlaCommand("Camera", "imageMod", ["brightness", value])
    }
    
    brightnessValue = function(){
        brightnessDisplay.innerHTML=sliderNumber(brightnessSlider).toFixed(2)
    }
    
    setContrast = function(){
        const value = sliderNumber(contrastSlider)
        updateCameraSetting("contrast", value)
        screenCameraSettings["contrast"] = value
        // remlaCommand("Camera", "imageMod", ["contrast", value])
    }
    
    contrastValue = function(){
        contrastDisplay.innerHTML=sliderNumber(contrastSlider).toFixed(2) + "x"
    }
    



    viewCam.addEventListener("click", async function() {
        console.log("Switched to view cam")
        try {
            await remlaCommand("Camera", "camera", ["b"])
            await updateManyCameraSettings(currentCameraSettings, cameraDefaults)
        } catch (error) {
            reportCommandError(error)
            return
        }
        liveStream.style.transform = "rotate(0deg)"
        // cameraControl.style.display = "None"
        mcameraControl.style.display = "None"
    })

    rulerCam.addEventListener("click", async function() {
        console.log("Switched to ruler cam")
        try {
            await remlaCommand("Camera", "camera", ["a"])
            await updateManyCameraSettings(currentCameraSettings, cameraDefaults)
        } catch (error) {
            reportCommandError(error)
            return
        }
        liveStream.style.transform = "rotate(0deg)"
        // cameraControl.style.display = "None"
        mcameraControl.style.display = "None"
    })

    screenCam.addEventListener("click", async function() {
        console.log("Switched to screen cam")
        try {
            await remlaCommand("Camera", "camera", ["c"])
            await updateManyCameraSettings(currentCameraSettings, screenCameraSettings)
        } catch (error) {
            reportCommandError(error)
            return
        }
        // cameraControl.style.display = "Block"
        mcameraControl.style.display = "Block"
    })
    // END Camera Switching

     //for LiveFeed  
     // var mainCamSignal = setupWebRTC(8081, liveStream, 100);
   

 
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
        // mainCamSignal.hangup();
        // // TEMP CHANGE
        window.remlaJson.socket?.close();
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
