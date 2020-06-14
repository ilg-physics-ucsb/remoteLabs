
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




window.addEventListener('DOMContentLoaded', function () {
    var isStreaming = false;
    var isStreaming2 = false;
    var stepPerDegree= 0.5; //This value is set by finalized mechanical arrangements.
    var currentPosition = 0;
    var start = document.getElementById('start');
    var stop = document.getElementById('stop');
    var video = document.getElementById('v');
    // var video2 = document.getElementById('v2');
    
    // for Filter Wheel Motor -- converts the HTML element named in 'index' to a JS variable
    var f365 = document.getElementById('f365');
    var f436 = document.getElementById('f436');
    var f546 = document.getElementById('f546');
    var f577 = document.getElementById('f577');
    var filterwheel = document.getElementById('filterwheel')

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

    //for Keithley 2000 Multimeter
    var shift2000Button = document.getElementById('Shift2000');
    var local2000Button = document.getElementById('Local2000');
    var power2000Button = document.getElementById('Power2000');
    var dcVoltageButton = document.getElementById('DCvoltage');
    var acVoltageButton = document.getElementById('ACvoltage');
    var dcCurrentButton = document.getElementById('DCcurrent');
    var acCurrentButton = document.getElementById('ACcurrent');
    var TWOwireResistanceButton = document.getElementById('2wireResistance');
    var FOURwireResistanceButton = document.getElementById('4wireResistance');
    var frequencyButton = document.getElementById('Frequency');
    var temperatureButton = document.getElementById('Temperature');
    var externalTriggerButton = document.getElementById('ExternalTrigger');
    var trigger2000Button = document.getElementById('Trigger2000');
    var store2000Button = document.getElementById('Store2000');
    var recall2000Button = document.getElementById('Recall2000');
    var filterButton = document.getElementById('Filter');
    var relativeButton = document.getElementById('Relative');
    var cursorLeft2000Button = document.getElementById('CursorLeft2000');
    var cursorRight2000Button = document.getElementById('CursorRight2000');
    var openButton = document.getElementById('Open');
    var closeButton = document.getElementById('Close');
    var stepButton = document.getElementById('Step');
    var scanButton = document.getElementById('Scan');
    var digits2000Button = document.getElementById('Digits2000');
    var rate2000Button = document.getElementById('Rate2000');
    var exit2000Button = document.getElementById('Exit2000');
    var enter2000Button = document.getElementById('Enter2000');
    var upRange2000Button = document.getElementById('UpRange2000');
    var downRange2000Button = document.getElementById('DownRange2000');
    var autoRange2000Button = document.getElementById('AutoRange2000');


    //for LiveFeed
    var mainCamSignal = setupWebRTC(8081, video, 50);
    // var mainCamSignal = setupWebRTC(5002, video, 50);
    window.setTimeout(timeOutHandler,2700000)

    function timeOutHandler(){
        mainCamSignal.hangup()
        alert("Your session has timed out.")
    }

    var ACam = document.getElementById("ACam")
    var BCam = document.getElementById("BCam")
    var CCam = document.getElementById("CCam")
    var DCam = document.getElementById("DCam")
    var OffCam = document.getElementById("OffCam")

    ACam.addEventListener('click', function() {
        dataChannel.send("Camera/camera/a")
    })

    BCam.addEventListener('click', function() {
        dataChannel.send("Camera/camera/b")
    })

    CCam.addEventListener('click', function() {
        dataChannel.send("Camera/camera/c")
    })

    DCam.addEventListener('click', function() {
        dataChannel.send("Camera/camera/d")
    })

    OffCam.addEventListener('click', function() {
        dataChannel.send("Camera/camera/off")
    })

    // var brightnessSlider = document.getElementById("BrightnessControl")
    // var contrastSlider = document.getElementById("ContrastControl")
    // var exposureSlider = document.getElementById("ExposureControl")
    // var zoomSlider = document.getElementById("ZoomControl")

    
    var brightnessSlider = $("#BrightnessControl").slider().on("slide", function(){
        console.log("Changed Brightness")
        //This is the command structure to modify the image.
        //It goes <Device Name>/imageMod/<modification type>,<value to set>
        //You should be able to fill in <modification type> with anything you see when you run
        // v4l2-ctl -d <number> -l
        // Where <number> is replaced by the number UV4L assigned to the camera i.e. /dev/video1 would have number=1
        // That command will also give you what are the allowed values for each <modification type> 
        dataChannel.send("Camera/imageMod/brightness,"+ brightnessSlider.getValue())
    }).data('slider')

    var contrastSlider = $("#ContrastControl").slider().on("slide", function(){
        console.log("Changed Contrast")
        dataChannel.send("Camera/imageMod/contrast,"+ contrastSlider.getValue())
    }).data('slider')

    var redbalanceSlider = $("#RedBalanceControl").slider().on("slide", function(){
        console.log("Changed Red Balance")
        dataChannel.send("Camera/imageMod/red_balance,"+ redbalanceSlider.getValue())
    }).data('slider')

    var bluebalanceSlider = $("#BlueBalanceControl").slider().on("slide", function(){
        console.log("Changed Blue Balance")
        dataChannel.send("Camera/imageMod/blue_balance,"+ bluebalanceSlider.getValue())
    }).data('slider')

    var exposureSlider = $("#ExposureControl").slider().on("slide", function(){
        console.log("Changed Exposure")
        dataChannel.send("Camera/imageMod/exposure_mode,"+ exposureSlider.getValue())
    }).data('slider')

    var zoomSlider = $("#ZoomControl").slider().on("slide", function(){
        console.log("Changed Zoom")
        dataChannel.send("Camera/imageMod/zoom_factor,"+ zoomSlider.getValue())
    }).data('slider')

    var isoSlider = $("#ISOControl").slider().on("slide", function(){
        console.log("Changed ISO Sensitivity")
        dataChannel.send("Camera/imageMod/iso_sensitivity,"+ isoSlider.getValue())
    }).data('slider')

    var saturationSlider = $("#SaturationControl").slider().on("slide", function(){
        console.log("Changed Saturation")
        dataChannel.send("Camera/imageMod/saturation,"+ saturationSlider.getValue())
    }).data('slider')

    var shutterSlider = $("#ShutterSpeedControl").slider().on("slide", function(){
        console.log("Changed Shutter Speed")
        dataChannel.send("Camera/imageMod/shutter_speed,"+ shutterSlider.getValue())
    }).data('slider')

    // brightnessSlider.on('change', function() {
    //     console.log("Brightness Changed")
    //     dataChannel.send("Camera/imageMod/brightness," + brightnessSlider.value)
    // })

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

    //for HgNe Lamp
    // var HgNeOFF = document.getElementById('HgNeLampOFF');
    // var HgNeON = document.getElementById('HgNeLampON');
    var HgNeTOGGLE = document.getElementById('HgNeTOGGLE');
    HgNeTOGGLE.style.transform='scaleY(1)';
    var HgNeState = false;


    //for Ambient Light
    // var ambientOFF = document.getElementById('ambientOFF');
    // var ambientON = document.getElementById('ambientON');
    var ambientTOGGLE = document.getElementById('ambientTOGGLE');
    ambientTOGGLE.style.transform='scaleY(1)';
    var ambientState = false;

    //for Potentiometer
    var leftPot = document.getElementById('leftPot');
    var rightPot = document.getElementById('rightPot');
    var threeDegree = document.getElementById('3.6_degree');
    var thirtySixDegree = document.getElementById('36_degree');
    var threeSixtyDegree = document.getElementById('360_degree');
    var potSteps=23;
  
    //BEGIN Light Switches 
    // HgNeOFF.addEventListener('click', function(){
    //     console.log("HgNe lamp switch was switched OFF");
    //     if(HgNeState){
    //         toggleSwitch.style.transform='scaleY(-1)';
    //         dataChannel.send("HgNeLamp/state/OFF");
    //         HgNeState=false;
    //                  }
    // })
    // HgNeON.addEventListener('click', function(){
    //     console.log("HgNe lamp switch was switched ON");
    //     if(!HgNeState){
    //         toggleSwitch.style.transform='scaleY(1)';
    //         dataChannel.send("HgNeLamp/state/ON");
    //         HgNeState=true;
    //                  }
    // })
    // ambientOFF.addEventListener('click', function(){
    //     console.log("Ambient light was switched OFF");
    //     if(ambientState){
    //         lightSwitch.style.transform='rotate(0deg)';
    //         dataChannel.send("ambientLight/state/OFF");
    //         ambientState=false;
    //                  }
    // })
    // ambientON.addEventListener('click', function(){
    //     console.log("Ambient light was switched ON");
    //     if(!ambientState){
    //         lightSwitch.style.transform='rotate(180deg)';
    //         dataChannel.send("ambientLight/state/ON");
    //         ambientState=true;
    //                  }
    // })
    ambientTOGGLE.addEventListener('click', function(){
        console.log("Ambient light was switched");
        if(ambientState){
            // dataChannel.send("ambientLight/state/OFF");
            dataChannel.send("PEpdu/off/5")
            ambientState=false;
            ambientTOGGLE.title="Click here to turn ON";
            lightSwitch.style.transform='rotate(0deg)';
                     }
        else{
            // dataChannel.send("ambientLight/state/ON");
            dataChannel.send("PEpdu/on/5");
            ambientState=true;
            ambientTOGGLE.title="Click here to turn OFF";
            lightSwitch.style.transform='rotate(180deg)';
        }
    })
    HgNeTOGGLE.addEventListener('click', function(){
        console.log("HgNe lamp was switched");
        if(HgNeState){
            dataChannel.send("PEpdu/off/6");
            HgNeState=false;
            HgNeTOGGLE.title="Click here to turn ON";
            toggleSwitch.style.transform='scaleY(1)';
                     }
        else{
            dataChannel.send("PEpdu/on/6");
            HgNeState=true;
            HgNeTOGGLE.title="Click here to turn OFF";
            toggleSwitch.style.transform='scaleY(-1)';
        }
    })
    // END Light Switches
   
    var ElectrometerState=false;
    var MultimeterState=false;

 //BEGIN Potentiometer Buttons 
    threeDegree.addEventListener('click', function(){
        potSteps=2;
    })
    thirtySixDegree.addEventListener('click', function(){
        potSteps=21;
    })
    threeSixtyDegree.addEventListener('click', function(){
        potSteps=210;
    })

    leftPot.addEventListener('click', function() {
        console.log("leftPot was clicked");
        dataChannel.send("Pot/move/"+(-potSteps));
    })

    rightPot.addEventListener('click', function() {
        console.log("rightPot was clicked");
        dataChannel.send("Pot/move/"+potSteps);
    })
//END Potentiometer Buttons

//BEGIN Filter Wheel Buttons 
    function calculateWheelSteps(currentPosition, desiredPosition) {
        //Math to be implimented
        let motorSteps = 0;
        motorSteps = (desiredPosition - currentPosition) * stepsPerDegree;
        //Last thing to do:
        currentPosition = desiredPosition;
        return motorSteps
    }   
    // f577.addEventListener('click', function(event) {
    //     event.stopPropagation();
    //     motoreSteps = calculateFilterSteps(currentPosition, 0);
    //     if (motorSteps!=0) {
    //         dataChannel.send("Wheel/move/"+motorSteps);
    //         filterwheel.style.transform='rotate(0deg)';
    //     }
    //     return false
    // })
    f577.addEventListener('click', function(event) {
        console.log("f577 was clicked");
        event.stopPropagation();
        dataChannel.send("Wheel/goto/180deg");
        // filterwheel.style.transform='rotate(0deg)';
        return false
    })
    f546.addEventListener('click', function(event) {
        console.log("f546 was clicked");
        event.stopPropagation();
        dataChannel.send("Wheel/goto/120deg");
        // filterwheel.style.transform='rotate(-30deg)';
        return false
    })
    f436.addEventListener('click', function(event) {
        console.log("f436 was clicked");
        event.stopPropagation();
        dataChannel.send("Wheel/goto/60deg");
        // filterwheel.style.transform='rotate(-60deg)';
        return false
    })
    f365.addEventListener('click', function(event) {
        console.log("f365 was clicked");
        event.stopPropagation();
        dataChannel.send("Wheel/goto/0deg");
        // filterwheel.style.transform='rotate(-90deg)';
        return false
    })
//END Filter Wheel Buttons
    
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
            dataChannel.send("PEpdu/off/1");
            ElectrometerState=false;
                     }
        else{
            dataChannel.send("PEpdu/on/1");
            ElectrometerState=true;
        }
    })
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

//BEGIN Keithley 2000 Multimeter Buttons
    shift2000Button.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Multimeter/press/SYST:KEY 1");
        return false
    })
    local2000Button.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Multimeter/press/SYST:LOC");
        return false
    })
    power2000Button.addEventListener('click', function(){
        console.log("Multimeter was switched");
        if(MultimeterState){
            dataChannel.send("PEpdu/off/2");
            MultimeterState=false;
                     }
        else{
            dataChannel.send("PEpdu/on/2");
            MultimeterState=true;
        }
    })
    dcVoltageButton.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Multimeter/press/SYST:KEY 2");
        return false
    })
    acVoltageButton.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Multimeter/press/SYST:KEY 3");
        return false
    })
    dcCurrentButton.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Multimeter/press/SYST:KEY 4");
        return false
    })
    acCurrentButton.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Multimeter/press/SYST:KEY 5");
        return false
    })
    TWOwireResistanceButton.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Multimeter/press/SYST:KEY 6");
        return false
    })
    FOURwireResistanceButton.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Multimeter/press/SYST:KEY 7");
        return false
    })
    frequencyButton.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Multimeter/press/SYST:KEY 8");
        return false
    })
    temperatureButton.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Multimeter/press/SYST:KEY 16");
        return false
    })
    externalTriggerButton.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Multimeter/press/SYST:KEY 18");
        return false
    })
    trigger2000Button.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Multimeter/press/SYST:KEY 19");
        return false
    })
    store2000Button.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Multimeter/press/SYST:KEY 20");
        return false
    })
    recall2000Button.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Multimeter/press/SYST:KEY 21");
        return false
    })
    filterButton.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Multimeter/press/SYST:KEY 22");
        return false
    })
    relativeButton.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Multimeter/press/SYST:KEY 23");
        return false
    })
    cursorLeft2000Button.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Multimeter/press/SYST:KEY 24");
        return false
    })
    cursorRight2000Button.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Multimeter/press/SYST:KEY 15");
        return false
    })
    openButton.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Multimeter/press/SYST:KEY 26");
        return false
    })
    closeButton.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Multimeter/press/SYST:KEY 27");
        return false
    })
    stepButton.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Multimeter/press/SYST:KEY 28");
        return false
    })
    scanButton.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Multimeter/press/SYST:KEY 29");
        return false
    })
    digits2000Button.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Multimeter/press/SYST:KEY 30");
        return false
    })
    rate2000Button.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Multimeter/press/SYST:KEY 31");
        return false
    })
    exit2000Button.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Multimeter/press/SYST:KEY 32");
        return false
    })
    enter2000Button.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Multimeter/press/SYST:KEY 14");
        return false
    })
    upRange2000Button.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Multimeter/press/SYST:KEY 11");
        return false
    })
    downRange2000Button.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Multimeter/press/SYST:KEY 13");
        return false
    })
    autoRange2000Button.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Multimeter/press/SYST:KEY 12");
        return false
    })
//END Keithley 2000 Multimeter Buttons

});

window.addEventListener('beforeunload', function(e) {
    dataChannel.close();
})
    
// function select_remote_hw_vcodec() {
//     document.getElementById('remote_hw_vcodec').checked = true;
//     var vformat = document.getElementById('remote_vformat').value;
//     switch (vformat) {
//         case '5':
//             document.getElementById('remote-video').style.width = "320px";
//             document.getElementById('remote-video').style.height = "240px";
//             break;
//         case '10':
//             document.getElementById('remote-video').style.width = "320px";
//             document.getElementById('remote-video').style.height = "240px";
//             break;
//         case '20':
//             document.getElementById('remote-video').style.width = "352px";
//             document.getElementById('remote-video').style.height = "288px";
//             break;
//         case '25':
//             document.getElementById('remote-video').style.width = "640px";
//             document.getElementById('remote-video').style.height = "480px";
//             break;
//         case '30':
//             document.getElementById('remote-video').style.width = "640px";
//             document.getElementById('remote-video').style.height = "480px";
//             break;
//         case '35':
//             document.getElementById('remote-video').style.width = "800px";
//             document.getElementById('remote-video').style.height = "480px";
//             break;
//         case '40':
//             document.getElementById('remote-video').style.width = "960px";
//             document.getElementById('remote-video').style.height = "720px";
//             break;
//         case '50':
//             document.getElementById('remote-video').style.width = "1024px";
//             document.getElementById('remote-video').style.height = "768px";
//             break;
//         case '55':
//             document.getElementById('remote-video').style.width = "1280px";
//             document.getElementById('remote-video').style.height = "720px";
//             break;
//         case '60':
//             document.getElementById('remote-video').style.width = "1280px";
//             document.getElementById('remote-video').style.height = "720px";
//             break;
//         case '63':
//             document.getElementById('remote-video').style.width = "1280px";
//             document.getElementById('remote-video').style.height = "720px";
//             break;
//         case '65':
//             document.getElementById('remote-video').style.width = "1280px";
//             document.getElementById('remote-video').style.height = "768px";
//             break;
//         case '70':
//             document.getElementById('remote-video').style.width = "1280px";
//             document.getElementById('remote-video').style.height = "768px";
//             break;
//         case '75':
//             document.getElementById('remote-video').style.width = "1536px";
//             document.getElementById('remote-video').style.height = "768px";
//             break;
//         case '80':
//             document.getElementById('remote-video').style.width = "1280px";
//             document.getElementById('remote-video').style.height = "960px";
//             break;
//         case '90':
//             document.getElementById('remote-video').style.width = "1600px";
//             document.getElementById('remote-video').style.height = "768px";
//             break;
//         case '95':
//             document.getElementById('remote-video').style.width = "1640px";
//             document.getElementById('remote-video').style.height = "1232px";
//             break;
//         case '97':
//             document.getElementById('remote-video').style.width = "1640px";
//             document.getElementById('remote-video').style.height = "1232px";
//             break;
//         case '98':
//             document.getElementById('remote-video').style.width = "1792px";
//             document.getElementById('remote-video').style.height = "896px";
//             break;
//         case '99':
//             document.getElementById('remote-video').style.width = "1792px";
//             document.getElementById('remote-video').style.height = "896px";
//             break;
//         case '100':
//             document.getElementById('remote-video').style.width = "1920px";
//             document.getElementById('remote-video').style.height = "1080px";
//             break;
//         case '105':
//             document.getElementById('remote-video').style.width = "1920px";
//             document.getElementById('remote-video').style.height = "1080px";
//             break;
//         default:
//             document.getElementById('remote-video').style.width = "1280px";
//             document.getElementById('remote-video').style.height = "720px";
//     }