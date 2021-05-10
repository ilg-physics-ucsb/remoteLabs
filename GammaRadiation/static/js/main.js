
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
    console.log(cmd)

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

var extremaModal, contactModal

$("document").ready(function () {

    var liveStream = document.getElementById("v");
    extremaModal = $("#extremaModal")
    contactModal = $("#contactModal")

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


    //for ambientLight
    var counterTOGGLE = document.getElementById('counterTOGGLE');
    counterTOGGLE.style.transform='scaleY(1)'
    var counterState = false;
    var counterSwitch = document.getElementById('CounterSwitch')
    counterTOGGLE.addEventListener('click', function(){
        console.log("counter switch was switched");
        if(counterState){
            dataChannel.send("GRpdu/off/ST160")
            counterState=false;
            counterTOGGLE.title = "Click here to turn ON";
            counterSwitch.style.transform='scaleY(1)';
        }
        else{
            dataChannel.send("GRpdu/on/ST160");
            counterState=true;
            counterTOGGLE.title="Click here to turn OFF";
            counterSwitch.style.transform='scaleY(-1)';
        }
    })

    //for multi-camera switching
    var CounterCam = document.getElementById("CounterCam");
    var OverviewCam = document.getElementById("OverviewCam");


    CounterCam.addEventListener('click', function() {
        dataChannel.send("Camera/camera/b");
    })

    OverviewCam.addEventListener('click', function() {
        dataChannel.send("Camera/camera/a");
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
        dataChannel.send("Buttons/press/1");
        return false
    })

    stopButton.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Buttons/press/2");
        return false
    })

    hvButton.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Buttons/press/3");
        return false
    })

    timeButton.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Buttons/press/4");
        return false
    })

    upButton.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Buttons/press/5");
        return false
    })

    downButton.addEventListener('click', function(event) {
        event.stopPropagation();
        dataChannel.send("Buttons/press/6");
        return false
    })

 //END ST160 Face Plate Buttons

 //BEGIN Draggable List Functionality
    const list_items = $(".list-item");
    const slots = $(".slot");
    const holder = $(".holder");
    const autoLists = $(".auto-list");
    const manualList = $(".manual-list");
    const absorberLocations = {
        "Absorber 1": 0,
        "Absorber 2": 1,
        "Absorber 3": 2,
        "Absorber 4": 3,
        "Absorber 5": 4,
        "Absorber 6": 5,
        "Absorber 7": 6,
        "Absorber 8": 7,
        "Absorber 9": 8,
        "Absorber 10": 9,
        "Absorber 11a": 11,
        "Absorber 11b": 12,
        "Absorber 11c": 13,
        "Absorber 11d": 14,
        "Source"    : 15
    }
    loaded = {
        "s0": -1,
        "s1": -1,
        "s2": -1,
        "s3": -1,
        "s4": -1,
        "s5": -1,
    }

    const absorberShortHand = {
      "Absorber 1": "A1",
      "Absorber 2": "A2",
      "Absorber 3": "A3",
      "Absorber 4": "A4",
      "Absorber 5": "A5",
      "Absorber 6": "A6",
      "Absorber 7": "A7",
      "Absorber 8": "A8",
      "Absorber 9": "A9",
      "Absorber 10": "A10",
      "Absorber 11a": "A11",
      "Absorber 11b": "A12",
      "Absorber 11c": "A13",
      "Absorber 11d": "A14",
      "Source"    : "Source"
    }
    let draggedItem = null;
    let parentSlot = null;
    for (let i=0; i < list_items.length; i++) {
        const item = list_items[i];
        console.log(item)
        item.addEventListener('dragstart', function(){
            draggedItem = item;
            parentSlot = item.parentElement;
            setTimeout(function() {
                //item.style.display = "none";
                parentSlot.innerHTML.textContent = "Empty"
            }, 0)
        })

        item.addEventListener("dragend", function(){
            setTimeout(function() {
                // draggedItem.style.display = 'block';
                // draggedItem = null;
                // this.innerHTML = "Empty"
            }, 0)
        })

        for (k=0; k<autoLists.length; k++) {
            const aList = autoLists[k];
            aList.addEventListener('dragover', function(e){
                e.preventDefault();
            })

            aList.addEventListener('dragenter', function(e){
                e.preventDefault();
                this.style.backgroundColor = "rgba(0,0,0,0.2)";
            })

            aList.addEventListener("dragleave", function(e){
                e.preventDefault();
                this.style.backgroundColor = "rgba(0,0,0,0.1)";
            })

            aList.addEventListener('drop', function(e){
                let key = draggedItem.textContent
                console.log(draggedItem)
                console.log(e)
                console.log(parentSlot)
                console.log(parentSlot.className)
                console.log("KEY:" + key)
                console.log("LOCATIONS:" + absorberLocations[key])
                console.log("THIS:")
                console.log(this)
                console.log("Children:")
                console.log(this.children)
                let holder = this.children[absorberLocations[key]];
                console.log("holder:")
                console.log(holder)
                holder.innerHTML = "";
                holder.appendChild(draggedItem);
                if (parentSlot.className == "slot") {
                    loaded[parentSlot.id] = -1;
                    parentSlot.innerHTML = "Empty";
                }
                
            })
        }

        for (let j=0; j<slots.length; j++) {
            const slot = slots[j];
            console.log(slot)
            slot.addEventListener('dragover', function(e){
                e.preventDefault();
            })

            slot.addEventListener('dragenter', function(e){
                e.preventDefault();
                this.style.backgroundColor = "rgba(0,0,0,0.2)";
            })

            slot.addEventListener("dragleave", function(e){
                e.preventDefault();
                this.style.backgroundColor = "rgba(0,0,0,0.1)";
            })

            slot.addEventListener('drop', function(e){
                if (this.textContent == "Empty") {
                    this.innerHTML = "";
                    parentSlot.innerHTML = "Empty";
                    this.append(draggedItem);
                    this.style.backgroundColor = "rgba(0,0,0,0.1)";
                    // loaded[this.id] = absorberLocations[draggedItem.textContent];
                    // console.log("Test")
                    // console.log(Object.values(loaded))
                    // console.log
                    // console.log(absorberShortHand[draggedItem.textContent])
                    if (Object.values(loaded).includes(absorberShortHand[draggedItem.textContent])) {
                      Object.keys(loaded).forEach(item => {
                        if (loaded[item] == absorberShortHand[draggedItem.textContent]) {
                          loaded[item] = -1
                        }
                      });

                    }
                    loaded[this.id] = absorberShortHand[draggedItem.textContent];
                    console.log(loaded)

                }
            })
        }
    }

    $("#CommitAbsorberButton").click(function(){
        sendString = "";
        for (var s in loaded) {
            if (loaded[s] != -1){
                if (sendString == "") {
                    sendString = sendString + "(" + s + "," + loaded[s] + ")"
                } else {
                    sendString = sendString + ",(" + s + "," + loaded[s] + ")"
                }
            } else if (loaded[s]== -1) {
              if (sendString == "") {
                  sendString = sendString + "(" + s + "," + "" + ")"
              } else {
                  sendString = sendString + ",(" + s + "," + "" + ")"
              }
            }
        }
        console.log(sendString)
        dataChannel.send("AbsorberController/place/" + sendString)
        // Add datachannel send
    })


 //END Draggable List Functionality

 //map highlights - This is the script that styles effect of mouseOver and clicks on image maps


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
