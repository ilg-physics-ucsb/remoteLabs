// This is the function that adds the video stream. You can have it do other things (like turn off a loading element) once it receives a stream.
function connectStream(stream, videoElement) {
    if (videoElement) {
        console.log("got a stream! Putting stream in the following video" );
        console.log(videoElement);
        videoElement.srcObject = stream;
        videoElement.setAttribute("data-playing", "true");
        resize_canvas()
        // videoElement.play();
    }
}

//This function runs if there is an error returned from teh websocket connecting to the stream.
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


function getWidth(){
    return document.getElementById('v').clientWidth; //parseInt(video.css('width'),10)
}

function getHeight(){
    return  document.getElementById('v').clientHeight;
}

function controllerResponseHandler(cmd) {
    var components = cmd.split("/");
    var device = components[0]
    var info = components[1]
    var infoValue = components[2]

    if (infoValue == "limit") {
        extremaModal.modal("show")
    }

    if (device == "Slit") {
        console.log("Controller Response Hide")
        slitModal.modal('hide')
    }
}

function sleep(ms){
    return new Promise(r => setTimeout(r, ms));
}

//syncing page telescope radio button to modal telescope radio button
function tHandleChange(src){
    console.log(src.value);
    if(src.value == 1){
        document.getElementById('MfineArm').checked = true;
    }
    else if(src.value == 5){
        document.getElementById('MmediumArm').checked = true;
    }
    else{
        document.getElementById('McoarseArm').checked = true;
    }
}

//syncing page grating radio button to modal grating radio button
function gHandleChange(src){
    console.log(src.value);
    if(src.value == 20){
        document.getElementById('MfineTable').checked = true;
    }
    else if(src.value == 200){
        document.getElementById('MmediumTable').checked = true;
    }
    else{
        document.getElementById("McoarseTable").checked = true;
    }
}

// syncing modal telescope radio button to page telescope radio button
function mtHandleChange(src){
    console.log(src.value);
    if(src.value == 1){
        document.getElementById('fineArm').checked = true;
    }
    else if(src.value == 5){
        document.getElementById('mediumArm').checked = true;
    }
    else{
        document.getElementById('coarseArm').checked = true;
    }
}

//syncing modal Grating radio button to page grating radio button
function mgHandleChange(src){
    console.log(src.value);
    if(src.value == 20){
        document.getElementById('fineTable').checked = true;
    }
    else if(src.value == 200){
        document.getElementById('mediumTable').checked = true;
    }
    else{
        document.getElementById('coarseTable').checked = true;
    }
}

var c_wrap
var liveStream
var slitModal, extremaModal
var pValue = "coarsePicture"

$("document").ready(function () {
    var stepPerDegree= 0.5; //This value is set by finalized mechanical arrangements.
    var currentPosition = 0;
    liveStream = document.getElementById("v");
    
    

    c_wrap = $('#canvas_wrap')

    // Do we need these still?
    var FirstTimeCam = true;

    // Define Variables that are MWRAPs for use inside of callbacks
    var mWrap0, mWrap1, mWrap2, mWrap3
    var intervalId
    var mWrapList = ["#mapster_wrap_0", "#mapster_wrap_1", "#mapster_wrap_2", "#mapster_wrap_3"]

    var loadingModal = $("#loadingModal")

    loadingModal.on("shown.bs.modal", function(e){
        intervalId = setInterval(function() {
            for (mWrap of mWrapList) {
                if ($(mWrap).length == 0) {
                    OverviewCam.click()
                    return
                }
            } 
            
            //Run when all mwraps exist.
            mWrap0 = $("#mapster_wrap_0")[0]
            mWrap1 = $("#mapster_wrap_1")[0]
            mWrap2 = $("#mapster_wrap_2")[0]
            mWrap3 = $("#mapster_wrap_3")[0]
    
            // Do clicks here
            OverviewCam.click()
            H2pressOff.click()
            console.log("hiding modal")
            //Hide Loading Screen
            loadingModal.modal("hide")
            //Stop repeating check
            clearInterval(intervalId)    
        }, 500)
    })
    loadingModal.modal('show')


    slitModal = $("#slitModal")

    extremaModal = $("#extremaModal")

    //for multi-camera switching
    var OverviewCam = document.getElementById("OverviewCam");
    var ArmCam = document.getElementById("EyepieceCam");
    var V1Cam = document.getElementById("V1Cam");
    var V2Cam = document.getElementById("V2Cam");
    var currentCam = "a";
    // var OffCam = document.getElementById("OffCam");

    //for div display switching
    var Toggle = document.getElementById("Toggle");
    var Grating = document.getElementById("Grating");
    var Crosshairs = document.getElementById("Crosshairs");
    var Schematic = document.getElementById("Schematic");
    var Lamps = document.getElementById("Lamps");
    var SlitControl = document.getElementById("SlitControl");
    
    OverviewCam.addEventListener('click', function() {
        
        if(FirstTimeCam){
            console.log("Overview cam was clicked for the first time");
            FirstTimeCam=false;
        }
        else{
            dataChannel.send("Camera/camera/a");
            currentCam = "a"
        }
        
        
        Lamps.style.visibility='visible';
        Crosshairs.style.visibility = "hidden";
        SlitControl.style.visibility = "hidden";
        hide_crosshair()
        
    })

    ArmCam.addEventListener('click', function() {
        //show_crosshair()
        resize_canvas()
        Crosshairs.style.visibility='visible';
        
        Lamps.style.visibility='visible';
        
        SlitControl.style.visibility='visible';
        currentCam = "c"       
        dataChannel.send("Camera/camera/c");
    })

    V1Cam.addEventListener('click', function() {
       
        
                
        Lamps.style.visibility = "hidden";
        Crosshairs.style.visibility = "hidden";
        SlitControl.style.visibility = "hidden";
        currentCam = "b"
        hide_crosshair()
        dataChannel.send("Camera/camera/b");
    })

    V2Cam.addEventListener('click', function() {
       
        Lamps.style.visibility='visible';
        Crosshairs.style.visibility='visible';
        SlitControl.style.visibility='visible';

        currentCam = "d"
        hide_crosshair()
        dataChannel.send("Camera/camera/d");
    })

    // OffCam.addEventListener('click', function() {
    //     dataChannel.send("Camera/camera/off")
    // })

    //for LiveFeed  
    var mainCamSignal = setupWebRTC(8081, liveStream, 100);
 
    //for Time Limit
     window.setTimeout(timeOutHandler,10800000)

     function timeOutHandler(){
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
     }
 
   
    //for Ambient Light
    var lightSwitch = document.getElementById('lightSwitch');
    var AmbientTOGGLE = document.getElementById('ambientTOGGLE');
    var AmbientState = false;
    var AmbientStatePrev = false;

    var darkToggle = document.getElementById('darkTOGGLE');
    var darkSwitchPic = document.getElementById("darkSwitch");
    var darkState = false;

    //for Lamps
    var H2pressOff = document.getElementById('H2-off');
    var ApressOff = document.getElementById('SampleA-off');
    var BpressOff = document.getElementById('SampleB-off');

    var H2pressH2 = document.getElementById('H2-h2');
    var ApressH2 = document.getElementById('SampleA-h2');
    var BpressH2 = document.getElementById('SampleB-h2');

    var H2pressA = document.getElementById('H2-a');
    var ApressA = document.getElementById('SampleA-a');
    var BpressA = document.getElementById('SampleB-a');

    var H2pressB = document.getElementById('H2-b');
    var ApressB = document.getElementById('SampleA-b');
    var BpressB = document.getElementById('SampleB-b');

    var allOFFpic = document.getElementById('LampsAllOff');
    var aONpic = document.getElementById('LampsAon');
    var bONpic = document.getElementById('LampsBon');
    var H2ONpic = document.getElementById('LampsH2on');
    var lampSupplyState = false;
    var spectraLamp = "H2";
    var H2FirstTime = true;

    var nudgeLeft = document.getElementById('lampNudgeLeft');
    var nudgeRight = document.getElementById('lampNudgeRight');

    //for Slit Settings
    var Slit = document.getElementById('Slit');
    var LopenSlit = document.getElementById('OpenL');
    var RopenSlit = document.getElementById('OpenR');
    var LcloseSlit = document.getElementById('CloseL');
    var RcloseSlit = document.getElementById('CloseR');
    var fineSlit = document.getElementById('FineAdjustSlit');
    var coarseSlit = document.getElementById('CoarseAdjustSlit');
    var slitSteps=200;
   
    //for Schematic
    var SchemaPIC = document.getElementById('Schema');
    //for Telescope Settings
    var tCW = document.getElementById('telescopeCW');
    var tCCW = document.getElementById('telescopeCCW');
    var tFine = document.getElementById('fineArm');
    var tMedium = document.getElementById('mediumArm')
    var tCoarse = document.getElementById('coarseArm');
    var telescopeSteps=100; ///unknown number of degrees
    var telescopeCurrentPosition = 0;
    //for Grating Settings
    var gCW = document.getElementById('gratingCW');
    var gCCW = document.getElementById('gratingCCW');
    var gFine = document.getElementById('fineTable');
    var gMedium = document.getElementById('mediumTable')
    var gCoarse = document.getElementById('coarseTable');
    var gratingSteps=200; //roughly ten degrees

    
    //for Modal Telescope Settings
    var tmCW = document.getElementById('arrowbuttonCW');
    var tmCCW = document.getElementById('arrowbuttonCCW');
    var tMfine = document.getElementById('MfineArm');
    var tMmedium = document.getElementById('MmediumArm');
    var tMcoarse = document.getElementById('McoarseArm');
    //for Modal Grating Settings
    var gmCW = document.getElementById('arrowCW');
    var gmCCW = document.getElementById('arrowCCW');
    var gMFine = document.getElementById('MfineTable');
    var gMMedium = document.getElementById('MmediumTable');
    var gMCoarse = document.getElementById('McoarseTable');
    //for Modal Lamp Settings
    var nudgeLeftModal = document.getElementById('uparrow');
    var nudgeRightModal = document.getElementById('downarrow')

    //for Element Picture Settings
    var pCoarse = document.getElementById('coarseElement');
    var pFine = document.getElementById('fineElement');
    var He = document.getElementById('He_fullSpectrum')
    var Ne = document.getElementById('Ne_fullSpectrum')
    var Ar = document.getElementById('Ar_fullSpectrum')
    var Kr = document.getElementById('Kr_fullSpectrum')
    var Xe = document.getElementById('Xe_fullSpectrum')

    //BEGIN picture toggling setting
    pFine.addEventListener('click', function(){
        pValue = pFine.value
    })
    pCoarse.addEventListener('click', function(){
        pValue = pCoarse.value
    })

    //BEGIN picture toggling for Helium
    He.addEventListener('click', function(){
        if(pValue == "finePicture"){
            He.href = "static/docs/He_Spectrum.jpg";
        }
        else if(pValue == "coarsePicture"){
            He.href = "static/docs/He_majorPeaks.png";
        }
    })

    //BEGIN picture toggling for Neon
    Ne.addEventListener('click', function(){
        if(pValue == "finePicture"){
            Ne.href = "static/docs/Ne_Spectrum.jpg";
        }
        else if(pValue == "coarsePicture"){
            Ne.href = "static/docs/Ne_majorPeaks.jpg";
        }
    })

    //BEGIN picture toggling for Argon
    Ar.addEventListener('click', function(){
        if(pValue == "finePicture"){
            console.log("Fine should be clicked");
            Ar.href = "static/docs/Ar_Spectrum.jpg";
        }
        else if(pValue == "coarsePicture"){
            Ar.href = "static/docs/Ar_majorPeaks.jpg";
        }
    })

    //BEGIN picture toggling for Krypton
    Kr.addEventListener('click', function(){
        if(pValue == "finePicture"){
            Kr.href = "static/docs/Kr_Spectrum.jpg";
        }
        else if(pValue == "coarsePicture"){
            Kr.href = "static/docs/Kr_majorPeaks.jpg";
        }
    })

    //BEGIN picture toggling for Xenon
    Xe.addEventListener('click', function(){
        if(pValue == "finePicture"){
            Xe.href = "static/docs/Xe_Spectrum.jpg";
        }
        else if(pValue == "coarsePicture"){
            Xe.href = "static/docs/Xe_Spectrum.jpg";
        }
    })

    //BEGIN Ambient Toggling 
     
    AmbientTOGGLE.addEventListener('click', function(){
        console.log("Ambient light was switched");
        if(AmbientState){
                //--------choose one of the following
            //dataChannel.send("FilamentPower/setRelay/OFF");  //use this command with HS105
            // Commented line below - 20200716
            dataChannel.send("Ambient/off/")            //use this command with PDU
                //---------
            AmbientState=false;
            AmbientTOGGLE.title="Click here to turn ON";
            lightSwitch.style.transform='scaleY(1)';
                     }
        else{
                //--------choose one of the following
            //dataChannel.send("FilamentPower/setRelay/ON");   //use this command with HS105
            // Commented line below - 20200716
            dataChannel.send("Ambient/on/")                 //use this command with GPIO
                //---------
            AmbientState=true;
            AmbientTOGGLE.title="Click here to turn OFF";
            lightSwitch.style.transform='scaleY(-1)';
        }
    })
    //END Ambient Toggling

    //BEGIN Dark Toggling


    darkToggle.addEventListener('click', function(){
        if(!darkState){
         console.log("Background was darkened. Controls were hidden.");
         //hide controls; turn background black
         $('img').css("visibility", "hidden")
         $('body').css("background", "black")
         darkSwitchPic.style.visibility = "visible"
         darkState=true;
         darkToggle.title="Click here to reveal controls";
         darkSwitchPic.style.transform='rotate(180deg)';
                  }
     else{
         console.log("Background was lit. Controls were revealed.");
         //reveal controls; turn background white
         $('img').css("visibility", "visible")
         $('body').css("background", "white")
         darkState=false;
         darkToggle.title="Click here to darken the background";
         darkSwitchPic.style.transform='rotate(0deg)';
        }
    })

    //END Dark Toggling


    
    //BEGIN Lamp Toggling

    function H2PressCmd() {
        // If it is already on and is just switching to H2
        // Turn off carousel, move to H2, turn on carousel
        if(lampSupplyState && (spectraLamp != "H2")){
            console.log("Turning off and switching to H2");
            AmbientStatePrev = AmbientState;
            if(!AmbientState){
                AmbientTOGGLE.click();
            }
            dataChannel.send("Camera/camera/a");               //This should be overview camera
            // Add waiting popup (modal) here
            dataChannel.send("ASDIpdu/off/Carousel");
            dataChannel.send("Carousel/goto/h2");
            dataChannel.send("ASDIpdu/on/Carousel");
            if(!AmbientStatePrev){
                AmbientTOGGLE.click;
            }
            dataChannel.send("Camera/camera/" + currentCam);
            lampSupplyState = true;
        // If it off and H2 is clicked while not on H2
        // Move to H2, turn on carousel.
        } else if (!lampSupplyState && (spectraLamp != "H2")){
            console.log("Switching to H2")
            AmbientStatePrev = AmbientState;
            if(!AmbientState){
                AmbientTOGGLE.click();
            }
            dataChannel.send("Camera/camera/a")               //This should be overview camera
            // Add waiting popup (modal) here
            dataChannel.send("ASDIpdu/off/Carousel");
            dataChannel.send("Carousel/goto/h2")
            dataChannel.send("ASDIpdu/on/Carousel");
            if(!AmbientStatePrev){
                AmbientTOGGLE.click;
            }
            dataChannel.send("Camera/camera/" + currentCam)
            lampSupplyState = true;
        // If its off and already at H2
        // Start by checking if it is the first time
        // If so, setup all lamps off, dont move or send anything
        // If not, just turn on carousel.
        } else if (!lampSupplyState && (spectraLamp == "H2")){
            if (H2FirstTime) {
                mWrap0.style.display = "block";                     
                mWrap1.style.display = "none";
                mWrap2.style.display = "none";                     
                mWrap3.style.display = "none";    
                H2ONpic.style.display = "none";                      
                aONpic.style.display = "none";
                bONpic.style.display = "none";
                allOFFpic.style.display = "block"
                H2FirstTime = false
                spectraLamp = "H2"
                return
            } else {
                dataChannel.send("ASDIpdu/on/Carousel")
                lampSupplyState = true;
            }
        // If H2 is already on, turn it off and switch view to off view.
        } else if (lampSupplyState && (spectraLamp == "H2")) {
            dataChannel.send("ASDIpdu/off/Carousel");
            console.log("carousel was turned off");
            mWrap0.style.display = "block";                     
            mWrap1.style.display = "none";
            mWrap2.style.display = "none";                     
            mWrap3.style.display = "none";    
            H2ONpic.style.display = "none";                      
            aONpic.style.display = "none";
            bONpic.style.display = "none";
            allOFFpic.style.display = "block"
            spectraLamp = "H2"
            lampSupplyState = false;
            return
        }

        // Setup picture to have H2 on
        mWrap0.style.display = "none";                     
        mWrap1.style.display = "none";
        mWrap2.style.display = "none";                     
        mWrap3.style.display = "block";  
        H2ONpic.style.display = "block";                      
        aONpic.style.display = "none";
        bONpic.style.display = "none";
        allOFFpic.style.display = "none"
        spectraLamp = "H2"
    }
    
    function APressCmd() {
         // If it is already on and is just switching to A
        // Turn off carousel, move to A, turn on carousel
        if(lampSupplyState && (spectraLamp != "A")){
            console.log("Turning off and switching to A")
            AmbientStatePrev = AmbientState;
            if(!AmbientState){
                AmbientTOGGLE.click();
            }
            dataChannel.send("Camera/camera/a")               //This should be overview camera
            // Add waiting popup (modal) here
            dataChannel.send("ASDIpdu/off/Carousel");
            dataChannel.send("Carousel/goto/a")
            dataChannel.send("ASDIpdu/on/Carousel");
            if(!AmbientStatePrev){
                AmbientTOGGLE.click;
            }
            dataChannel.send("Camera/camera/" + currentCam)
            lampSupplyState = true;
        // If it off and H2 is clicked while not on H2
        // Move to A, turn on carousel.
        } else if (!lampSupplyState && (spectraLamp != "A")){
            console.log("Switching to A")
            AmbientStatePrev = AmbientState;
            if(!AmbientState){
                AmbientTOGGLE.click();
            }
            dataChannel.send("Camera/camera/a")               //This should be overview camera
            // Add waiting popup (modal) here
            dataChannel.send("ASDIpdu/off/Carousel");
            dataChannel.send("Carousel/goto/a")
            dataChannel.send("ASDIpdu/on/Carousel");
            if(!AmbientStatePrev){
                AmbientTOGGLE.click;
            }
            dataChannel.send("Camera/camera/" + currentCam)
            lampSupplyState = true;
        // If its off and already at A
        // If not, just turn on carousel.
        } else if (!lampSupplyState && (spectraLamp == "A")){
            dataChannel.send("ASDIpdu/on/Carousel");
            lampSupplyState = true;

        // If A is already on, turn it off and switch view to off view.
        } else if (lampSupplyState && (spectraLamp == "A")) {
            dataChannel.send("ASDIpdu/off/Carousel");
            console.log("carousel was turned off");
            mWrap0.style.display = "block";                     
            mWrap1.style.display = "none";
            mWrap2.style.display = "none";                     
            mWrap3.style.display = "none";    
            H2ONpic.style.display = "none";                      
            aONpic.style.display = "none";
            bONpic.style.display = "none";
            allOFFpic.style.display = "block"
            spectraLamp = "A"
            lampSupplyState = false;
            return
        }

        // Setup picture to have A on
        mWrap0.style.display = "none";                     
        mWrap1.style.display = "block";
        mWrap2.style.display = "none";                     
        mWrap3.style.display = "none";  
        H2ONpic.style.display = "none";                      
        aONpic.style.display = "block";
        bONpic.style.display = "none";
        allOFFpic.style.display = "none"
        spectraLamp = "A"
    }

    function BPressCmd() {
        // If it is already on and is just switching to B
        // Turn off carousel, move to B, turn on carousel
        if(lampSupplyState && spectraLamp != "B"){
            console.log("Turning off and switching to B")
            AmbientStatePrev = AmbientState;
            if(!AmbientState){
                AmbientTOGGLE.click();
            }
            dataChannel.send("Camera/camera/a")               //This should be overview camera
            // Add waiting popup (modal) here
            dataChannel.send("ASDIpdu/off/Carousel");
            dataChannel.send("Carousel/goto/b");
            dataChannel.send("ASDIpdu/on/Carousel");
            if(!AmbientStatePrev){
                AmbientTOGGLE.click;
            }
            dataChannel.send("Camera/camera/" + currentCam)
            lampSupplyState = true;
        // If it off and B is clicked while not on B
        // Move to B, turn on carousel.
        } else if (!lampSupplyState && spectraLamp != "B"){
            console.log("Switching to B")
            AmbientStatePrev = AmbientState;
            if(!AmbientState){
                AmbientTOGGLE.click();
            }
            dataChannel.send("Camera/camera/a")               //This should be overview camera
            // Add waiting popup (modal) here
            dataChannel.send("ASDIpdu/off/Carousel");
            dataChannel.send("Carousel/goto/b");
            dataChannel.send("ASDIpdu/on/Carousel");
            if(!AmbientStatePrev){
                AmbientTOGGLE.click;
            }
            dataChannel.send("Camera/camera/" + currentCam)
            lampSupplyState = true;
        // If its off and already at B
        // If not, just turn on carousel.
        } else if (!lampSupplyState && spectraLamp == "B"){
            dataChannel.send("ASDIpdu/on/Carousel");
            lampSupplyState = true;
        // If A is already on, turn it off and switch view to off view.
        } else if (lampSupplyState && spectraLamp == "B") {
            dataChannel.send("ASDIpdu/off/Carousel");
            console.log("carousel was turned off");
            mWrap0.style.display = "block";                     
            mWrap1.style.display = "none";
            mWrap2.style.display = "none";                     
            mWrap3.style.display = "none";    
            H2ONpic.style.display = "none";                      
            aONpic.style.display = "none";
            bONpic.style.display = "none";
            allOFFpic.style.display = "block"
            spectraLamp = "B"
            lampSupplyState = false;
            return
        }

        // Setup picture to have B on
        mWrap0.style.display = "none";                     
        mWrap1.style.display = "none";
        mWrap2.style.display = "block";                     
        mWrap3.style.display = "none";  
        H2ONpic.style.display = "none";                      
        aONpic.style.display = "none";
        bONpic.style.display = "block";
        allOFFpic.style.display = "none"
        spectraLamp = "B"
    }

    H2pressOff.addEventListener("click", H2PressCmd);
    H2pressH2.addEventListener("click", H2PressCmd);
    H2pressA.addEventListener("click", H2PressCmd);
    H2pressB.addEventListener("click", H2PressCmd);

    ApressOff.addEventListener("click", APressCmd);
    ApressH2.addEventListener("click", APressCmd);
    ApressA.addEventListener("click", APressCmd);
    ApressB.addEventListener("click", APressCmd);

    BpressOff.addEventListener("click", BPressCmd);
    BpressH2.addEventListener("click", BPressCmd);
    BpressA.addEventListener("click", BPressCmd);
    BpressB.addEventListener("click", BPressCmd);

    //END Lamp Toggling

    //BEGIN Lamp Nudging

    nudgeLeft.addEventListener('click',function() {
        console.log("Lamp nudged left");
        dataChannel.send("Carousel/move/20")
    })
    nudgeRight.addEventListener('click',function() {
        console.log("Lamp nudged right");
        dataChannel.send("Carousel/move/-20")
    })
    //END Lamp Nudging

    //BEGIN Modal Lamp Nudging
    nudgeLeftModal.addEventListener('click',function(){
        console.log("Modal Lamp nudged left");
        dataChannel.send("Carousel/move/20")
    })
    nudgeRightModal.addEventListener('click',function() {
        console.log("Modal Lamp nudged right");
        dataChannel.send("Carousel/move/-20")
    })
    //END Modal Lamp Nudging

    //BEGIN Grating buttons
    gFine.addEventListener('click', function(){gratingSteps=20;})        //roughly one degree
    gMedium.addEventListener('click', function(){gratingSteps=200;})     //roughly ten degrees
    gCoarse.addEventListener('click', function(){gratingSteps=600;})     //roughly 30 degrees
    
    gCW.addEventListener('click', function() {
        console.log("Grating turned CW");
        dataChannel.send("Grating/move/"+gratingSteps);
    })
    gCCW.addEventListener('click', function() {
        console.log("Grating turned CCW");
        dataChannel.send("Grating/move/"+(-gratingSteps));
    })

    //END  Grating Buttons

    //BEGIN Modal Grating buttons
    gMFine.addEventListener('click',function(){gratingSteps=20;})
    gMMedium.addEventListener('click', function(){gratingSteps=200;})
    gMCoarse.addEventListener('click', function(){gratingSteps=600;})  
    gmCW.addEventListener('click', function(){
        console.log("Modal Grating turned CW");
        dataChannel.send("Grating/move/"+gratingSteps)
    })
    gmCCW.addEventListener('click', function(){
        console.log("Modal Grating turned CCW");
        dataChannel.send("Grating/move/"+(-gratingSteps));
    })
    //End Modal Grating Buttons

   //BEGIN Arm Buttons 
   tFine.addEventListener('click', function(){telescopeSteps=10;})
   tMedium.addEventListener('click', function(){telescopeSteps=30;})
   tCoarse.addEventListener('click', function(){telescopeSteps=100;})

   tCW.addEventListener('click', function() {
       // Changed for AS 
       console.log("Telescope turned CW");
       dataChannel.send("Arm/move/"+telescopeSteps);
    })
   tCCW.addEventListener('click', function() {
       // Changed for AS 
       console.log("Telescope turned CCW");
       dataChannel.send("Arm/move/"+(-telescopeSteps));
    })
   //END Arm Buttons

    //BEGIN Modal Arm Buttons
    tMfine.addEventListener('click', function(){telescopeSteps=10;})
    tMmedium.addEventListener('click', function(){telescope=30;})
    tMcoarse.addEventListener('click', function(){telescopeSteps=100;})
    tmCW.addEventListener('click', function(){
        console.log("Modal Telescope turned CW");
        dataChannel.send("Arm/move/"+telescopeSteps);
    })
    tmCCW.addEventListener('click', function() {
        // Changed for AS 
        console.log("Modal Telescope turned CCW");
        dataChannel.send("Arm/move/"+(-telescopeSteps));
     })
    //END Modal Arm Buttons

   //BEGIN Slit Buttons 
   fineSlit.addEventListener('click', function(){
        slitSteps=50;
    })
   coarseSlit.addEventListener('click', function(){
        slitSteps=200;
    })

   async function openSlitCmd() {
    console.log("Slit was made wider");
    slitModal.modal("show")
    await sleep(2500)
    dataChannel.send("Slit/move/"+slitSteps);
   }

   async function closeSlitCmd() {
    console.log("Slit was made narrower");
    slitModal.modal("show")
    console.log("Close Slit Modal Shown")
    await sleep(2500)
    dataChannel.send("Slit/move/"+(-slitSteps));
   }
   
   LopenSlit.addEventListener('click', openSlitCmd);
   RopenSlit.addEventListener('click', openSlitCmd);
   
   LcloseSlit.addEventListener('click', closeSlitCmd);
   RcloseSlit.addEventListener('click', closeSlitCmd);
   

   //END Slit Buttons

   // BEGIN help button function
   $('#helpButton').click(function(){
       var url = "https://hooks.slack.com/services/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";
       var payload={"text": "hello?"};
       $.post(url,JSON.stringify(payload),function(data){
           $('#results').text(data);
       })
   })
   //END help button function

   // makes modal draggable
   $('#myModalschem').draggable()

 //map highlights - This is the script that styles effect of mouseOver and clicks on image maps
    
    $('#LampsAllOff').mapster({
    mapKey:'id',
    fillColor: 'f5f5b5',
    fillOpacity: 0.6,
    render_select: { 
        fillOpacity: 0.3
    },
    singleSelect: true
    // scaleMap: true
  }).parent().css({"margin":"0 auto"});

  $('#LampsAon').mapster({
    mapKey:'id',
    fillColor: 'f5f5b5',
    fillOpacity: 0.6,
    render_select: { 
        fillOpacity: 0.3
    },
    singleSelect: true
  }).parent().css({"margin":"0 auto"});

  $('#LampsBon').mapster({
    mapKey:'id',
    fillColor: 'f5f5b5',
    fillOpacity: 0.6,
    render_select: { 
        fillOpacity: 0.3
    },
    singleSelect: true
  }).parent().css({"margin":"0 auto"});

  $('#LampsH2on').mapster({
    mapKey:'id',
    fillColor: 'f5f5b5',
    fillOpacity: 0.6,
    render_select: { 
        fillOpacity: 0.3
    },
    singleSelect: true
  }).parent().css({"margin":"0 auto"});

  $('#Slit').mapster({
    mapKey:'data-key',
    fillColor: 'f5f5b5',
    fillOpacity: 0.6,
    render_select: { 
        fillOpacity: 0.3
    },
    singleSelect: true
  }).parent().css({"margin":"0 auto"});

  $('#Schema').mapster({
    mapKey:'id',
    fillColor: 'f5f5b5',
    fillOpacity: 0.6,
    render_select: { 
        fillOpacity: 0.3
    },
    singleSelect: true
  }).parent().css({"margin":"0 auto"});
  
  $('Arrows').mapster({
    mapKey: 'id',
    fillColor: 'f5f5b5',
    fillOpacity: 0.6,
    render_select:{
        fillOpacity: 0.3
    },
    singleSelect: true
  }).parent().css({"margin":"0 auto"})

  window.addEventListener('beforeunload', function(e) {
    // TEMP CHANGE
    mainCamSignal.hangup();
    // TEMP CHANGE
    dataChannel.close();
  })

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