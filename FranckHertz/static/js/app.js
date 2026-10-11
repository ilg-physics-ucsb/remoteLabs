import { WebSocketHandler } from "../../../static/js/services/web-socket-handler.js";

// Franck-Hertz Lab
addEventListener('DOMContentLoaded', () => {
  const wsHandler = new WebSocketHandler();
  wsHandler.connect();

  window.addEventListener('knob', (event) => {
    console.log('franck responded to knob: ', event)
  });
});