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

        .image-map-device .map-button.selected {
          fill: bisque;
          fill-opacity: 0.75;
          stroke: bisque;
          stroke-width: 7px;
          animation: last-click 0.3s ease-out;
        }

        @keyframes last-click { from { fill-opacity: 0.2; } to { fill-opacity: 0.75; } }

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
        this.setSelectedControl(this.selectedControlId);
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
          if (buttonValue.startsWith('power_') && !document.body?.hasAttribute('data-routed-power')) {
            control.setAttribute('title', 'Power controls require a verified lab configuration.');
            return;
          }
          if (control.matches('.map-button[id]')) {
            window.dispatchEvent(new CustomEvent('remla:control-click', {
              detail: { kind: 'map', deviceName, id: control.id },
            }));
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

  setSelectedControl(id, replay = false) {
    this.selectedControlId = id || '';
    const controls = [...this.shadowRoot.querySelectorAll('.map-button[id][data-cmd]')];
    const selected = controls.find(control => control.id === id);
    for (const control of controls) {
      if (control !== selected) control.classList.remove('selected');
    }
    if (selected) {
      if (replay && selected.classList.contains('selected')) {
        selected.classList.remove('selected');
        void selected.getBoundingClientRect();
      }
      selected.classList.add('selected');
    }
  }

  setPending(pending) {
    this.toggleAttribute('data-command-pending', pending);
  }
}

if (!customElements.get('img-map-device')) {
  customElements.define('img-map-device', imgMapDevice); //this line registers the toggle element so we can use <img-map-device> in our HTML.
}
