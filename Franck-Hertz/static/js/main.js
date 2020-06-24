
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
    var FirstTime = true;

    //for multi-camera switching
    var TempCam = document.getElementById("TempCam");
    var TubeCam = document.getElementById("TubeCam");
    var PotsCam = document.getElementById("PotsCam");
    var DataCam = document.getElementById("DataCam");
    // var OffCam = document.getElementById("OffCam");

    //for div display switching
    var OvenLeft = document.getElementById("OvenLeft");
    var OvenRight = document.getElementById("OvenRight");
    var TubeLeft = document.getElementById("TubeLeft");
    var TubeRight = document.getElementById("TubeRight");
    var PotsLeft = document.getElementById("ControlsLeft");
    var PotsRight = document.getElementById("ControlsRight");
    var PotsBottom = document.getElementById("ControlsBottom");
    var MetersBottom = document.getElementById("MetersBottom");

    TempCam.addEventListener('click', function() {
        // dataChannel.send("Camera/camera/a");
        OvenLeft.style.display = "block";
        OvenRight.style.display = "block";
        TubeLeft.style.display = "none";
        TubeRight.style.display = "none";
        PotsLeft.style.display = "none";
        PotsRight.style.display = "none";
        PotsBottom.style.display = "none";
        MetersBottom.style.display = "none";
    })

    TubeCam.addEventListener('click', function() {
        // dataChannel.send("Camera/camera/b");
        OvenLeft.style.display = "none";
        OvenRight.style.display = "none";
        TubeLeft.style.display = "block";
        TubeRight.style.display = "block";
        PotsLeft.style.display = "none";
        PotsRight.style.display = "none";
        PotsBottom.style.display = "none";
        MetersBottom.style.display = "none";
    })

    PotsCam.addEventListener('click', function() {
        // dataChannel.send("Camera/camera/c");
        OvenLeft.style.display = "none";
        OvenRight.style.display = "none";
        TubeLeft.style.display = "none";
        TubeRight.style.display = "none";
        PotsLeft.style.display = "block";
        PotsRight.style.display = "block";
        PotsBottom.style.display = "block";
        MetersBottom.style.display = "none";
    })

    DataCam.addEventListener('click', function() {
        // dataChannel.send("Camera/camera/d");
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
    // var mainCamSignal = setupWebRTC(8081, liveStream, 100);
 
    //for Time Limit
     window.setTimeout(timeOutHandler,2700000)
 
     function timeOutHandler(){
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
 
    // for Keithley 6514 Electrometer
    var shift6514Button = document.getElementById('Shift6514');
    var local6514Button = document.getElementById('Local6514');
    var power6514Button = document.getElementById('Power6514');
    var voltageButton = document.getElementById('Voltage');
    var currentButton = document.getElementById('Current');
    var resistanceButton = document.getElementById('Resistance');
    var chargeButton = document.getElementById('Charge');
    var externalFeedbackButton = document.getElementById('ExternalFeedback');
    var zeroCheckButton = document.getElementById('ZeroCheck');
    var zeroCorrectButton = document.getElementById('ZeroCorrect');
    var groundButton = document.getElementById('Ground');
    var averageButton = document.getElementById('Average');
    var medianButton = document.getElementById('Median');
    var relativeButton = document.getElementById('Relative');
    var limitButton = document.getElementById('Limit');
    var digits6514Button = document.getElementById('Digits6514');
    var rate6514Button = document.getElementById('Rate6514');
    var cursorLeft6514Button = document.getElementById('CursorLeft6514');
    var cursorRight6514Button = document.getElementById('CursorRight6514');
    var store6514Button = document.getElementById('Store6514');
    var recall6514Button = document.getElementById('Recall6514');
    var delayButton = document.getElementById('Delay');
    var dampingButton = document.getElementById('Damping');
    var haltButton = document.getElementById('Halt');
    var trigger6514Button = document.getElementById('Trigger6514');
    var exit6514Button = document.getElementById('Exit6514');
    var enter6514Button = document.getElementById('Enter6514');
    var upRange6514Button = document.getElementById('UpRange6514');
    var downRange6514Button = document.getElementById('DownRange6514');
    var autoRange6514Button = document.getElementById('AutoRange6514');
 
   
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
            if(!FirstTime){
            //--------choose one of the following
            //dataChannel.send("OvenPower/setRelay/OFF");   //use this command with HS105
            dataChannel.send("FHpdu/off/3");                //use this command with PDU
            }
            OvenState=false; 
            mWrap1.style.display = "block";                      
            mWrap2.style.display = "none";
            OvenOFFpic.style.display = "block";                      
            OvenONpic.style.display = "none"; 
        }
    })
    OvenONpress.addEventListener('click', function(){
        console.log("Oven power was turned on");
        if(!OvenState){
            if(!FirstTime){
            //--------choose one of the following
            //dataChannel.send("OvenPower/setRelay/ON");    //use this command with HS105
            dataChannel.send("FHpdu/on/3");                 //use this command with PDU
            }
            OvenState=true;   
            mWrap2.style.display = "block";                      
            mWrap1.style.display = "none"; 
            OvenONpic.style.display = "block";                      
            OvenOFFpic.style.display = "none"; 
        }
    })
    
    filamentTOGGLE.addEventListener('click', function(){
        console.log("Filament power was switched");
        if(filamentState){
                //--------choose one of the following
            //dataChannel.send("FilamentPower/setRelay/OFF");  //use this command with HS105
            dataChannel.send("FHpdu/off/4");                //use this command with PDU
                //---------
            filamentState=false;
            filamentTOGGLE.title="Click here to turn ON";
            filamentSwitch.style.transform='scaleY(1)';
                     }
        else{
                //--------choose one of the following
            //dataChannel.send("FilamentPower/setRelay/ON");   //use this command with HS105
            dataChannel.send("FHpdu/on/4");                 //use this command with PDU
                //---------
            filamentState=true;
            filamentTOGGLE.title="Click here to turn OFF";
            filamentSwitch.style.transform='scaleY(-1)';
        }
    })
    
    powerSupplyOFF.addEventListener('click', function(){
        console.log("Power Supply was turned off");
        if(powerSupplyState){
            if(!FirstTime){
            //--------choose one of the following
            //dataChannel.send("PowerSupplyPower/setRelay/OFF"); //use this command with HS105
            dataChannel.send("FHpdu/off/1");                //use this command with PDU
            }
            powerSupplyState=false;
            mWrap6.style.display = "block";                      
            mWrap7.style.display = "none"; 
            psOFFpic.style.display = "block";                      
            psONpic.style.display = "none"; 
                             }
    })
    powerSupplyON.addEventListener('click', function(){
        console.log("Power Supply was turned on");
        if(!powerSupplyState){
            if(!FirstTime){
            //--------choose one of the following
            //dataChannel.send("PowerSupplyPower/setRelay/ON");  //use this command with HS105
            dataChannel.send("FHpdu/on/1");                //use this command with PDU
            }
            powerSupplyState=true;
            mWrap7.style.display = "block";                      
            mWrap6.style.display = "none"; 
            psONpic.style.display = "block";                      
            psOFFpic.style.display = "none"; 
                            }
    })
    // END Power Switches

    //BEGIN Oven Variac Buttons 
    threeDegOvenV.addEventListener('click', function(){ovenSteps=2;})
    thirtySixDegOvenV.addEventListener('click', function(){ovenSteps=21;})
    
    lowerOvenV.addEventListener('click', function() {
        console.log("Oven Variac was turned down"); 
        dataChannel.send("Oven/move/"+(-ovenSteps));})
    raiseOvenV.addEventListener('click', function() {
        console.log("Oven Variac was turned up");
        dataChannel.send("Oven/move/"+ovenSteps);})
    //END Oven Variac Buttons
   //BEGIN Filament Variac Buttons 
   threeDegFilamentV.addEventListener('click', function(){filamentSteps=2;})
   thirtySixDegFilamentV.addEventListener('click', function(){filamentSteps=21;})
   
   lowerFilamentV.addEventListener('click', function() {
       console.log("Filament Variac was turned down"); dataChannel.send("Filament/move/"+(-filamentSteps));})
   raiseFilamentV.addEventListener('click', function() {
       console.log("Filament Variac was turned up");dataChannel.send("Filament/move/"+filamentSteps);})
   //END Filament Variac Buttons
   //BEGIN Accelerating Voltage Buttons 
   threeDegVa.addEventListener('click', function(){VaSteps=2;})
   thirtySixDegVa.addEventListener('click', function(){VaSteps=21;})
   threeSixtyDegVa.addEventListener('click', function(){VaSteps=210;})

   lowerVa.addEventListener('click', function() {
       console.log("Accelerating voltage was turned down"); dataChannel.send("Va/move/"+(-VaSteps));})
   raiseVa.addEventListener('click', function() {
       console.log("Accelerating voltage was turned up");dataChannel.send("Va/move/"+VaSteps);})
   //END Accelerating Voltage Buttons
   //BEGIN Retarding Voltage Buttons 
   threeDegVr.addEventListener('click', function(){VrSteps=2;})
   thirtySixDegVr.addEventListener('click', function(){VrSteps=21;})
   
   lowerVr.addEventListener('click', function() {
       console.log("Retarding voltage was turned down"); dataChannel.send("Vr/move/"+(-VrSteps));})
   raiseVr.addEventListener('click', function() {
       console.log("Retarding voltage was turned up");dataChannel.send("Vr/move/"+VrSteps);})
   //END Retarding Voltage Buttons
 
    var ElectrometerState=false;

    //BEGIN Keithley 6514 Electrometer Buttons
    shift6514Button.addEventListener('click', function(event) {
        //Prevent it from reloading
        event.stopPropagation();
        //Run our command
        dataChannel.send("Electrometer/press/SYST:KEY 1");
        //Ensure it doesn't reload
        return false
    })
    local6514Button.addEventListener('click', function(event) {
        //Prevent it from reloading
        event.stopPropagation();
        //Run our command
        dataChannel.send("Electrometer/press/SYST:LOC");
        //Ensure it doesn't reload
        return false
    })
    power6514Button.addEventListener('click', function(){
        console.log("Electrometer was switched");
        if(ElectrometerState){
            dataChannel.send("FHpdu/off/2");
            ElectrometerState=false;
                     }
        else{
            dataChannel.send("FHpdu/on/2");
            ElectrometerState=true;
        }
    })
    // power6514Button.addEventListener('click', function(){
    //     console.log("Electrometer was switched");
    //     if(ElectrometerState){
    //         dataChannel.send("ElectrometerPower/setRelay/OFF");
    //         ElectrometerState=false;
    //                  }
    //     else{
    //         dataChannel.send("ElectrometerPower/setRelay/ON");
    //         ElectrometerState=true;
    //     }
    // })
    voltageButton.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Electrometer/press/SYST:KEY 2");
        return false
    })
    currentButton.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Electrometer/press/SYST:KEY 3");
        return false
    })
    resistanceButton.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Electrometer/press/SYST:KEY 4");
        return false
    })
    chargeButton.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Electrometer/press/SYST:KEY 5");
        return false
    })
    externalFeedbackButton.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Electrometer/press/SYST:KEY 6");
        return false
    })
    zeroCheckButton.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Electrometer/press/SYST:KEY 7");
        return false
    })
    zeroCorrectButton.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Electrometer/press/SYST:KEY 8");
        return false
    })
    groundButton.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Electrometer/press/SYST:KEY 16");
        return false
    })
    averageButton.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Electrometer/press/SYST:KEY 18");
        return false
    })
    medianButton.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Electrometer/press/SYST:KEY 19");
        return false
    })
    relativeButton.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Electrometer/press/SYST:KEY 20");
        return false
    })
    limitButton.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Electrometer/press/SYST:KEY 21");
        return false
    })
    digits6514Button.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Electrometer/press/SYST:KEY 22");
        return false
    })
    rate6514Button.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Electrometer/press/SYST:KEY 23");
        return false
    })
    cursorLeft6514Button.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Electrometer/press/SYST:KEY 24");
        return false
    })
    cursorRight6514Button.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Electrometer/press/SYST:KEY 15");
        return false
    })
    store6514Button.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Electrometer/press/SYST:KEY 26");
        return false
    })
    recall6514Button.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Electrometer/press/SYST:KEY 27");
        return false
    })
    delayButton.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Electrometer/press/SYST:KEY 28");
        return false
    })
    dampingButton.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Electrometer/press/SYST:KEY 29");
        return false
    })
    haltButton.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Electrometer/press/SYST:KEY 30");
        // dataChannel.send("Electrometer/press/SYST:ABOR");
        return false
    })
    trigger6514Button.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Electrometer/press/SYST:KEY 31");
        // dataChannel.send("Electrometer/press/TRIG:");
        return false
    })
    exit6514Button.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Electrometer/press/SYST:KEY 32");
        return false
    })
    enter6514Button.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Electrometer/press/SYST:KEY 14");
        return false
    })
    upRange6514Button.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Electrometer/press/SYST:KEY 11");
        return false
    })
    downRange6514Button.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Electrometer/press/SYST:KEY 13");
        return false
    })
    autoRange6514Button.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Electrometer/press/SYST:KEY 12");
        return false
    })
    // abort.addEventListener('click', function() {
    //     dataChannel.send("Electrometer/press/ABOR")
    // })
 //END Keithley 6514 Electrometer Buttons


 //map highlights - This is the script that styles effect of mouseOver and clicks on image maps
  $('#ovenKnob').mapster({
    mapKey:'id',
    fillColor: 'f5f5b5',
    fillOpacity: 0.6,
    render_select: { 
        fillOpacity: 0.3
    },
    singleSelect: true
    // scaleMap: true
  }).parent().css({"margin":"0 auto"});

  $('#ovenSwitchOFF').mapster({
    mapKey:'id',
    fillColor: 'f5f5b5',
    fillOpacity: 0,
    render_select: { 
        fillOpacity: 0
    },
    singleSelect: true
  }).parent().css({"margin":"0 auto"});

  $('#ovenSwitchON').mapster({
    mapKey:'id',
    fillColor: 'f5f5b5',
    fillOpacity: 0,
    render_select: { 
        fillOpacity: 0
    },
    singleSelect: true
  }).parent().css({"margin":"0 auto"});


  $('#fKnob').mapster({
    mapKey:'id',
    fillColor: 'f5f5b5',
    fillOpacity: 0.6,
    render_select: { 
        fillOpacity: 0.3
    },
    singleSelect: true
  }).parent().css({"margin":"0 auto"});

  $('#Va').mapster({
    mapKey:'id',
    fillColor: 'f5f5b5',
    fillOpacity: 0.6,
    render_select: { 
        fillOpacity: 0.3
    },
    singleSelect: true
  }).parent().css({"margin":"0 auto"});
  
  $('#Vr').mapster({
    mapKey:'id',
    fillColor: 'f5f5b5',
    fillOpacity: 0.6,
    render_select: { 
        fillOpacity: 0.3
    },
    singleSelect: true
  }).parent().css({"margin":"0 auto"});

  $('#powerSupplySwitchOFF').mapster({
    mapKey:'id',
    fillColor: 'f5f5b5',
    fillOpacity: 0,
    render_select: { 
        fillOpacity: 0
    },
    singleSelect: true
  }).parent().css({"margin":"0 auto"});

  $('#powerSupplySwitchON').mapster({
    mapKey:'id',
    fillColor: 'f5f5b5',
    fillOpacity: 0,
    render_select: { 
        fillOpacity: 0
    },
    singleSelect: true
  }).parent().css({"margin":"0 auto"});

  $('#electrometer').mapster({
    mapKey:'id',
    fillColor: 'f5f5b5',
    fillOpacity: 0.6,
    render_select: { 
        fillOpacity: 0.3
    },
    singleSelect: true
  }).parent().css({"margin":"0 auto"});

    $("#ovenSwitchOFF").ready(function () {
        var mWrap1 = document.getElementById('mapster_wrap_1');
        console.log("PRINTING THE MWRAP 1")
        console.log(mWrap1);
    });
    var mWrap0 = document.getElementById('mapster_wrap_0');
    var mWrap2 = document.getElementById('mapster_wrap_2');
    var mWrap3 = document.getElementById('mapster_wrap_3');
    var mWrap4 = document.getElementById('mapster_wrap_4');
    var mWrap5 = document.getElementById('mapster_wrap_5');
    var mWrap6 = document.getElementById('mapster_wrap_6');
    var mWrap7 = document.getElementById('mapster_wrap_7');
    var mWrap8 = document.getElementById('mapster_wrap_8');

    console.log("PRINTING THE MWRAP2")
    // console.log(mWrap1);
    console.log(mWrap2);

    OvenONpress.click();
    OvenOFFpress.click();
    powerSupplyON.click();
    powerSupplyOFF.click();
    TempCam.click();
    console.log('on/off cycle was performed');
    FirstTime=false;



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


window.addEventListener('beforeunload', function(e) {
    mainCamSignal.hangup();
    dataChannel.close();
})





//THIS SERVES HELP INTERPRET VCODEC CASE NUMBERS
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