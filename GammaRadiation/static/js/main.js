
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

function controllerResponseHandler(cmd) {
    var components = cmd.split("/");
    var device = components[0]
    var info = components[1]
    var infoValue = components[2]

    if (infoValue == "limit") {
        extremaModal.modal("show")
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

var extremaModal

$("document").ready(function () {

    var liveStream = document.getElementById("v");
    extremaModal = $("#extremaModal")

    // Define Variables that are MWRAPs for use inside of callbacks
    var mWrap1, mWrap2, mWrap6, mWrap7
    var intervalId
    var mWrapList = []

    var loadingModal = $("#loadingModal")

    loadingModal.on("shown.bs.modal", function(e){
        intervalId = setInterval(function() {
            for (mWrap of mWrapList) {
                if ($(mWrap).length == 0) {
                    return
                }
            } 
            
            //Run when all mwraps exist.

    
            // Do clicks here
            console.log("hiding modal")
            //Hide Loading Screen
            loadingModal.modal("hide")
            //Stop repeating check
            clearInterval(intervalId)
    
        }, 500)
    })
    loadingModal.modal('show')

    


    //for multi-camera switching
    var CounterCam = document.getElementById("CounterCam");
    var OverviewCam = document.getElementById("OverviewCam");


    CounterCam.addEventListener('click', function() {
        dataChannel.send("Camera/camera/a");
    })

    OverviewCam.addEventListener('click', function() {
        dataChannel.send("Camera/camera/b");
    })


    //for LiveFeed  
    // TEMP CHANGE
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
 

    //for FacePlate of ST160 Nuclear Lab Station
    var countButton = document.getElementById('CountButton')
    var stopButton = document.getElementById('StopButton')
    var hvButton = document.getElementById('HVButton')
    var timeButton = document.getElementById("TimeButton")
    var upButton = document.getElementById("UpButton")
    var downButton = document.getElementById('DownButton')

    
 
   //BEGIN ST160 Face Plate Buttons


    countButton.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("CountButton/press/");
        return false
    })

    stopButton.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("StopButton/press/");
        return false
    })

    hvButton.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("HVButton/press/");
        return false
    })

    timeButton.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("TimeButton/press/");
        return false
    })

    upButton.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("UpButton/press/");
        return false
    })

    downButton.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("DownButton/press/");
        return false
    })

 //END ST160 Face Plate Buttons

 
 //map highlights - This is the script that styles effect of mouseOver and clicks on image maps
    
    $('#CountButton').mapster({
    mapKey:'id',
    fillColor: 'f5f5b5',
    fillOpacity: 0.6,
    render_select: { 
        fillOpacity: 0.3
    },
    singleSelect: true
    // scaleMap: true
  }).parent().css({"margin":"0 auto"});

  $('#StopButton').mapster({
    mapKey:'id',
    fillColor: 'f5f5b5',
    fillOpacity: 0,
    render_select: { 
        fillOpacity: 0
    },
    singleSelect: true
  }).parent().css({"margin":"0 auto"});

  $('#HVButton').mapster({
    mapKey:'id',
    fillColor: 'f5f5b5',
    fillOpacity: 0,
    render_select: { 
        fillOpacity: 0
    },
    singleSelect: true
  }).parent().css({"margin":"0 auto"});

  $('#TimeButton').mapster({
    mapKey:'id',
    fillColor: 'f5f5b5',
    fillOpacity: 0.6,
    render_select: { 
        fillOpacity: 0.3
    },
    singleSelect: true
  }).parent().css({"margin":"0 auto"});

  $('#UpButton').mapster({
    mapKey:'id',
    fillColor: 'f5f5b5',
    fillOpacity: 0.6,
    render_select: { 
        fillOpacity: 0.3
    },
    singleSelect: true
  }).parent().css({"margin":"0 auto"});
  
  $('#DownButton').mapster({
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
