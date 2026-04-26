import { WebSocketHandler } from "../../../static/js/services/web-socket-handler.js";

// Photo Electric Effect Lab
addEventListener('DOMContentLoaded', () => {
  const wsHandler = new WebSocketHandler();
  wsHandler.connect();

  window.addEventListener('knob', (event) => {
    console.log('photo respond to knob: ', event)
  });
});