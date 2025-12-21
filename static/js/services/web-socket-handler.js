export class WebSocketHandler {
  constructor() { }

  connect() {
    // TODO: connect
  }

  handle(event) {
    const { type, payload, meta } = event;

    switch (type) {
      case 'queue':
        this.handleQueue(payload);
        break;
      case 'alert':
        this.handleAlert(payload);
        break;
      case 'debug':
        this.handleDebug(payload);
        break;
      case 'command':
        this.handleCommand(payload);
        break;
      default:
        console.error(`Unexpected response type returned: ${type}`);
    }
  }

  handleQueue(queue) {
    console.log('handleQueue', queue);
  }

  handleAlert(alert) {
    // It's a string, process
    if (typeof alert === 'string') {
      const [device, command, parameter] = messageText.split("/");
      if (parameter == "limit") {
        extremaModal.style.display = "block";
      }
      if (parameter == "boot") {
        bootModal.style.display = "block";
      }
      if (parameter == "contact") {
        contactModal.style.display = "block";
      }
    } else {
      // It's a json object, emit event for component or service to handle
      // const alertEvent = new CustomEvent('alert', { detail: { title: 'Some title', message: 'some message', imageUrl: 'https://alsdjfalksdjflak.com' } });
      // window.dispatchEvent(alertEvent);
    }
  }

  handleDebug(debug) {
    console.log('handleDebug', debug);
  }

  handleCommand(command) {
    console.log('handleCommand', command);
  }
}