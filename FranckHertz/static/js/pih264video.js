var signalling_server_hostname_video = location.hostname;
var signalling_server_address_video = signalling_server_hostname_video + location.pathname + "ws3";
var protocol_video = location.protocol === "https:" ? "wss:" : "ws:";
var port = 6049;
var wsurl_video = protocol_video + '//' + signalling_server_address_video;
// var wsurl_videotemp = 'ws://franck2.inst.physics.ucsb.edu:6049'
window.onload = function(){	
    console.log("Attempting to connect to JMuxer")
    var jmuxer = new JMuxer({
        node: 'stream',
        mode: 'video',
        flushingTime: 0,
        fps: 30,
        debug: false
        });

    var ws = new WebSocket(wsurl_video);
    ws.binaryType = 'arraybuffer';
    ws.addEventListener('message',function(event){
        if (!document.hidden){
            jmuxer.feed({
                video: new Uint8Array(event.data)
            });				
        }
    });
}