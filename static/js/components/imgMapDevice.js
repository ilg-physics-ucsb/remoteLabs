export class imgMapDevice extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });


    this.shadowRoot.innerHTML = `
      <style>
        .imgMapDevice {
          display: inline-flex;
          flex-direction: column;
        }

        .image-map-device svg {
          width: 100%;
          height: auto;
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
          const control = event.target instanceof Element ? event.target.closest('[data-cmd]') : null;
          if (!control) {
            return;
          }

          const buttonValue = control.getAttribute('data-cmd');
          const deviceCommand = `${deviceName}/${buttonValue}`
          this.emit(deviceCommand);
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
}

if (!customElements.get('img-map-device')) {
  customElements.define('img-map-device', imgMapDevice); //this line registers the toggle element so we can use <img-map-device> in our HTML.
}