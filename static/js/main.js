// (function () {
    var signalObj = null;

    window.addEventListener('DOMContentLoaded', function () {
        var isStreaming = false;
        var start = document.getElementById('start');
        var stop = document.getElementById('stop');
        var video = document.getElementById('v');
        var left = document.getElementById('left');
        var right = document.getElementById('right');

        // for Keithley 6514 Electrometer
        var shift6514Button = document.getElementById('Shift6514');
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


        // var play = document.getElementById('play')
        // var ctx = canvas.getContext('2d');
        // var effect = document.getElementById('effect');
        var isEffectActive = false;

        start.addEventListener('click', function (e) {
            // var address = document.getElementById('address').value;
            var signalling_server_hostname = location.hostname || "192.168.0.32";
            var signalling_server_address = signalling_server_hostname + ':' + (8081 || (location.protocol === 'https:' ? 443 : 80));
            var protocol = location.protocol === "https:" ? "wss:" : "ws:";
            var address = location.hostname + ':' + (8081 || (protocol === 'https:' ? 443 : 80)) + '/stream/webrtc';
            var wsurl = protocol + '//' + address;
            // var server = document.getElementById("signalling_server").value.toLowerCase();
            // var protocol = location.protocol === "https:" ? "wss:" : "ws:";
            // var wsurl = new WebSocket(protocol + '//' + server + '/stream/webrtc');
            // var wsurl = new WebSocket(protocol + '//' + signalling_server_address + '/stream/webrtc');

            if (!isStreaming) {
                signalObj = new signal(wsurl,
                        function (stream) {
                            console.log('got a stream!');
                            //var url = window.URL || window.webkitURL;
                            //video.src = url ? url.createObjectURL(stream) : stream; // deprecated
                            video.srcObject = stream;
                            // video.play(); Zak commented this and added stuff below
                            var playPromise = video.play();
                            console.log(playPromise);

                            if (playPromise !== undefined) {
                                playPromise.then(_ => {
                                    console.log("Zak says video is playing");
                                })
                                .catch(error => {
                                    console.log(error)
                                })
                            }
                        },
                        function (error) {
                            alert(error);
                        },
                        function () {
                            console.log('websocket closed. bye bye!');
                            video.srcObject = null;
                            //video.src = ''; // deprecated
                            // ctx.clearRect(0, 0, canvas.width, canvas.height);
                            isStreaming = false;
                        },
                        function (message) {
                            alert(message);
                        }
                );
            }
        }, false);

        stop.addEventListener('click', function (e) {
            if (signalObj) {
                signalObj.hangup();
                signalObj = null;
            }
        }, false);

        // Wait until the video stream can play
        video.addEventListener('canplay', function (e) {
            if (!isStreaming) {
                // canvas.setAttribute('width', video.videoWidth);
                // canvas.setAttribute('height', video.videoHeight);
                isStreaming = true;
            }
        }, false);

        // Wait for the video to start to play
        video.addEventListener('play', function () {
            // Every 33 milliseconds copy the video image to the canvas
            setInterval(function () {
                if (video.paused || video.ended) {
                    return;
                }
                // var w = canvas.getAttribute('width');
                // var h = canvas.getAttribute('height');
                // ctx.fillRect(0, 0, w, h);
                // ctx.drawImage(video, 0, 0, w, h);
                // if (isEffectActive) {
                //     detectFace(canvas);
                // }
            }, 33);
        }, false);

        // play.addEventListener('click', function() {
        //     video.play();
        // })

        // effect.addEventListener('click', function () {
        //     isEffectActive = !isEffectActive;
        // }, false);

        left.addEventListener('click', function() {
            dataChannel.send("Pot/move/-200");
        })

        right.addEventListener('click', function() {
            dataChannel.send("Pot/move/200");
        })
//BEGIN Keithley 6514 Electrometer Buttons
        shift6514Button.addEventListener('click', function(event) {
            //Prevent it from reloading
            event.stopPropagation();
            //Run our command
            dataChannel.send("Electrometer/press/SYST:KEY 1");
            //Ensure it doesn't reload
            return false
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
            return false
        })
        trigger6514Button.addEventListener('click', function(event) {
            event.stopPropagation();
            dataChannel.send("Electrometer/press/SYST:KEY 31");
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
//END Keithley 6514 Electrometer Buttons
//BEGIN Keithley 2000 Multimeter Buttons
        shift2000Button.addEventListener('click', function(event) {
            event.stopPropagation();
            dataChannel.send("Multimeter/press/SYST:KEY 1");
            return false
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

        start.click();
    });

    window.addEventListener('beforeunload', function(e) {
        dataChannel.close();
    })
// })();