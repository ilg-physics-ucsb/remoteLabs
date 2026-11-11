export class imgMapDevice extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });


    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          min-width: 0;
          min-height: 0;
        }

        .image-map-device {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
        }

        .image-map-device svg {
          width: auto;
          height: auto;
          max-width: 100%;
          max-height: 100%;
        }

        .image-map-device .map-button {
          pointer-events: all;
          cursor: pointer;
        }

        img {
          width: 100%;
          height: 100%;
          max-width: 128px;
          max-height: 128px;
          cursor: pointer;
        }

        .image-map-device [data-cmd]:hover {
          fill: bisque;
          fill-opacity: 0.75;
        }

        :host([data-command-pending]) .image-map-device {
          pointer-events: none;
          opacity: 0.5;
        }
      </style>

      <div class="image-map-device" style="text-align: center"></div>
    `;
  }

  connectedCallback() { //change this to run the insertSVG command;
    // we'll give img-map-url as an attribute to read the data in the html file tha contains the svg
    // this will allow us to use the same component for different svg files, just by changing the attribute in the html file
    // we'll also have to set up an event-listener that will call the function associated with the button presses. 
    
    const mapHTMLfile = this.getAttribute('map-html-file');
    const deviceName = this.getAttribute('device-name');
    const target = this.shadowRoot.querySelector('.image-map-device');

    if (!mapHTMLfile) {
      console.error('img-map-device: missing map-html-file attribute');
      return;
    }

    fetch(mapHTMLfile)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch map file: ${mapHTMLfile} (${response.status})`);
        }
        return response.text();
      })
      .then((svgText) => {
        target.innerHTML = svgText;
        target.addEventListener('click', (event) => {
          if (this.hasAttribute('data-command-pending')) {
            return;
          }
          const control = event.target instanceof Element ? event.target.closest('[data-cmd]') : null;
          if (!control) {
            return;
          }

          const buttonValue = control.getAttribute('data-cmd');
          if (!buttonValue || !deviceName) {
            return;
          }
          const deviceCommand = `${deviceName}/${buttonValue}`;
          this.emit(deviceCommand);
          const [commandName, ...commandArguments] = buttonValue.split('/');
          const command = { deviceName, commandName, arguments: commandArguments };
          if (this.hasAttribute('lock-while-commanding')) {
            this.setPending(true);
            command.source = this;
          }
          window.dispatchEvent(new CustomEvent('remla-command', { detail: command }));
        });
      })
      .catch((error) => {
        console.error('img-map-device: could not initialize image map', error);
      });
  }


  emit(value) {
    const imgMapEvent = new CustomEvent('imgMapDeviceEvent', { detail: { value: value } });
    window.dispatchEvent(imgMapEvent);
    console.log(value);
  }

  setPending(pending) {
    this.toggleAttribute('data-command-pending', pending);
  }
}

if (!customElements.get('img-map-device')) {
  customElements.define('img-map-device', imgMapDevice); //this line registers the toggle element so we can use <img-map-device> in our HTML.
}
