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
          display: flex;
          align-items: center;
          justify-content: center;
        }

        img {
          width: 100%;
          height: 100%;
          max-width: var(--toggle-fit-max-width, var(--toggle-legacy-max-width, 128px));
          max-height: var(--toggle-fit-max-height, 128px);
          cursor: pointer;
        }

        @container tool-control (min-height: 0px) {
          .toggle {
            width: 100%;
            height: 100%;
          }

          img {
            width: min(100cqw, calc(100cqh * var(--toggle-ratio, 1)));
            height: min(100cqh, calc(100cqw * var(--toggle-inverse-ratio, 1)));
          }
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
        : 'static/imgs/figma-components/lightSwitchON.png';
    this.OFFImageUrl = this.getAttribute('off-image-url') //if the attributes are not provided, the component will use the default images defined in the constructor
        ? this.getAttribute('off-image-url') 
        : 'static/imgs/figma-components/lightSwitchOFF.png';
    this.maxWidth = this.getAttribute('max-width')
      ? this.getAttribute('max-width')
      : '128px';

    this.componentId = this.getAttribute('component-id'); //input three attributes: the name and the two images
    this.deviceName = this.getAttribute('device-name');

    this.enabled = false; //initialize the toggle state to false (OFF)

    this.image = this.shadowRoot.querySelector('#toggle-image'); //"#" is used to select an element by its id. In this case, we are selecting the img element with id "toggleimage" that we defined in the shadow DOM.
    this.style.setProperty('--toggle-legacy-max-width', this.maxWidth);
    this.image.addEventListener('load', () => {
      this.style.setProperty('--toggle-ratio', this.image.naturalWidth / this.image.naturalHeight);
      this.style.setProperty('--toggle-inverse-ratio', this.image.naturalHeight / this.image.naturalWidth);
    });
    this.image.src = this.OFFImageUrl; //set the initial image to OFF

    this.image.addEventListener('click', () => {
      this.toggle();
    });
  }

toggle() {
    if (this.pending) {
      return;
    }
    const requestedState = !this.enabled;
    if (this.deviceName) {
      this.setPending(true);
      this.image.src = requestedState ? this.ONImageUrl : this.OFFImageUrl;
    } else {
      this.setState(requestedState);
    }
    this.emit(requestedState);
  }

  setState(enabled) {
    this.enabled = Boolean(enabled);
    if (this.image) {
      this.image.src = this.enabled ? this.ONImageUrl : this.OFFImageUrl;
    }
  }

  setPending(pending) {
    this.pending = Boolean(pending);
    if (this.image) {
      this.image.style.opacity = this.pending ? '0.5' : '1';
      this.image.style.pointerEvents = this.pending ? 'none' : 'auto';
      if (!this.pending) {
        this.image.src = this.enabled ? this.ONImageUrl : this.OFFImageUrl;
      }
    }
  }

  emit(value) {
    const toggleEvent = new CustomEvent('toggle', { detail: { componentId: this.componentId, value: value } });
    window.dispatchEvent(toggleEvent);
    if (this.deviceName) {
      window.dispatchEvent(new CustomEvent('remla-command', {
        detail: {
          deviceName: this.deviceName,
          commandName: value ? 'power_on' : 'power_off',
          arguments: [],
          source: this,
        },
      }));
    }
  }
}

customElements.define('toggle-component', Toggle); //this line registers the toggle element so we can use <toggle-component> in our HTML.
