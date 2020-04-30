function httpGetAsync(theUrl, callback) {
    try {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function () {
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
                callback(xmlHttp.responseText);
            }
        };
        xmlHttp.open("GET", theUrl, true); // true for asynchronous
        xmlHttp.send(null);
    } catch (e) {
        console.error(e);
    }
}




RTCPeerConnection = window.RTCPeerConnection || /*window.mozRTCPeerConnection ||*/ window.webkitRTCPeerConnection;
RTCSessionDescription = /*window.mozRTCSessionDescription ||*/ window.RTCSessionDescription;
RTCIceCandidate = /*window.mozRTCIceCandidate ||*/ window.RTCIceCandidate;
navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia || navigator.msGetUserMedia;
var URL = window.URL || window.webkitURL;


class webRTCConnection {

    constructor(signalling_server, videoElement=null, videoFormat=null, force_hw_vcodec=true, needData=false, trickle_ice=true) {
        this.signalling_server = signalling_server;
        this.videoElement = videoElement;
        this.videoFormat = videoFormat; //Not sure what the possible values could be. See the WebRTC Test page on the server:8081.
        this.needData = needData;
        this.force_hw_vcodec = force_hw_vcodec;
        this.trickle_ice = trickle_ice;

        this.isFirefox = typeof InstallTrigger !== 'undefined';// Firefox 1.0+
        this.ws = null;
        this.pc;
        // this.gn;
        this.datachannel
        this.localdatachannel;
        this.audio_video_stream;
        this.recorder = null;
        this.recordedBlobs;
        this.pcConfig = {/*sdpSemantics : "plan-b"*,*/ "iceServers": [
                {"urls": ["stun:stun.l.google.com:19302", "stun:" + signalling_server_hostname + ":3478"]}
            ]};
        this.pcOptions = {
            optional: [
                // Deprecated:
                //{RtpDataChannels: false},
                //{DtlsSrtpKeyAgreement: true}
            ]
        };
        this.mediaConstraints = {
            optional: [],
            mandatory: {
                OfferToReceiveAudio: true,
                OfferToReceiveVideo: true
            }
        };
        this.keys = [];
        this.trickle_ice = true;
        this.remoteDesc = false;
        this.iceCandidates = [];
    }


    createPeerConnection() {
        try {
            var pcConfig_ = this.pcConfig;
            try {
                // ice_servers = document.getElementById('ice_servers').value;
                // var ice_servers = {"urls": ["stun:stun.l.google.com:19302"]};
                var ice_servers = null;
                if (ice_servers) {
                    pcConfig_.iceServers = JSON.parse(ice_servers);
                }
            } catch (e) {
                alert(e + "\nExample: "
                        + '\n[ {"urls": "stun:stun1.example.net"}, {"urls": "turn:turn.example.org", "username": "user", "credential": "myPassword"} ]'
                        + "\nContinuing with built-in RTCIceServer array");
            }
            console.log(JSON.stringify(pcConfig_));
            this.pc = new RTCPeerConnection(pcConfig_, this.pcOptions);
            this.pc.onicecandidate = onIceCandidate;
            if ('ontrack' in this.pc) {
                this.pc.ontrack = onTrack;
            } else {
                this.pc.onaddstream = onRemoteStreamAdded; // deprecated
            }
            this.pc.onremovestream = onRemoteStreamRemoved;
            this.pc.ondatachannel = onDataChannel;
            console.log("peer connection successfully created!");
        } catch (e) {
            console.error("createPeerConnection() failed");
            console.log(e);
        }
    }
    
    onDataChannel(event) {
        console.log("onDataChannel()");
        this.datachannel = event.channel;
    
        event.channel.onopen = function () {
            console.log("Data Channel is open!");
        };
    
        event.channel.onerror = function (error) {
            console.error("Data Channel Error:", error);
        };
    
        event.channel.onmessage = function (event) {
            console.log("Got Data Channel Message:", event.data);
        };
    
        event.channel.onclose = function () {
            datachannel = null;
            console.log("The Data Channel is Closed");
        };
    }
    
    onIceCandidate(event) {
        if (event.candidate) {
            var candidate = {
                sdpMLineIndex: event.candidate.sdpMLineIndex,
                sdpMid: event.candidate.sdpMid,
                candidate: event.candidate.candidate
            };
            var request = {
                what: "addIceCandidate",
                data: JSON.stringify(candidate)
            };
            this.ws.send(JSON.stringify(request));
        } else {
            console.log("End of candidates.");
        }
    }
    
    addIceCandidates() {
        this.iceCandidates.forEach(function (candidate) {
            this.pc.addIceCandidate(candidate,
                function () {
                    console.log("IceCandidate added: " + JSON.stringify(candidate));
                },
                function (error) {
                    console.error("addIceCandidate error: " + error);
                }
            );
        });
        this.iceCandidates = [];
    }
    
    onRemoteStreamAdded(event) {
        console.log("Remote stream added:", event.stream);
        var remoteVideoElement = this.videoElement;
        remoteVideoElement.srcObect = event.stream;
        //remoteVideoElement.play();
    }
    
    onTrack(event) {
        console.log("Remote track!");
        var remoteVideoElement = this.videoElement;
        remoteVideoElement.srcObject = event.streams[0];
        //remoteVideoElement.play();
    }
    
    onRemoteStreamRemoved(event) {
        var remoteVideoElement = this.videoElement;
        remoteVideoElement.srcObject = null;
        remoteVideoElement.src = ''; // TODO: remove
    }

    call(stream) {
        console.log("made it");
        console.log(this);
        this.iceCandidates = [];
        this.remoteDesc = false;
        this.createPeerConnection();
        if (stream) {
            this.pc.addStream(stream);
        }
        var request = {
            what: "call",
            options: {
                // force_hw_vcodec: document.getElementById("remote_hw_vcodec").checked,
                force_hw_vcodec: true,
                // vformat: document.getElementById("remote_vformat").value,
                vformat: this.videoFormat,
                trickle_ice: this.trickle_ice
            }
        };
        this.ws.send(JSON.stringify(request));
        console.log("call(), request=" + JSON.stringify(request));
    }
    
    // wsOnOpen() {
    //     console.log("onopen()");
    //     this.audio_video_stream = null;
    //     var localConstraints = {};
    //     localConstraints['audio'] = false;
    //     localConstraints['video'] = false;
    //     console.log(this);
    //     console.log(this.call);
    //     this.call(false);
    // }
    
    start() {
        if ("WebSocket" in window) {
            document.documentElement.style.cursor = 'wait';
            var server = this.signalling_server;
    
            var protocol = location.protocol === "https:" ? "wss:" : "ws:";
            this.ws = new WebSocket(protocol + '//' + server + '/stream/webrtc');
            // this.ws.onopen = this.wsOnOpen
            
            function call(stream) {
                console.log("made it");
                console.log(this);
                this.iceCandidates = [];
                this.remoteDesc = false;
                createPeerConnection();
                if (stream) {
                    this.pc.addStream(stream);
                }
                var request = {
                    what: "call",
                    options: {
                        // force_hw_vcodec: document.getElementById("remote_hw_vcodec").checked,
                        force_hw_vcodec: true,
                        // vformat: document.getElementById("remote_vformat").value,
                        vformat: this.videoFormat,
                        trickle_ice: this.trickle_ice
                    }
                };
                this.ws.send(JSON.stringify(request));
                console.log("call(), request=" + JSON.stringify(request));
            }
            console.log("whats this");
            console.log(this);
            this.ws.onopen = function () {
                console.log("onopen()");
                console.log(this);
    
                this.audio_video_stream = null;
                // var cast_mic = document.getElementById("cast_mic").checked;
                // var cast_tab = document.getElementById("cast_tab") ? document.getElementById("cast_tab").checked : false;
                // var cast_camera = document.getElementById("cast_camera").checked;
                // var cast_screen = document.getElementById("cast_screen").checked;
                // var cast_window = document.getElementById("cast_window").checked;
                // var cast_application = document.getElementById("cast_application").checked;
                // var echo_cancellation = document.getElementById("echo_cancellation").checked;
                var localConstraints = {};
                // if (cast_mic) {
                //     if (echo_cancellation)
                //         localConstraints['audio'] = this.isFirefox ? {echoCancellation: true} : {optional: [{echoCancellation: true}]};
                //     else
                //         localConstraints['audio'] = this.isFirefox ? {echoCancellation: false} : {optional: [{echoCancellation: false}]};
                // } else if (cast_tab) {
                //     localConstraints['audio'] = {mediaSource: "audioCapture"};
                // } else {
                //     localConstraints['audio'] = false;
                // }
                localConstraints['audio'] = false;
                // if (cast_camera) {
                //     localConstraints['video'] = true;
                // } else if (cast_screen) {
                //     if (this.isFirefox) {
                //         localConstraints['video'] = {frameRate: {ideal: 30, max: 30},
                //             //width: {min: 640, max: 960},
                //             //height: {min: 480, max: 720},
                //             mozMediaSource: "screen",
                //             mediaSource: "screen"};
                //     } else {
                //         // chrome://flags#enable-usermedia-screen-capturing
                //         document.getElementById("cast_mic").checked = false;
                //         localConstraints['audio'] = false; // mandatory for chrome
                //         localConstraints['video'] = {'mandatory': {'chromeMediaSource':'screen'}};
                //     }
                // } else if (cast_window)
                //     localConstraints['video'] = {frameRate: {ideal: 30, max: 30},
                //         //width: {min: 640, max: 960},
                //         //height: {min: 480, max: 720},
                //         mozMediaSource: "window",
                //         mediaSource: "window"};
                // else if (cast_application)
                //     localConstraints['video'] = {frameRate: {ideal: 30, max: 30},
                //         //width: {min: 640, max: 960},
                //         //height:  {min: 480, max: 720},
                //         mozMediaSource: "application",
                //         mediaSource: "application"};
                // else
                //     localConstraints['video'] = false;
                localConstraints['video'] = false;
    
                // var localVideoElement = document.getElementById('local-video');
                // if (localConstraints.audio || localConstraints.video) {
                //     if (navigator.getUserMedia) {
                //         navigator.getUserMedia(localConstraints, function (stream) {
                //             this.audio_video_stream = stream;
                //             call(stream);
                //             localVideoElement.muted = true;
                //             localVideoElement.srcObject = stream;
                //             localVideoElement.play();
                //         }, function (error) {
                //             stop();
                //             alert("An error has occurred. Check media device, permissions on media and origin.");
                //             console.error(error);
                //         });
                //     } else {
                //         console.log("getUserMedia not supported");
                //     }
                // } else {
                //     call();
                // }
                this.call();

            };
    
            this.ws.onmessage = function (evt) {
                var msg = JSON.parse(evt.data);
                if (msg.what !== 'undefined') {
                    var what = msg.what;
                    var data = msg.data;
                }
                //console.log("message=" + msg);
                console.log("message =" + what);

                function onRemoteSdpSuccess() {
                        this.remoteDesc = true;
                        this.addIceCandidates();
                        console.log('onRemoteSdpSucces()');
                        this.pc.createAnswer(function (sessionDescription) {
                            this.pc.setLocalDescription(sessionDescription);
                            var request = {
                                what: "answer",
                                data: JSON.stringify(sessionDescription)
                            };
                            this.ws.send(JSON.stringify(request));
                            console.log(request);

                        }, function (error) {
                            alert("Failed to createAnswer: " + error);

                        }, this.mediaConstraints);
                }

                function onRemoteSdpError(event) {
                    alert('Failed to set remote description (unsupported codec on this browser?): ' + event);
                    stop();
                }
    
                switch (what) {
                    case "offer":
                        this.pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(data)),
                                onRemoteSdpSuccess.bind(this),
                                onRemoteSdpError.bind(this)
                                // function onRemoteSdpSuccess() {
                                //     this.remoteDesc = true;
                                //     addIceCandidates();
                                //     console.log('onRemoteSdpSucces()');
                                //     this.pc.createAnswer(function (sessionDescription) {
                                //         this.pc.setLocalDescription(sessionDescription);
                                //         var request = {
                                //             what: "answer",
                                //             data: JSON.stringify(sessionDescription)
                                //         };
                                //         this.ws.send(JSON.stringify(request));
                                //         console.log(request);
    
                                //     }, function (error) {
                                //         alert("Failed to createAnswer: " + error);
    
                                //     }, this.mediaConstraints);
                                // },
                                // function onRemoteSdpError(event) {
                                //     alert('Failed to set remote description (unsupported codec on this browser?): ' + event);
                                //     stop();
                                // }

                        );
    
                        /*
                         * No longer needed, it's implicit in "call"
                        var request = {
                            what: "generateIceCandidates"
                        };
                        console.log(request);
                        this.ws.send(JSON.stringify(request));
                        */
                        break;
    
                    case "answer":
                        break;
    
                    case "message":
                        alert(msg.data);
                        break;
    
                    case "iceCandidate": // when trickle is enabled
                        if (!msg.data) {
                            console.log("Ice Gathering Complete");
                            break;
                        }
                        var elt = JSON.parse(msg.data);
                        let candidate = new RTCIceCandidate({sdpMLineIndex: elt.sdpMLineIndex, candidate: elt.candidate});
                        this.iceCandidates.push(candidate);
                        if (this.remoteDesc)
                            addIceCandidates();
                        document.documentElement.style.cursor = 'default';
                        break;
    
                    case "iceCandidates": // when trickle ice is not enabled
                        var candidates = JSON.parse(msg.data);
                        for (var i = 0; candidates && i < candidates.length; i++) {
                            var elt = candidates[i];
                            let candidate = new RTCIceCandidate({sdpMLineIndex: elt.sdpMLineIndex, candidate: elt.candidate});
                            this.iceCandidates.push(candidate);
                        }
                        if (this.remoteDesc)
                            addIceCandidates();
                        document.documentElement.style.cursor = 'default';
                        break;
                }
            };
    
            this.ws.onclose = function (evt) {
                if (this.pc) {
                    this.pc.close();
                    this.pc = null;
                }
                document.documentElement.style.cursor = 'default';
            };
    
            this.ws.onerror = function (evt) {
                alert("An error has occurred!");
                this.ws.close();
            };
            
            //This code is written by Zak
            //This is very important for JavaScript objects. Without this code
            // 'this' would refer to the WebSocket Class and not the
            // webRTCConnection class. This code binds the webRTCConnection
            // class to the 'this' variable for the websocket.
            this.ws.onopen = this.ws.onopen.bind(this);
            this.ws.onmessage = this.ws.onmessage.bind(this);
            this.ws.onclose = this.ws.onclose.bind(this);
            this.ws.onerror = this.ws.onerror.bind(this);
    
        } else {
            alert("Sorry, this browser does not support WebSockets.");
        }
    }
    
    stop() {
        if (this.datachannel) {
            console.log("closing data channels");
            this.datachannel.close();
            this.datachannel = null;
        }
        if (this.localdatachannel) {
            console.log("closing local data channels");
            this.localdatachannel.close();
            this.localdatachannel = null;
        }
        if (this.audio_video_stream) {
            try {
                if (this.audio_video_stream.getVideoTracks().length)
                    this.audio_video_stream.getVideoTracks()[0].stop();
                if (this.audio_video_stream.getAudioTracks().length)
                    this.audio_video_stream.getAudioTracks()[0].stop();
                this.audio_video_stream.stop(); // deprecated
            } catch (e) {
                for (var i = 0; i < this.audio_video_stream.getTracks().length; i++)
                    this.audio_video_stream.getTracks()[i].stop();
            }
            this.audio_video_stream = null;
        }
        stop_record();
        this.videoElement.srcObject = null;
        // document.getElementById('local-video').srcObject = null;
        if (this.pc) {
            this.pc.close();
            this.pc = null;
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        document.documentElement.style.cursor = 'default';
    }
    
    mute() {
        // var remoteVideo = document.getElementById("remote-video");
        var remoteVideo = this.videoElement
        remoteVideo.muted = !remoteVideo.muted;
    }
    
    pause() {
        // var remoteVideo = document.getElementById("remote-video");
        var remoteVideo = this.videoElement
        if (remoteVideo.paused)
            remoteVideo.play();
        else
            remoteVideo.pause();
    }
    
    fullscreen() {
        // var remoteVideo = document.getElementById("remote-video");
        var remoteVideo = this.videoElement
        if (remoteVideo.requestFullScreen) {
            remoteVideo.requestFullScreen();
        } else if (remoteVideo.webkitRequestFullScreen) {
            remoteVideo.webkitRequestFullScreen();
        } else if (remoteVideo.mozRequestFullScreen) {
            remoteVideo.mozRequestFullScreen();
        }
    }
    
    handleDataAvailable(event) {
        //console.log(event);
        if (event.data && event.data.size > 0) {
            this.recordedBlobs.push(event.data);
        }
    }
    
    handleStop(event) {
        console.log('Recorder stopped: ', event);
        // document.getElementById('record').innerHTML = 'Start Recording';
        this.recorder = null;
        var superBuffer = new Blob(this.recordedBlobs, {type: 'video/webm'});
        // var recordedVideoElement = document.getElementById('recorded-video');
        recordedVideoElement.src = URL.createObjectURL(superBuffer);
    }
    
    discard_recording() {
        // var recordedVideoElement = document.getElementById('recorded-video');
        recordedVideoElement.srcObject = null;
        recordedVideoElement.src = '';
    }
    
    stop_record() {
        if (this.recorder) {
            this.recorder.stop();
            console.log("recording stopped");
            // document.getElementById('record-detail').open = true;
        }
    }
    
    startRecording(stream) {
        this.recordedBlobs = [];
        var options = {mimeType: 'video/webm;codecs=vp9'};
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            console.log(options.mimeType + ' is not Supported');
            options = {mimeType: 'video/webm;codecs=vp8'};
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                console.log(options.mimeType + ' is not Supported');
                options = {mimeType: 'video/webm;codecs=h264'};
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    console.log(options.mimeType + ' is not Supported');
                    options = {mimeType: 'video/webm'};
                    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                        console.log(options.mimeType + ' is not Supported');
                        options = {mimeType: ''};
                    }
                }
            }
        }
        try {
            this.recorder = new MediaRecorder(stream, options);
        } catch (e) {
            console.error('Exception while creating MediaRecorder: ' + e);
            alert('Exception while creating MediaRecorder: ' + e + '. mimeType: ' + options.mimeType);
            return;
        }
        console.log('Created MediaRecorder', this.recorder, 'with options', options);
        //recorder.ignoreMutedMedia = true;
        this.recorder.onstop = handleStop;
        this.recorder.ondataavailable = handleDataAvailable;
        this.recorder.onwarning = function (e) {
            console.log('Warning: ' + e);
        };
        this.recorder.start();
        console.log('MediaRecorder started', this.recorder);
    }
    
    start_stop_record() {
        if (this.pc && !this.recorder) {
            var streams = this.pc.getRemoteStreams();
            if (streams.length) {
                console.log("starting recording");
                startRecording(streams[0]);
                // document.getElementById('record').innerHTML = 'Stop Recording';
            }
        } else {
            stop_record();
        }
    }
    
    download() {
        if (this.recordedBlobs !== undefined) {
            var blob = new Blob(this.recordedBlobs, {type: 'video/webm'});
            var url = window.URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'video.webm';
            document.body.appendChild(a);
            a.click();
            setTimeout(function () {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 100);
        }
    }
    
    remote_hw_vcodec_selection() {
        // if (!document.getElementById('remote_hw_vcodec').checked)
        if(!this.force_hw_vcodec)
            unselect_remote_hw_vcodec();
        else
            select_remote_hw_vcodec();
    }
    
    remote_hw_vcodec_format_selection() {
        // if (document.getElementById('remote_hw_vcodec').checked)
        if (this.force_hw_vcodec)
            remote_hw_vcodec_selection();
    }
    
    select_remote_hw_vcodec() {
        // document.getElementById('remote_hw_vcodec').checked = true;
        // var vformat = document.getElementById('remote_vformat').value;
        var vformat = this.videoFormat;
        switch (vformat) {
            case '5':
                this.videoElement.style.width = "320px";
                this.videoElement.style.height = "240px";
                break;
            case '10':
                this.videoElement.style.width = "320px";
                this.videoElement.style.height = "240px";
                break;
            case '20':
                this.videoElement.style.width = "352px";
                this.videoElement.style.height = "288px";
                break;
            case '25':
                this.videoElement.style.width = "640px";
                this.videoElement.style.height = "480px";
                break;
            case '30':
                this.videoElement.style.width = "640px";
                this.videoElement.style.height = "480px";
                break;
            case '35':
                this.videoElement.style.width = "800px";
                this.videoElement.style.height = "480px";
                break;
            case '40':
                this.videoElement.style.width = "960px";
                this.videoElement.style.height = "720px";
                break;
            case '50':
                this.videoElement.style.width = "1024px";
                this.videoElement.style.height = "768px";
                break;
            case '55':
                this.videoElement.style.width = "1280px";
                this.videoElement.style.height = "720px";
                break;
            case '60':
                this.videoElement.style.width = "1280px";
                this.videoElement.style.height = "720px";
                break;
            case '63':
                this.videoElement.style.width = "1280px";
                this.videoElement.style.height = "720px";
                break;
            case '65':
                this.videoElement.style.width = "1280px";
                this.videoElement.style.height = "768px";
                break;
            case '70':
                this.videoElement.style.width = "1280px";
                this.videoElement.style.height = "768px";
                break;
            case '75':
                this.videoElement.style.width = "1536px";
                this.videoElement.style.height = "768px";
                break;
            case '80':
                this.videoElement.style.width = "1280px";
                this.videoElement.style.height = "960px";
                break;
            case '90':
                this.videoElement.style.width = "1600px";
                this.videoElement.style.height = "768px";
                break;
            case '95':
                this.videoElement.style.width = "1640px";
                this.videoElement.style.height = "1232px";
                break;
            case '97':
                this.videoElement.style.width = "1640px";
                this.videoElement.style.height = "1232px";
                break;
            case '98':
                this.videoElement.style.width = "1792px";
                this.videoElement.style.height = "896px";
                break;
            case '99':
                this.videoElement.style.width = "1792px";
                this.videoElement.style.height = "896px";
                break;
            case '100':
                this.videoElement.style.width = "1920px";
                this.videoElement.style.height = "1080px";
                break;
            case '105':
                this.videoElement.style.width = "1920px";
                this.videoElement.style.height = "1080px";
                break;
            default:
                this.videoElement.style.width = "1280px";
                this.videoElement.style.height = "720px";
        }
        /*
         // Disable video casting. Not supported at the moment with hw codecs.
         var elements = document.getElementsByName('video_cast');
         for(var i = 0; i < elements.length; i++) {
         elements[i].checked = false;
         }
         */
    }
    
    unselect_remote_hw_vcodec() {
        // document.getElementById('remote_hw_vcodec').checked = false;
        this.videoElement.style.width = "640px";
        this.videoElement.style.height = "480px";
    }
    
    singleselection(name, id) {
        // var old = document.getElementById(id).checked;
        var elements = document.getElementsByName(name);
        for (var i = 0; i < elements.length; i++) {
            elements[i].checked = false;
        }
        // document.getElementById(id).checked = old ? true : false;
    }
    
    send_message(message) {
        var msg = message;
        this.datachannel.send(msg);
        console.log("message sent: ", msg);
    }
    
    create_localdatachannel() {
        if (this.pc && this.localdatachannel)
            return;
        this.localdatachannel = this.pc.createDataChannel('datachannel');
        this.localdatachannel.onopen = function(event) {
            if (this.localdatachannel.readyState === "open") {
                this.localdatachannel.send("datachannel created!");
            }
        };
        console.log("data channel created");
    }
    
    close_localdatachannel() {
        if (this.localdatachannel) {
            this.localdatachannel.close();
            this.localdatachannel = null;
        }
        console.log("local data channel closed");
    }
    
}

