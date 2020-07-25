
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
    var signalling_server_address = signalling_server_hostname + ':' + (port || (location.protocol === 'https:' ? 443 : 80));
    var protocol = location.protocol === "https:" ? "wss:" : "ws:";
    // var address = url + ':' + (port || (protocol === 'https:' ? 443 : 80)) + '/stream/webrtc';
    var address = location.hostname + ':' + (port || (protocol === 'https:' ? 443 : 80)) + '/stream/webrtc';
    // protocol = "wss:";
    // var address = url + "/webrtc";
    var wsurl = protocol + '//' + address;

    console.log(videoElement);
    if (videoElement && videoElement.getAttribute('data-playing') == "false") {
        var signalObj = new signal(wsurl, videoElement, vformat, hardwareCodec, connectStream, errorStream, closeStream, onWebsocketMessage)
    }
    return signalObj
}


$("document").ready(function () {
    var stepPerDegree= 0.5; //This value is set by finalized mechanical arrangements.
    var currentPosition = 0;
    var liveStream = document.getElementById("v");

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
    var CrossContainer = document.getElementById("CrossContainer");
    var EPC= document.getElementById("EPcontrols")
    var Schematic = document.getElementById("Schematic");
    var Lamps = document.getElementById("Lamps");
    var SlitControl = document.getElementById("SlitControl");
    
    OverviewCam.addEventListener('click', function() {
        if(FirstTimeCam){
            console.log("Temp cam was clicked for the first time");
            FirstTimeCam=false;
        }
        else{
            dataChannel.send("Camera/camera/a");
            currentCam = "a"
        }
        
        EPC.style.visibility='hidden';
        showruler.prop("checked",false)
        track_mouse= false
        document.getElementById("crosshair-v").style.visibility = "hidden";
        document.getElementById("crosshair-h").style.visibility = "hidden";
        
        Lamps.style.visibility='visible';
        Crosshairs.style.visibility = "hidden";
        SlitControl.style.visibility = "hidden";
        
    })

    ArmCam.addEventListener('click', function() {
        dataChannel.send("Camera/camera/c");
        
        EPC.style.visibility='visible';
        track_mouse= false;
        
        Lamps.style.visibility='visible';
        Crosshairs.style.visibility='visible';
        SlitControl.style.visibility='visible';
        currentCam = "c"       
    })

    V1Cam.addEventListener('click', function() {
        dataChannel.send("Camera/camera/b");
        
        EPC.style.visibility='hidden';
        showruler.prop("checked",false)
        track_mouse= false
        document.getElementById("crosshair-v").style.visibility = "hidden";
        document.getElementById("crosshair-h").style.visibility = "hidden";
        
        Lamps.style.visibility = "hidden";
        Crosshairs.style.visibility = "hidden";
        SlitControl.style.visibility = "hidden";

        currentCam = "b"
    })

    V2Cam.addEventListener('click', function() {
        dataChannel.send("Camera/camera/d");
        
        EPC.style.visibility='hidden';
        showruler.prop("checked",false)
        track_mouse= false
        document.getElementById("crosshair-v").style.visibility = "hidden";
        document.getElementById("crosshair-h").style.visibility = "hidden";
        
        Lamps.style.visibility='visible';
        Crosshairs.style.visibility='visible';
        SlitControl.style.visibility='visible';

        currentCam = "d"
    })

    // OffCam.addEventListener('click', function() {
    //     dataChannel.send("Camera/camera/off")
    // })

    //for LiveFeed  
    // TEMP CHANGE
    var mainCamSignal = setupWebRTC(8081, liveStream, 100);
 
    //for Time Limit
     window.setTimeout(timeOutHandler,2700000)
 
     function timeOutHandler(){
        //  TEMP CHANGE
         mainCamSignal.hangup()
         alert("Your session has timed out.")
     }
 
     function startTimer(duration, display) {
         var timer = duration, minutes, seconds;
         setInterval(function () {
             minutes = parseInt(timer / 60, 10);
             seconds = parseInt(timer % 60, 10);
     
             minutes = minutes < 10 ? "0" + minutes : minutes;
             seconds = seconds < 10 ? "0" + seconds : seconds;
     
             display.textContent = minutes + ":" + seconds;
     
             if (--timer < 0) {
                 timer = duration;
             }
         }, 1000);
     }
     
     window.onload = function () {
         var fortyfiveMinutes = 60 * 45,
             display = document.querySelector('#time');
         startTimer(fortyfiveMinutes, display);
     }
 
   
    //for Ambient Light
    var lightSwitch = document.getElementById('lightSwitch');
    var AmbientTOGGLE = document.getElementById('ambientTOGGLE');
    var AmbientState = false;

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
    var spectraLamp = "H2"
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
    var SchemaPIC = document.getElementById('Schema')
    //for Telescope Settings
    var tCW = document.getElementById('telescopeCW');
    var tCCW = document.getElementById('telescopeCCW');
    var tFine = document.getElementById('fineArm');
    var tMedium = document.getElementById('mediumArm')
    var tCoarse = document.getElementById('coarseArm');
    var telescopeSteps=100; ///unknown number of degrees
    //for Grating Settings
    var gCW = document.getElementById('gratingCW');
    var gCCW = document.getElementById('gratingCCW');
    var gFine = document.getElementById('fineTable');
    var gMedium = document.getElementById('mediumTable')
    var gCoarse = document.getElementById('coarseTable');
    var gratingSteps=200; //roughly ten degrees


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
            dataChannel.send("Ambient/on/")                 //use this command with PDU
                //---------
            AmbientState=true;
            AmbientTOGGLE.title="Click here to turn OFF";
            lightSwitch.style.transform='scaleY(-1)';
        }
    })
    //END Ambient Toggling
    
    //BEGIN Lamp Toggling

    function H2PressCmd() {
        // If it is already on and is just switching to H2
        // Turn off carousel, move to H2, turn on carousel
        if(lampSupplyState && spectraLamp != "H2"){
            console.log("Turning off and switching to H2")
            dataChannel.send("Camera/camera/a")               //This should be overview camera
            // Add waiting popup (modal) here
            dataChannel.send("ASDIpdu/off/6");
            dataChannel.send("Carousel/goto/h2")
            dataChannel.send("ASDIpdu/on/6");
            dataChannel.send("Camera/camera/" + currentCam)
        // If it off and H2 is clicked while not on H2
        // Move to H2, turn on carousel.
        } else if (!lampSupplyState && spectraLamp != "H2"){
            console.log("Switching to H2")
            dataChannel.send("Camera/camera/a")               //This should be overview camera
            // Add waiting popup (modal) here
            dataChannel.send("ASDIpdu/off/6");
            dataChannel.send("Carousel/goto/h2")
            dataChannel.send("ASDIpdu/on/6");
            dataChannel.send("Camera/camera/" + currentCam)

        // If its off and already at H2
        // Start by checking if it is the first time
        // If so, setup all lamps off, dont move or send anything
        // If not, just turn on carousel.
        } else if (!lampSupplyState && spectraLamp == "H2"){
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
                dataChannel.send("ASDIpdu/on/6")
            }
        // If H2 is already on, turn it off and switch view to off view.
        } else if (lampSupplyState && spectraLamp == "H2") {
            dataChannel.send("ASDIpdu/off/6")
            mWrap0.style.display = "block";                     
            mWrap1.style.display = "none";
            mWrap2.style.display = "none";                     
            mWrap3.style.display = "none";    
            H2ONpic.style.display = "none";                      
            aONpic.style.display = "none";
            bONpic.style.display = "none";
            allOFFpic.style.display = "block"
            spectraLamp = "H2"
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
        if(lampSupplyState && spectraLamp != "A"){
            console.log("Turning off and switching to A")
            dataChannel.send("Camera/camera/a")               //This should be overview camera
            // Add waiting popup (modal) here
            dataChannel.send("ASDIpdu/off/6");
            dataChannel.send("Carousel/goto/a")
            dataChannel.send("ASDIpdu/on/6");
            dataChannel.send("Camera/camera/" + currentCam)
        // If it off and H2 is clicked while not on H2
        // Move to A, turn on carousel.
        } else if (!lampSupplyState && spectraLamp != "A"){
            console.log("Switching to A")
            dataChannel.send("Camera/camera/a")               //This should be overview camera
            // Add waiting popup (modal) here
            dataChannel.send("ASDIpdu/off/6");
            dataChannel.send("Carousel/goto/a")
            dataChannel.send("ASDIpdu/on/6");
            dataChannel.send("Camera/camera/" + currentCam)

        // If its off and already at A
        // If not, just turn on carousel.
        } else if (!lampSupplyState && spectraLamp == "A"){
            dataChannel.send("ASDIpdu/on/6")

        // If A is already on, turn it off and switch view to off view.
        } else if (lampSupplyState && spectraLamp == "H2") {
            dataChannel.send("ASDIpdu/off/6")
            mWrap0.style.display = "block";                     
            mWrap1.style.display = "none";
            mWrap2.style.display = "none";                     
            mWrap3.style.display = "none";    
            H2ONpic.style.display = "none";                      
            aONpic.style.display = "none";
            bONpic.style.display = "none";
            allOFFpic.style.display = "block"
            spectraLamp = "A"
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
            dataChannel.send("Camera/camera/a")               //This should be overview camera
            // Add waiting popup (modal) here
            dataChannel.send("ASDIpdu/off/6");
            dataChannel.send("Carousel/goto/b")
            dataChannel.send("ASDIpdu/on/6");
            dataChannel.send("Camera/camera/" + currentCam)
        // If it off and B is clicked while not on B
        // Move to B, turn on carousel.
        } else if (!lampSupplyState && spectraLamp != "B"){
            console.log("Switching to B")
            dataChannel.send("Camera/camera/a")               //This should be overview camera
            // Add waiting popup (modal) here
            dataChannel.send("ASDIpdu/off/6");
            dataChannel.send("Carousel/goto/b")
            dataChannel.send("ASDIpdu/on/6");
            dataChannel.send("Camera/camera/" + currentCam)

        // If its off and already at B
        // If not, just turn on carousel.
        } else if (!lampSupplyState && spectraLamp == "B"){
            dataChannel.send("ASDIpdu/on/6")

        // If A is already on, turn it off and switch view to off view.
        } else if (lampSupplyState && spectraLamp == "B") {
            dataChannel.send("ASDIpdu/off/6")
            mWrap0.style.display = "block";                     
            mWrap1.style.display = "none";
            mWrap2.style.display = "none";                     
            mWrap3.style.display = "none";    
            H2ONpic.style.display = "none";                      
            aONpic.style.display = "none";
            bONpic.style.display = "none";
            allOFFpic.style.display = "block"
            H2press = document.getElementById('H2-off');
            Apress = document.getElementById('SampleA-off');
            Bpress = document.getElementById('SampleB-off');
            spectraLamp = "B"
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
        H2press = document.getElementById('H2-b');
        Apress = document.getElementById('SampleA-b');
        Bpress = document.getElementById('SampleB-b');
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
        dataChannel.send("Carousel/move/-20")
    })
    nudgeRight.addEventListener('click',function() {
        console.log("Lamp nudged right");
        dataChannel.send("Carousel/move/20")
    })
//END Lamp Nudging

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

   //BEGIN Slit Buttons 
   fineSlit.addEventListener('click', function(){slitSteps=50;})
   coarseSlit.addEventListener('click', function(){slitSteps=200;})

   function openSlitCmd() {
    console.log("Slit was made wider");
    dataChannel.send("Slit/move/"+slitStep);
   }

   function closeSlitCmd() {
    console.log("Slit was made narrower");
    dataChannel.send("Slit/move/"+(-slitSteps));
   }
   
   LopenSlit.addEventListener('click', openSlitCmd);
   RopenSlit.addEventListener('click', openSlitCmd);
   
   LcloseSlit.addEventListener('click', closeSlitCmd);
   RcloseSlit.addEventListener('click', closeSlitCmd);
   

   //END Slit Buttons

 
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
  
});


window.addEventListener('beforeunload', function(e) {
    // TEMP CHANGE
    mainCamSignal.hangup();
    // TEMP CHANGE
    dataChannel.close();
})





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