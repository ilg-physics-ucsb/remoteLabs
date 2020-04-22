// (function () {
    var signalObj = null;

    window.addEventListener('DOMContentLoaded', function () {
        var isStreaming = false;
        var start = document.getElementById('start');
        var stop = document.getElementById('stop');
        var video = document.getElementById('v');
        var left = document.getElementById('left');
        var right = document.getElementById('right');
        var voltButton = document.getElementById('Volts');
        var currentButton = document.getElementById('Current');
        // var play = document.getElementById('play')
        // var ctx = canvas.getContext('2d');
        // var effect = document.getElementById('effect');
        var isEffectActive = false;

        start.addEventListener('click', function (e) {
            // var address = document.getElementById('address').value;
            var signalling_server_hostname = location.hostname || "192.168.1.61";
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
            dataChannel.send("Stp1/move/-200");
        })

        right.addEventListener('click', function() {
            dataChannel.send("Stp1/move/200");
        })

        voltButton.addEventListener('click', function(event) {
            //Prevent it from reloading
            event.stopPropagation();
            //Run our command
            dataChannel.send("Electrometer/press/SYST:KEY 2");
            //Ensure it doesn't reload
            return false
        })

        currentButton.addEventListener('click', function(event) {
            event.stopPropagation();
            dataChannel.send("Electrometer/press/SYST:KEY 3");
            return false
        })

        start.click();
    });

    window.addEventListener('beforeunload', function(e) {
        dataChannel.close();
    })
// })();