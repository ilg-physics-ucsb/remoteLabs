import { WebSocketHandler } from "../../../static/js/services/web-socket-handler";

addEventListener('DOMContentLoaded', () => {
  const wsHandler = new WebSocketHandler();
  wsHandler.connect();

  window.addEventListener('knob', (event) => {
    console.log('photo respond to knob: ', event)
  });
});