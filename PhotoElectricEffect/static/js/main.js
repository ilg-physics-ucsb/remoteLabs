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

// This functions runs when the websocket is closed.
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


// This deals with messages the pi sends back to the client (e.g., when a device reaches its limit. )
function controllerResponseHandler(cmd) {
    var components = cmd.split("/");
    var device = components[0]
    var info = components[1]
    var infoValue = components[2]

    if (infoValue == "limit") {
        extremaModal.modal("show")
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

// This code declares some variables
var extremaModal, contactModal, bootModal

// This function waits until everything is loaded, then runs
window.addEventListener('DOMContentLoaded', function () {
    var isStreaming = false;
    var isStreaming2 = false;
    var stepPerDegree= 0.5; //This value is set by finalized mechanical arrangements.
    var currentPosition = 0;
    extremaModal = $("#extremaModal")
    contactModal = $("#contactModal")
    bootModal = $("#bootModal")
    var start = document.getElementById('start');
    var stop = document.getElementById('stop');
    var video = document.getElementById('v');
    var timeLimit = 3 * 60 * 60 ;  // This value sets the starting time of the countdown timer (to 3 hours in sec)

    window.setTimeout(timeOutHandler,timeLimit*1000) // This function passes the time limit to the function below (in msec), which alerts the user when their time is up.

    function timeOutHandler(){
        // mainCamSignal.hangup()
        alert("Your session has timed out.")
    }

// This function displays the time remaining
    function startTimer(duration, display) {
        var timer = duration, hours, minutes, seconds;
        setInterval(function () {
            hours = Math.floor(parseInt(timer / 3600, 10));
            minutes = Math.floor(parseInt(timer % 3600 / 60 , 10));
            seconds = Math.floor(parseInt(timer % 3600 % 60, 10));
    
            // hours = hours <10 ? "0" + hours : hours;
            minutes = minutes < 10 ? "0" + minutes : minutes;
            seconds = seconds < 10 ? "0" + seconds : seconds;
    
            display.textContent = hours + ":" + minutes + ":" + seconds;
    
            if (--timer < 0) {
                timer = duration;
            }
        }, 1000);
    }

 // This function calls the time remaining display once the window is fully loaded
    window.onload = function () {
            display = document.querySelector('#time');
        startTimer(timeLimit, display);
    }

    // SIDEBAR
    const manualsButton = document.getElementById('manuals');
    const sidebar = this.document.getElementById('sidebar');
    const closeSidebar = this.document.getElementById('sidebar-close');
    manualsButton.addEventListener('click', () => {
        sidebar.classList.add('active');
    })

    closeSidebar.addEventListener('click', () => {
        sidebar.classList.remove('active');
    })

    // RESIZING
    const livestreamContainer = document.querySelector(".livestream-resizable");
    const toolContainer = document.querySelector(".tool-resizable");
    const container = document.querySelector('.livestream-and-tool-section');

    // TOOL RENDERING
    let toolClicked = false;
    const message = document.getElementById("click-on-tool-message");
    const close = document.getElementById("close");

    const tools = document.getElementsByClassName('tool-item');


    // TOOL DATA TO DISPLAY. Array name: toolData
    // Includes:
    // (1) name
    // (2) description of tool
    // (3) width of image displayed in tool bar
    // (4) direction detailing how to use the tool
    // (5) render function, which includes:
    //      (a) innerHTML of tool area changed to display information about the tool,
    //      (b) clicking logic for tool
    const toolDetailArea = document.getElementById('tool-detail-content');
    const toolData = {
        hgNeLamp: {
            name: 'Hg-Ne Lamp',
            description: "The Hg-Ne Lamp provides the light that will eject electrons from the metal. Mercury is an ideal light source for this purpose because it emits a lot of light, but only in a small number of wavelengths.",
            // toolImage: "static/imgs/transparent-imgs/penray-lamp.png",
            width: 172,
            toolDirection: "Click to toggle the lamp!",
            render: () => {
                const target = document.getElementById("tool-interactive-area");
                if (target) {
                    target.innerHTML = `
                    <figure class="Icon">
                        <img id="toggleSwitch" src="static/imgs/figma-components/hgne-off.png" usemap="#image-map-ts">
                        <map name="image-map-ts">
                            <area id="HgNeTOGGLE" target="" alt="" title="" href="" coords="1,-1,123,155" shape="rect">
                        </map> 
                        <br>       
                    </figure>`;
                }
                console.log("Rendered lamp interactive area!");
                var HgNeTOGGLE = document.getElementById('HgNeTOGGLE');
                var toggleSwitch = this.document.getElementById("toggleSwitch");
                HgNeTOGGLE.style.transform='scaleY(1)';
                var HgNeState = false;

                // TOOL OPERATION
                HgNeTOGGLE.addEventListener('click', function(event){
                    event.preventDefault();
                    event.stopPropagation();
                    console.log("HgNe lamp was switched");
                    if (HgNeState) {
                        dataChannel.send("PEpdu/off/HgNeLamp");
                        HgNeState=false;
                        HgNeTOGGLE.title="Click here to turn ON";
                        // toggleSwitch.style.transform='scaleY(1)';
                        toggleSwitch.src = "static/imgs/figma-components/hgne-off.png"
                    }
                    else {
                        dataChannel.send("PEpdu/on/HgNeLamp");
                        HgNeState=true;
                        HgNeTOGGLE.title="Click here to turn OFF";
                        // toggleSwitch.style.transform='scaleY(-1)';
                        toggleSwitch.src = "static/imgs/figma-components/hgne-on.png"
                    }
                })

            }
        },
        filterWheel: {
            name: 'Edumund Optics® Bandpass Interference Filters',
            description: "An interference filter transmits light only in a narrow range of wavelengths, λ±Δλ, and blocks light of all other wavelengths. Placing different interference filters in front of the Hg-discharge lamp allows photons from only one (or occasionally two) of the peaks in the Hg emission spectrum to fall on the photocathode.",
            width: 84,
            toolDirection: "Click on a filter to rotate it into position.",
            render: () => {
                const target = document.getElementById("tool-interactive-area");
                if (target) {
                    target.innerHTML = `
                       <svg viewBox="0 0 622 685" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <pattern id="pattern0_645_1186" patternUnits="userSpaceOnUse" width="622" height="685">
                                    <image href="static/imgs/FilterWheelScaled.png"  />
                                </pattern>
                            </defs>
                            <g id="ColorWheelMap">
                                <rect id="FilterWheelScaledPNG" width="622" height="685" fill="url(#pattern0_645_1186)" />
                                <circle class="map-button" id="f365" title="365 nm" cx="307" cy="110" r="69.5" stroke="black" />
                                <circle class="map-button" id="f436" title="436 nm" cx="504" cy="227" r="68.5" stroke="black" />
                                <circle class="map-button" id="f546" title="546 nm" cx="507" cy="455" r="68.5" stroke="black" />
                                <circle class="map-button" id="f577" title="577 nm" cx="311" cy="567.5" r="72" stroke="black" />
                            </g>
                        </svg>
                   `;
                }
  
                var f365 = document.getElementById('f365');
                var f436 = document.getElementById('f436');
                var f546 = document.getElementById('f546');
                var f577 = document.getElementById('f577');
                var colorFilterwheel = document.getElementById('colorFilterWheel')

                f577.addEventListener('click', function(event) {
                    console.log("f577 was clicked");
                    event.stopPropagation();
                    dataChannel.send("colorWheel/goto/180deg");
                    // filterwheel.style.transform='rotate(0deg)';
                    return false
                })
                f546.addEventListener('click', function(event) {
                    console.log("f546 was clicked");
                    event.stopPropagation();
                    dataChannel.send("colorWheel/goto/120deg");
                    // filterwheel.style.transform='rotate(-30deg)';
                    return false
                })
                f436.addEventListener('click', function(event) {
                    console.log("f436 was clicked");
                    event.stopPropagation();
                    dataChannel.send("colorWheel/goto/60deg");
                    // filterwheel.style.transform='rotate(-60deg)';
                    return false
                })
                f365.addEventListener('click', function(event) {
                    console.log("f365 was clicked");
                    event.stopPropagation();
                    dataChannel.send("colorWheel/goto/0deg");
                    // filterwheel.style.transform='rotate(-90deg)';
                    return false
                })  
            }
        },
        densityFilterWheel: { 
            name: 'ThorLabs® Absorptive Neutral Density Filters',
            description: "A neutral density (ND) filter attenuates light uniformly across a wide range of wavelengths. Placing different ND filters in front of the Hg-discharge lamp changes the intensity of the light (i.e., the number of photons per unit area) that falls on the photocathode.",
            width: 84,
            toolDirection: "Click on a filter to rotate it into position.",
            render: () => {
                const target = document.getElementById("tool-interactive-area");
                if (target) {
                    target.innerHTML = `
                        <svg viewBox="0 0 622 685" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <pattern id="pattern0_645_1186" patternUnits="userSpaceOnUse" width="622" height="685">
                                    <image href="static/imgs/densityFilterWheelScaledCropped.png"  />
                                </pattern>
                            </defs>
                            <g id="ColorWheelMap">
                                <rect id="densityFilterWheel" width="622" height="685" fill="url(#pattern0_645_1186)" />
                                <circle class="map-button" id="nd00" title="OPEN"   cx="312" cy="122" r="67" stroke="black" />
                                <circle class="map-button" id="nd03" title="ND 0.3" cx="496" cy="235" r="67" stroke="black" />
                                <circle class="map-button" id="nd05" title="ND 0.5" cx="496" cy="448" r="65" stroke="black" />
                                <circle class="map-button" id="nd10" title="ND 1.0" cx="312" cy="558" r="68" stroke="black" />
                                <circle class="map-button" id="nd20" title="ND 2.0" cx="139" cy="442" r="70" stroke="black" />
                                <circle class="map-button" id="nd40" title="ND 4.0" cx="140" cy="240" r="74" stroke="black" />
                            </g>
                        </svg>
                    `;
                }

                var nd00 = document.getElementById('nd00');
                var nd03 = document.getElementById('nd03');
                var nd05 = document.getElementById('nd05');
                var nd10 = document.getElementById('nd10');
                var nd20 = document.getElementById('nd20');
                var nd40 = document.getElementById('nd40');
                var densityFilterwheel = document.getElementById('densityFilterWheel')

                nd00.addEventListener('click', function(event) {
                    console.log("ND OPEN was clicked");
                    event.stopPropagation();
                    dataChannel.send("densityWheel/goto/0deg");
                    // filterwheel.style.transform='rotate(0deg)';
                    return false
                })
                nd03.addEventListener('click', function(event) {
                    console.log("ND 0.3 was clicked");
                    event.stopPropagation();
                    dataChannel.send("densityWheel/goto/300deg");
                    // filterwheel.style.transform='rotate(-30deg)';
                    return false
                })
                nd05.addEventListener('click', function(event) {
                    console.log("ND 0.5 was clicked");
                    event.stopPropagation();
                    dataChannel.send("densityWheel/goto/240deg");
                    // filterwheel.style.transform='rotate(-60deg)';
                    return false
                })
                nd10.addEventListener('click', function(event) {
                    console.log("ND 1.0 was clicked");
                    event.stopPropagation();
                    dataChannel.send("densityWheel/goto/180deg");
                    // filterwheel.style.transform='rotate(-90deg)';
                    return false
                })
                nd20.addEventListener('click', function(event) {
                    console.log("ND 2.0 was clicked");
                    event.stopPropagation();
                    dataChannel.send("densityWheel/goto/120deg");
                    // filterwheel.style.transform='rotate(-90deg)';
                    return false
                })
                nd40.addEventListener('click', function(event) {
                    console.log("ND 4.0 was clicked");
                    event.stopPropagation();
                    dataChannel.send("densityWheel/goto/60deg");
                    // filterwheel.style.transform='rotate(-90deg)';
                    return false
                })
            }
        },
        electrometer: {
            name: 'Keithley Model 6514 System Electrometer',
            description: "The electrometer measures the photocurrent. The electrometer is an especially sophisticated instrument that can reliably detect fractions of a picoamp. (1pA = 10^−12 A)",
            width: 224,
            toolDirection: "Click a button on the image below to press it on the device.",
            render: () => {
                const target = document.getElementById("tool-interactive-area");
                if (target) {
                    target.innerHTML = `
                        <figure class="Device embed">
                        <img id="electrometer" src="static/imgs/Keithley6514ElectrometerTXTleft.jpg" usemap="#image-map-6514"> 
                            <map name="image-map-6514">
                                <area id="Shift6514" 		    href="#"	title="Shift" 		  coords="102,331,17" shape="circle">
                                <area id="Local6514" 		    href="#"	title="Local" 		  coords="102,399,17" shape="circle">
                                <area id="Power6514" 		    href="#"	title="Power" 		  coords="99,479,17" shape="circle">
                                <area id="Voltage" 		      href="#"	title="Voltage" 		coords="200,331,29" shape="circle">
                                <area id="Current" 		      href="#"	title="Current" 		coords="285,331,29" shape="circle">
                                <area id="Resistance" 	    href="#"	title="Resistance"  coords="381,331,29" shape="circle">
                                <area id="Charge" 		      href="#"	title="Charge" 		  coords="466,331,29" shape="circle">
                                <area id="ExternalFeedback" href="#"	title="ExternalFeedback" coords="562,331,29" shape="circle">
                                <area id="ZeroCheck" 		    href="#"	title="ZeroCheck" 	coords="647,331,29" shape="circle">
                                <area id="ZeroCorrect" 	    href="#"	title="ZeroCorrect" coords="743,331,29" shape="circle">
                                <area id="Ground" 		      href="#"	title="Ground" 		  coords="828,331,29" shape="circle">
                                <area id="Average" 		      href="#"	title="Average" 		coords="166,428,238,393" shape="rect">
                                <area id="Median" 		      href="#"	title="Median" 		  coords="242,393,316,428" shape="rect">
                                <area id="Relative" 		    href="#"	title="Relative" 	  coords="420,393,346,428" shape="rect">
                                <area id="Limit" 		        href="#"	title="Limit" 		  coords="423,393,499,428" shape="rect">
                                <area id="Digits6514" 	    href="#"	title="Digits"      coords="603,393,529,428" shape="rect">
                                <area id="Rate6514" 		    href="#"	title="Rate" 		    coords="606,393,678,428" shape="rect">
                                <area id="CursorLeft6514" 	href="#"	title="CursorLeft"  coords="786,393,712,428" shape="rect">
                                <area id="CursorRight6514" 	href="#"	title="CursorRight" coords="789,393,859,428" shape="rect">
                                <area id="Store6514" 		    href="#" title="Store" 		  coords="238,460,163,496" shape="rect">
                                <area id="Recall6514"		    href="#"	title="Recall" 		  coords="242,460,314,496" shape="rect">
                                <area id="Delay" 		        href="#"	title="Delay" 		  coords="420,460,346,496" shape="rect">
                                <area id="Damping" 		      href="#"	title="Damping" 		coords="423,460,495,496" shape="rect">
                                <area id="Halt" 		        href="#"	title="Halt" 		    coords="603,460,529,497" shape="rect">
                                <area id="Trigger6514" 	    href="#"	title="Trigger" 		coords="606,460,678,497" shape="rect">
                                <area id="Exit6514" 		    href="#"	title="Exit" 			  coords="786,460,712,498" shape="rect">
                                <area id="Enter6514" 		    href="#"	title="Enter" 		  coords="789,460,863,498" shape="rect">
                                <area id="UpRange6514" 	    href="#"	title="UpRange" 		coords="957,301,935,336,976,338" shape="poly">
                                <area id="DownRange6514" 	  href="#"	title="DownRange" 	coords="957,498,978,461,935,461" shape="poly">
                                <area id="AutoRange6514"	  href="#"	title="AutoRange" 	coords="908,381,1007,418" shape="rect">
                            </map>
                        </figure>                    
                    `;
                    $('#electrometer').mapster({
                        mapKey:'id',
                        fillColor: 'f5f5b5',
                        fillOpacity: 0.6,
                        render_select: { 
                            fillOpacity: 0.3
                        },
                        singleSelect: true
                    }).parent().css({"margin":"0 auto"});
                }
                
                var shift6514Button = this.document.getElementById('Shift6514');
                var local6514Button = this.document.getElementById('Local6514');
                var power6514Button = this.document.getElementById('Power6514');
                var voltageButton = this.document.getElementById('Voltage');
                var currentButton = this.document.getElementById('Current');
                var resistanceButton = this.document.getElementById('Resistance');
                var chargeButton = this.document.getElementById('Charge');
                var externalFeedbackButton = this.document.getElementById('ExternalFeedback');
                var zeroCheckButton = this.document.getElementById('ZeroCheck');
                var zeroCorrectButton = this.document.getElementById('ZeroCorrect');
                var groundButton = this.document.getElementById('Ground');
                var averageButton = this.document.getElementById('Average');
                var medianButton = this.document.getElementById('Median');
                var relativeButton = this.document.getElementById('Relative');
                var limitButton = this.document.getElementById('Limit');
                var digits6514Button = this.document.getElementById('Digits6514');
                var rate6514Button = this.document.getElementById('Rate6514');
                var cursorLeft6514Button = this.document.getElementById('CursorLeft6514');
                var cursorRight6514Button = this.document.getElementById('CursorRight6514');
                var store6514Button = this.document.getElementById('Store6514');
                var recall6514Button = this.document.getElementById('Recall6514');
                var delayButton = this.document.getElementById('Delay');
                var dampingButton = this.document.getElementById('Damping');
                var haltButton = this.document.getElementById('Halt');
                var trigger6514Button = this.document.getElementById('Trigger6514');
                var exit6514Button = this.document.getElementById('Exit6514');
                var enter6514Button = this.document.getElementById('Enter6514');
                var upRange6514Button = this.document.getElementById('UpRange6514');
                var downRange6514Button = this.document.getElementById('DownRange6514');
                var autoRange6514Button = this.document.getElementById('AutoRange6514');                
                var electrometer = document.getElementById('electrometer')

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
                        dataChannel.send("PEpdu/off/Electrometer");
                        ElectrometerState=false;
                                }
                    else{
                        dataChannel.send("PEpdu/on/Electrometer");
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

            }    
        },
        multimeter: {
            name: 'Keithley Model 2000 Multimeter User',
            description: "This digital multimeter (DMM) measures the potential difference between the photocathode and the anode.",
            width: 224,
            toolDirection: "Click a button on the image below to press it on the device.",
            render: () => {
                const target = document.getElementById("tool-interactive-area");
                if (target) {
                    target.innerHTML = `
                        <figure class="Device embed">
                        <img id="multimeter" src="static/imgs/Keithley2000MultimeterTXTleft.jpg" usemap="#image-map-2000"> 
                            <map name="image-map-2000">
                                <area id="Shift2000" 		    href="#"	title="Shift" 		  coords="102,331,17" shape="circle">
                                <area id="Local2000" 		    href="#"	title="Local" 		  coords="102,399,17" shape="circle">
                                <area id="Power2000" 		    href="#"	title="Power" 		  coords="99,479,17" shape="circle">
                                <area id="DCvoltage" 		    href="#"	title="DCvoltage" 	coords="200,331,29" shape="circle">
                                <area id="ACvoltage" 		    href="#"	title="ACvoltage" 	coords="285,331,29" shape="circle">
                                <area id="DCcurrent" 		    href="#"	title="DCcurrent" 	coords="381,331,29" shape="circle">
                                <area id="ACcurrent" 		    href="#"	title="ACcurrent" 	coords="466,331,29" shape="circle">
                                <area id="2wireResistance"  href="#"	title="2wireResistance"coords="562,331,29" shape="circle">
                                <area id="4wireResistance" 	href="#"	title="4wireResistance"coords="647,331,29" shape="circle">
                                <area id="Frequency" 		    href="#"	title="Frequency" 	coords="743,331,29" shape="circle">
                                <area id="Temperature" 		  href="#"	title="Temperature" coords="828,331,29" shape="circle">
                                <area id="ExternalTrigger" 	href="#"	title="ExternalTrigger"coords="166,428,238,393" shape="rect">
                                <area id="Trigger2000" 		  href="#"	title="Trigger" 		coords="242,393,316,428" shape="rect">
                                <area id="Store2000" 		    href="#"	title="Store" 	  	coords="420,393,346,428" shape="rect">
                                <area id="Recall2000" 		  href="#"	title="Recall" 		  coords="423,393,499,428" shape="rect">
                                <area id="Filter" 		      href="#"	title="Filter" 		  coords="603,393,529,428" shape="rect">
                                <area id="Relative" 		    href="#"	title="Relative" 		coords="606,393,678,428" shape="rect">
                                <area id="CursorLeft2000" 	href="#"	title="CursorLeft" 	coords="786,393,712,428" shape="rect">
                                <area id="CursorRight2000" 	href="#"	title="CursorRight" coords="789,393,859,428" shape="rect">
                                <area id="Open" 		        href="#"	title="Open" 		    coords="238,460,163,496" shape="rect">
                                <area id="Close" 		        href="#"	title="Close" 		  coords="242,460,314,496" shape="rect">
                                <area id="Step" 		        href="#"	title="Step" 		    coords="420,460,346,496" shape="rect">
                                <area id="Scan" 		        href="#"	title="Scan" 		    coords="423,460,495,496" shape="rect">
                                <area id="Digits2000" 		  href="#"	title="Digits" 		  coords="603,460,529,497" shape="rect">
                                <area id="Rate2000" 		    href="#"	title="Rate" 		    coords="606,460,678,497" shape="rect">
                                <area id="Exit2000" 		    href="#"	title="Exit" 			  coords="786,460,712,498" shape="rect">
                                <area id="Enter2000" 		    href="#"	title="Enter" 		  coords="789,460,863,498" shape="rect">
                                <area id="UpRange2000" 		  href="#"	title="UpRange" 		coords="957,301,935,336,976,338" shape="poly">
                                <area id="DownRange2000" 		href="#"	title="DownRange" 	coords="957,498,978,461,935,461" shape="poly">
                                <area id="AutoRange2000" 		href="#"	title="AutoRange" 	coords="908,381,1007,418" shape="rect">
                            </map>
                        </figure>                    
                    `;
                    $('#multimeter').mapster({
                        mapKey:'id',
                        fillColor: 'f5f5b5',
                        fillOpacity: 0.6,
                        render_select: { 
                            fillOpacity: 0.3
                        },
                        singleSelect: true
                    }).parent().css({"margin":"0 auto"});
                }
                
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
                var multimeter = document.getElementById('multimeter')

                
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
                        dataChannel.send("PEpdu/off/Multimeter");
                        MultimeterState=false;
                                }
                    else{
                        dataChannel.send("PEpdu/on/Multimeter");
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

            }    
        },
        knob: {
            name: 'Potentiometer',
            description: "The voltage is adjusted by turning the knob of a variable resistor (also known as a potentiometer).",
            width: 72,
            toolDirection: "Choose a radio button to select the amount of rotation per click.   Click an arrow to rotate the knob in that direction. ",
            render: () => {
                const target = document.getElementById("tool-interactive-area");
                if (target) {
                   // target.innerHTML = 
                   insertSvg(target,"static/svg/KnobMap.html")
                }

                console.log("Rendered potentiometer interactive area!");
                var leftPot = document.getElementById('turnLeft');
                var rightPot = document.getElementById('turnRight');
                var threeDegree = document.getElementById('3.6_degree');
                var thirtySixDegree = document.getElementById('36_degree');
                var threeSixtyDegree = document.getElementById('360_degree');
                var potSteps=200;
                var knob = this.document.getElementById('knob')
            

                // TOOL OPERATION
                threeDegree.addEventListener('click', function(){
                    potSteps=2;
                })
                thirtySixDegree.addEventListener('click', function(){
                    potSteps=20;
                })
                threeSixtyDegree.addEventListener('click', function(){
                    potSteps=200;
                })

                leftPot.addEventListener('click', function() {
                    console.log("leftPot was clicked");
                    dataChannel.send("Pot/move/"+(-potSteps));
                })

                rightPot.addEventListener('click', function() {
                    console.log("rightPot was clicked");
                    dataChannel.send("Pot/move/"+potSteps);
                })

            }
        }
    }


    let selectedTool = null;

    // Iterates through each tool and adds an event listener to it.
    // Styles tool when user clicks on it.
    Array.from(tools).forEach(tool => {
        tool.addEventListener('click', () => {
            toolClicked = true;
            selectedTool = tool.dataset.tool; // returns name of the tool
            document.querySelector('.background')?.classList.remove('background');
            tool.classList.add('background');
            updateUI(); // Called when the user clicks on a tool
        })
    })

    // Close button for tool window
    close.addEventListener('click', () => {
        toolClicked = false;
        updateUI();
    })

    let resizeTool = null;

    // Function gets called AFTER event changes state. Actions:
    // (1) Styles tool container
    // (2) Displays resize tool
    // (3) Inserts resize tool
    function updateUI() {
        if (toolClicked) {
            // Make tool container visible
            toolContainer.style.backgroundColor = "#404040";
            message.style.display= 'none';
            close.style.display = 'block';
            close.innerHTML = '&times;'

            // Add resize tool to adjust window size of livestream and tool containers
            if (!resizeTool) {
                resizeTool = document.createElement('div');
                resizeTool.id = 'splitter-resizer';
                // Resize element visual
                resizeTool.style.cssText = `
                    border-left: 6px solid #969696;
                    height: 70px;
                    width: 3px;
                    border-radius: 3px;
                    cursor: ew-resize;
                `;
            }
            container.insertBefore(resizeTool, toolContainer);
            attachResizeListeners(resizeTool);

            resizeTool.style.display = 'block';


            // Display data for that tool
            if (selectedTool && toolData[selectedTool]) {
                const currTool = toolData[selectedTool];
                // HTML FOR TOOL INFORMATION AREA
                toolDetailArea.innerHTML = `
                    <div style="
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    align-items: center;
                    padding: 25px;"
                    gap: 32px
                    >
                        <h4>${currTool.name}</h4>
                        <div>
                            <p style="font-weight: bold;">Description</p>
                            <p>${currTool.description}</p>
                        </div>
                        <div style="
                            display: flex;
                            flex-direction: column;
                            justify-content: center;
                            align-items: center
                        ">
                            <p style="font-weight: bold;">Use tool</p>
                            <div>

                            </div>
                            <p>${currTool.toolDirection}</p>
                        </div>

                        <div id="tool-interactive-area"></div>
                    </div>
                `;

                currTool.render?.();
            }


        } else { // If no tool has been clicked
            toolContainer.style.background = 'none';
            document.querySelector('.background')?.classList.remove('background');
            message.style.display = 'block';
            message.innerHTML= 'Click on a tool below!';
            close.style.display = 'none';

            // Remove resize tool
            if (resizeTool) {
                resizeTool.style.display = 'none';
            }

            document.getElementById("tool-detail-content").innerHTML = '';
        }
    }

// Image Map code

    const buttons = document.querySelectorAll('.map-button');
    let selected = null;

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            if (selected) {
                selected.classList.remove('selected');
            }
            button.classList.add('selected');
            selected = button;
        });
    });

    function insertSvg(target, svgPath) {
        fetch(svgPath)
            .then(response => response.text())
            .then(svgText => {
                target.innerHTML = svgText;
        });
    }


    // RESIZE LOGIC
    function attachResizeListeners(resizeTool) {
        let isResizing = false;

        resizeTool.addEventListener('mousedown', (e) => {
            isResizing = true;
            document.body.style.cursor = 'ew-resize';
        })

        document.addEventListener('mousemove', function(e) {
            if (!isResizing) return;

            const containerOffsetLeft = container.offsetLeft;
            const newLeftWidth = e.clientX - containerOffsetLeft;

            livestreamContainer.style.width = `${newLeftWidth}px`;
            toolContainer.style.width = `calc(100% - ${newLeftWidth + 3}px)`;
        });

        document.addEventListener('mouseup', () => {
            isResizing = false;
            document.body.style.cursor = "default";
        })
    }


// This code controls the ambient light

    var ambientTOGGLE = document.getElementById('ambientTOGGLE');
    var ambientState = false;
  
    ambientTOGGLE.addEventListener('click', function(){
        console.log("Ambient light was switched");
        if(ambientState){ // OFF
            // dataChannel.send("ambientLight/state/OFF");
            console.log("Toggled off.");
            // onText.innerHTML = '';
            // offText.innerHTML = 'OFF';
            // lightSwitch.src = 'static/imgs/figma-components/lightSwitchOFF.png'
            dataChannel.send("PEpdu/off/Ambient")
            ambientState=false;
            ambientTOGGLE.title="Click here to turn ON";
            // lightSwitch.style.transform='rotate(0deg)';
        }
        else { // ON
            // dataChannel.send("ambientLight/state/ON");
            console.log("Toggled on.");
            // offText.innerHTML = '';
            // onText.innerHTML = 'ON';
            // lightSwitch.src = 'static/imgs/figma-components/lightSwitchON.png'
            dataChannel.send("PEpdu/on/Ambient");
            ambientState=true;
            ambientTOGGLE.title="Click here to turn OFF";
            // lightSwitch.style.transform='rotate(180deg)';
        }
    })
   
    var ElectrometerState=false;
    var MultimeterState=false;


});


window.addEventListener('beforeunload', function(e) {
    // mainCamSignal.hangup();
    dataChannel.close();
})
    