export class Knob extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.defaultImageUrl = '../PhotoElectricEffect/static/imgs/knob.png';

    this.shadowRoot.innerHTML = `
      <style>
        .knob {
          display: inline-flex;
          flex-direction: column;
        }

        h3 {
          text-align: center;
        }

        select {
          margin-bottom: 8px;
        }

        .row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        img {
          width: 60px;
          height: 60px;
        }

        button {
          font-size: 24px;
        }
      </style>

      <div class="knob">
        <h3></h3>
        <select>
          <option value="" disabled>Select an interval</option>
        </select>
        <div class="row">
          <button id="down">&#8634;</button>
          <img id="image" src="${this.knobImageUrl}"/>
          <button id="up">&#8635;</button>
        </div>
      </div>
    `;
  }

  connectedCallback() {
    const label = this.shadowRoot.querySelector('h3');
    const downButton = this.shadowRoot.querySelector('#down');
    const upButton = this.shadowRoot.querySelector('#up');
    const intervalSelect = this.shadowRoot.querySelector('select');

    this.componentId = this.getAttribute('component-id');
    this.intervals = JSON.parse(this.getAttribute('intervals'));
    this.selectedInterval = this.intervals[0];
    this.knobImageUrl = this.getAttribute('knobImageUrl');

    label.textContent = this.getAttribute('label');

    this.intervals.forEach((interval, index) => {
      const option = document.createElement('option');
      option.value = interval;
      option.innerHTML = interval;
      if (index === 0) {
        option.selected = true;
      }

      intervalSelect.appendChild(option);
    });

    const image = this.shadowRoot.querySelector('#image');
    image.src = this.knobImageUrl ? this.knobImageUrl : this.defaultImageUrl;

    intervalSelect.addEventListener('change', (event) => {
      this.selectedInterval = event.target.value;
    });

    downButton.addEventListener('click', () => {
      this.down();
    });

    upButton.addEventListener('click', () => {
      this.up();
    });
  }

  up() {
    this.emit(+this.selectedInterval);
  }

  down() {
    this.emit(-this.selectedInterval);
  }

  emit(value) {
    const knobEvent = new CustomEvent('knob', { detail: { componentId: this.componentId, value: value } });
    window.dispatchEvent(knobEvent);
  }
}

customElements.define('knob-component', Knob);