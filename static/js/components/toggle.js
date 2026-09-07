export class Toggle extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });


    this.shadowRoot.innerHTML = `
      <style>
        :host {
          text-align: center;
        }
        .toggle {
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

      <div class="toggle">
          <img id="toggle-image"/>
      </div>
    `;
  }

  connectedCallback() {

    this.ONImageUrl = this.getAttribute('on-image-url')  //use kabob-case for html attributes, but camelCase for javascript variables
        ? this.getAttribute('on-image-url') 
        : '../static/imgs/figma-components/lightSwitchON.png';
    this.OFFImageUrl = this.getAttribute('off-image-url') //if the attributes are not provided, the component will use the default images defined in the constructor
        ? this.getAttribute('off-image-url') 
        : '../static/imgs/figma-components/lightSwitchOFF.png';

    this.componentId = this.getAttribute('component-id'); //input three attributes: the name and the two images

    this.enabled = false; //initialize the toggle state to false (OFF)

    this.image = this.shadowRoot.querySelector('#toggle-image'); //"#" is used to select an element by its id. In this case, we are selecting the img element with id "toggleimage" that we defined in the shadow DOM.
    this.image.src = this.OFFImageUrl; //set the initial image to OFF



    this.image.addEventListener('click', () => {
      this.toggle();
    });
  }

toggle() {
    this.enabled = !this.enabled;
    this.image.src = this.enabled ? this.ONImageUrl : this.OFFImageUrl;
    this.emit(this.enabled);
  }

  emit(value) {
    const toggleEvent = new CustomEvent('toggle', { detail: { componentId: this.componentId, value: value } });
    window.dispatchEvent(toggleEvent);
  }
}

customElements.define('toggle-component', Toggle); //this line registers the toggle element so we can use <toggle-component> in our HTML.