
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
    var FirstTimeOvenOn = true;
    var FirstTimeOvenOff = true;
    var FirstTimePSon = true;
    var FirstTimePSoff = true;
    var FirstTimeTempCam = true;

    // Define Variables that are MWRAPs for use inside of callbacks
    var mWrap1, mWrap2, mWrap6, mWrap7
    var intervalId
    var mWrapList = ["#mapster_wrap_2", "#mapster_wrap_1", "#mapster_wrap_6", "#mapster_wrap_7"]

    var loadingModal = $("#loadingModal")

    loadingModal.on("shown.bs.modal", function(e){
        intervalId = setInterval(function() {
            for (mWrap of mWrapList) {
                if ($(mWrap).length == 0) {
                    return
                }
            } 
            
            //Run when all mwraps exist.
            mWrap1 = $("#mapster_wrap_1")[0]
            mWrap2 = $("#mapster_wrap_2")[0]
            mWrap6 = $("#mapster_wrap_6")[0]
            mWrap7 = $("#mapster_wrap_7")[0]
    
            // Do clicks here
            OvenONpress.click()
            OvenOFFpress.click()
            powerSupplyON.click()
            powerSupplyOFF.click()
            TempCam.click()
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
    // var OffCam = document.getElementById("OffCam");

    //for div display switching
    var FullPage = document.getElementById("FullPage");
    var OvenLeft = document.getElementById("OvenLeft");
    var OvenRight = document.getElementById("OvenRight");
    var TubeLeft = document.getElementById("TubeLeft");
    var TubeRight = document.getElementById("TubeRight");
    var PotsLeft = document.getElementById("ControlsLeft");
    var PotsRight = document.getElementById("ControlsRight");
    var PotsBottom = document.getElementById("ControlsBottom");
    var MetersBottom = document.getElementById("MetersBottom");
    var EPC= document.getElementById("EPcontrols")

    OverviewCam.addEventListener('click', function() {
        if(FirstTimeTempCam){
            console.log("Temp cam was clicked for the first time");
            FirstTimeTempCam=false;
        }
        else{
            dataChannel.send("Camera/camera/a");
        }
        EPC.style.visibility='hidden';
        showruler.prop("checked",false)
        track_mouse= false
        document.getElementById("crosshair-v").style.visibility = "hidden";
        document.getElementById("crosshair-h").style.visibility = "hidden";
        OvenLeft.style.display = "block";
        OvenRight.style.display = "block";
        TubeLeft.style.display = "none";
        TubeRight.style.display = "none";
        PotsLeft.style.display = "none";
        PotsRight.style.display = "none";
        PotsBottom.style.display = "none";
        MetersBottom.style.display = "none";
        
    })

    ArmCam.addEventListener('click', function() {
        EPC.style.visibility='visible';
        track_mouse= false;
        dataChannel.send("Camera/camera/b");
        OvenLeft.style.display = "none";
        OvenRight.style.display = "none";
        TubeLeft.style.display = "block";
        TubeRight.style.display = "block";
        PotsLeft.style.display = "none";
        PotsRight.style.display = "none";
        PotsBottom.style.display = "none";
        MetersBottom.style.display = "none";
       
    })

    V1Cam.addEventListener('click', function() {
        EPC.style.visibility='hidden';
        showruler.prop("checked",false)
        track_mouse= false
        document.getElementById("crosshair-v").style.visibility = "hidden";
        document.getElementById("crosshair-h").style.visibility = "hidden";
        dataChannel.send("Camera/camera/c");
        OvenLeft.style.display = "none";
        OvenRight.style.display = "none";
        TubeLeft.style.display = "none";
        TubeRight.style.display = "none";
        PotsLeft.style.display = "block";
        PotsRight.style.display = "block";
        PotsBottom.style.display = "block";
        MetersBottom.style.display = "none";
       
  
    })

    V2Cam.addEventListener('click', function() {
        EPC.style.visibility='hidden';
        showruler.prop("checked",false)
        track_mouse= falsedocument.getElementById("crosshair-v").style.visibility = "hidden";
        document.getElementById("crosshair-h").style.visibility = "hidden";
        dataChannel.send("Camera/camera/d");
        OvenLeft.style.display = "none";
        OvenRight.style.display = "none";
        TubeLeft.style.display = "none";
        TubeRight.style.display = "none";
        PotsLeft.style.display = "block";
        PotsRight.style.display = "none";
        PotsBottom.style.display = "none";
        MetersBottom.style.display = "block";
        
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
 
   
    //for Oven Variac Power
    var OvenOFFpress = document.getElementById('ovenOFF');
    var OvenONpress = document.getElementById('ovenON');
    var OvenOFFpic = document.getElementById('ovenSwitchOFF');
    var OvenONpic = document.getElementById('ovenSwitchON');
    var OvenState = false;

    //for Filament Variac Power
    var filamentSwitch = document.getElementById('filamentSwitch');
    var filamentTOGGLE = document.getElementById('filamentTOGGLE');
    var filamentState = false;

    //for Power Supply Power
    var powerSupplyOFF = document.getElementById('psOFF');
    var powerSupplyON = document.getElementById('psON');
    var psOFFpic = document.getElementById('powerSupplySwitchOFF');
    var psONpic = document.getElementById('powerSupplySwitchON');
    var powerSupplyState = false;

    //for Oven Variac Settings
    var lowerOvenV = document.getElementById('oVccw');
    var raiseOvenV = document.getElementById('oVcw');
    var threeDegOvenV = document.getElementById('3.6_deg_Vo');
    var thirtySixDegOvenV = document.getElementById('36_deg_Vo');
    var ovenSteps=23;
   
    //for Filament Variac Settings
    var lowerFilamentV = document.getElementById('fVccw');
    var raiseFilamentV = document.getElementById('fVcw');
    var threeDegFilamentV = document.getElementById('3.6_deg_Vf');
    var thirtySixDegFilamentV = document.getElementById('36_deg_Vf');
    var filamentSteps=23;
    
    //for Accelerating Voltage Potentiometer Settings
    var raiseVa = document.getElementById('aCW');
    var lowerVa = document.getElementById('aCCW');
    var threeDegVa = document.getElementById('3.6_deg_Va');
    var thirtySixDegVa = document.getElementById('36_deg_Va');
    var threeSixtyDegVa = document.getElementById('360_deg_Va');
    var VaSteps=23;
   
    //for Retarding Voltage Potentiometer Settings
    var raiseVr = document.getElementById('rCW');
    var lowerVr = document.getElementById('rCCW');
    var threeDegVr = document.getElementById('3.6_deg_Vr');
    var thirtySixDegVr = document.getElementById('36_deg_Vr');
    var VrSteps=23;

    //BEGIN Power Switches 
 
    OvenOFFpress.addEventListener('click', function(){
        console.log("Oven power was turned off");
        if(OvenState){
            if(FirstTimeOvenOff){
                // mWrap2 = document.getElementById('mapster_wrap_2');
                console.log("for the first time");
            }
            if(!FirstTimeOvenOff){
            //--------choose one of the following
            //dataChannel.send("OvenPower/setRelay/OFF");   //use this command with HS105
            
            // This will control the carousel
            dataChannel.send("ASDIpdu/off/6");                //use this command with PDU
            }
            mWrap1.style.display = "block";                      
            mWrap2.style.display = "none";
            OvenOFFpic.style.display = "block";                      
            OvenONpic.style.display = "none"; 
            OvenState=false; 
            FirstTimeOvenOff=false;
        }
    })
    OvenONpress.addEventListener('click', function(){
        console.log("Oven power was turned on");
        if(!OvenState){
            if(FirstTimeOvenOn){  //initialize mapster wrap for OvenOn
                // mWrap1 = document.getElementById('mapster_wrap_1');
                console.log("for the first time");
            }
            if(!FirstTimeOvenOn){
            //--------choose one of the following
            //dataChannel.send("OvenPower/setRelay/ON");    //use this command with HS105
            // This will control the carousel
            dataChannel.send("ASDIpdu/on/6");                 //use this command with PDU 
            }
            mWrap2.style.display = "block";                      
            mWrap1.style.display = "none"; 
            OvenONpic.style.display = "block";                      
            OvenOFFpic.style.display = "none";
            OvenState=true;  
            FirstTimeOvenOn=false;
        }
    })
    
    filamentTOGGLE.addEventListener('click', function(){
        console.log("Filament power was switched");
        if(filamentState){
                //--------choose one of the following
            //dataChannel.send("FilamentPower/setRelay/OFF");  //use this command with HS105
            // Commented line below - 20200716
            // dataChannel.send("FHpdu/off/2");                //use this command with PDU
                //---------
            filamentState=false;
            filamentTOGGLE.title="Click here to turn ON";
            filamentSwitch.style.transform='scaleY(1)';
                     }
        else{
                //--------choose one of the following
            //dataChannel.send("FilamentPower/setRelay/ON");   //use this command with HS105
            // Commented line below - 20200716
            // dataChannel.send("FHpdu/on/2");                 //use this command with PDU
                //---------
            filamentState=true;
            filamentTOGGLE.title="Click here to turn OFF";
            filamentSwitch.style.transform='scaleY(-1)';
        }
    })
    
    powerSupplyOFF.addEventListener('click', function(){
        console.log("Power Supply was turned off");
        if(powerSupplyState){
            if(FirstTimePSoff){
                // mWrap6 = document.getElementById('mapster_wrap_6');
                console.log("for the first time");            
            }
            if(!FirstTimePSoff){
            //--------choose one of the following
            //dataChannel.send("PowerSupplyPower/setRelay/OFF"); //use this command with HS105
            // Commented line below - 20200716
            // dataChannel.send("FHpdu/off/3");                //use this command with PDU
            }
            mWrap6.style.display = "block";                      
            mWrap7.style.display = "none"; 
            psOFFpic.style.display = "block";                      
            psONpic.style.display = "none"; 
            
            powerSupplyState=false;
            FirstTimePSoff=false;
        }
    })
    powerSupplyON.addEventListener('click', function(){
        console.log("Power Supply was turned on");
        if(!powerSupplyState){
            if(FirstTimePSon){
                // mWrap7 = document.getElementById('mapster_wrap_7');  
                console.log("for the first time");  
            }
            if(!FirstTimePSon){
            //--------choose one of the following
            //dataChannel.send("PowerSupplyPower/setRelay/ON");  //use this command with HS105
            // Commented line below - 20200716
            // dataChannel.send("FHpdu/on/3");                //use this command with PDU
            
            }   
            mWrap7.style.display = "block";                      
            mWrap6.style.display = "none"; 
            psONpic.style.display = "block";                      
            psOFFpic.style.display = "none"; 
            
            powerSupplyState=true;
            FirstTimePSon=false;
            
        }
    })
    // END Power Switches

    //BEGIN Grating buttons
    threeDegOvenV.addEventListener('click', function(){ovenSteps=2;})
    thirtySixDegOvenV.addEventListener('click', function(){ovenSteps=21;})
    
    lowerOvenV.addEventListener('click', function() {
        console.log("Oven Variac was turned down");
        // Changed for AS 
        dataChannel.send("Grating/move/"+(-ovenSteps));
    })
    raiseOvenV.addEventListener('click', function() {
        console.log("Oven Variac was turned up");
        // Changed for AS 
        dataChannel.send("Grating/move/"+ovenSteps);
    })

    //END  Grating Buttons


   //BEGIN Carousel Buttons 
   threeDegFilamentV.addEventListener('click', function(){filamentSteps=2;})
   thirtySixDegFilamentV.addEventListener('click', function(){filamentSteps=21;})
   
   lowerFilamentV.addEventListener('click', function() {
       // Changed for AS 
       console.log("Filament Variac was turned down"); 
       dataChannel.send("Carousel/move/"+(-filamentSteps));
    })
   raiseFilamentV.addEventListener('click', function() {
       // Changed for AS 
       console.log("Filament Variac was turned up");
       dataChannel.send("Carousel/move/"+filamentSteps);
    })
   //END Carousel Buttons

   //BEGIN Arm Buttons 
   threeDegVa.addEventListener('click', function(){VaSteps=2;})
   thirtySixDegVa.addEventListener('click', function(){VaSteps=21;})
   threeSixtyDegVa.addEventListener('click', function(){VaSteps=210;})

   lowerVa.addEventListener('click', function() {
       // Changed for AS 
       console.log("Accelerating voltage was turned down");
       dataChannel.send("Arm/move/"+(-VaSteps));
    })
   raiseVa.addEventListener('click', function() {
       // Changed for AS 
       console.log("Accelerating voltage was turned up");
       dataChannel.send("Arm/move/"+VaSteps);
    })
   //END Arm Buttons

   //BEGIN Slit Buttons 
   threeDegVr.addEventListener('click', function(){VrSteps=2;})
   thirtySixDegVr.addEventListener('click', function(){VrSteps=21;})
   
   lowerVr.addEventListener('click', function() {
       console.log("Retarding voltage was turned down");
       dataChannel.send("Slit/move/"+(-VrSteps));
    })
   raiseVr.addEventListener('click', function() {
       console.log("Retarding voltage was turned up");
       dataChannel.send("Slit/move/"+VrSteps);
    })
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
    fillOpacity: 0,
    render_select: { 
        fillOpacity: 0
    },
    singleSelect: true
  }).parent().css({"margin":"0 auto"});

  $('#LampsBon').mapster({
    mapKey:'id',
    fillColor: 'f5f5b5',
    fillOpacity: 0,
    render_select: { 
        fillOpacity: 0
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

  $('#SlitControl').mapster({
    mapKey:'id',
    fillColor: 'f5f5b5',
    fillOpacity: 0,
    render_select: { 
        fillOpacity: 0
    },
    singleSelect: true
  }).parent().css({"margin":"0 auto"});

  $('#Schematic').mapster({
    mapKey:'id',
    fillColor: 'f5f5b5',
    fillOpacity: 0,
    render_select: { 
        fillOpacity: 0
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