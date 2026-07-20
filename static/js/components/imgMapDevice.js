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

        img {
          width: 100%;
          height: 100%;
          max-width: 128px;
          max-height: 128px;
          cursor: pointer;
        }

      </style>

      <div class="image-map-device">
        What I do to debug spaghetti
      </div>
    `;
  }

  connectedCallback() { //change this to run the insertSVG command;
    // we'll give img-map-url as an attribute to read the data in the html file tha contains the svg
    // this will allow us to use the same component for different svg files, just by changing the attribute in the html file
    // we'll also have to set up an event-listener that will call the function associated with the button presses. 
    
    const mapHTMLfile = this.getAttribute('map-html-file'); 
    const target = this.shadowRoot.querySelector('.image-map-device');    
    fetch(mapHTMLfile)
        .then(response => response.text())
        .then(svgText => {
        target.innerHTML = svgText;
        });

   
    // this.imageMap.addEventListener('click', () => {
    //   this.runCommand();
    // });
  }

  runCommand() { //to be written to use the data-cmd attribute of the svg elements, so that we can send the correct command to the correct device when a button is clicked
   
  }

  emit(value) {
    const toggleEvent = new CustomEvent('toggle', { detail: { componentId: this.componentId, value: value } });
    window.dispatchEvent(toggleEvent);
  }
}

customElements.define('img-map-device', imgMapDevice); //this line registers the toggle element so we can use <img-map-device> in our HTML.