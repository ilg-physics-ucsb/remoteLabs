// Carlos add websocket connections here.
// make sure to use var dataChannel = Websocket....
// When the client receives a message from the server that message should go to the messageHandler




//Zak's Additional Functions
function messageHandler(event) {
    console.log("MESSAGE HANDLER")
    var data = event.data;
    console.log(data);
    // Data should be the response from the server
    controllerResponseHandler(data)
}