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

        #up, #down {
          width: 42px;
          height: 97px;
          cursor: pointer;
        }

        #up path, #down path {
          stroke: #076426;
          stroke-width: 11;
          fill: #14A54B;
          transition: fill 0.2s ease, fill-opacity 0.2s ease;
        }

        #up path:hover,
        #down path:hover,
        #up.selected path,
        #down.selected path {
          fill: bisque;
          fill-opacity: 0.75;
        }
      </style>

      <div class="knob">
        <h3></h3>
        <select>
          <option value="">Select an interval</option>
        </select>
        <div class="row">
          <svg id="down" viewBox="0 0 298 722" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M238.5 93.5L169 0C72.5 70 5.5 197.5 5.5 320.5C5.5 414 35.5 502 103 590L55.5 632.5L290 713L244 473L195 511.5C163 478.5 125 406.07 125 320.5C125 241.5 169 153.5 238.5 93.5Z"/>
          </svg>
          <img id="image"/>
          <svg id="up" viewBox="0 0 298 722" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M58.6875 93.5L128.188 0C224.688 70 291.688 197.5 291.688 320.5C291.688 414 261.688 502 194.188 590L241.688 632.5L7.1875 713L53.1875 473L102.188 511.5C134.188 478.5 172.188 406.07 172.188 320.5C172.188 241.5 128.188 153.5 58.6875 93.5Z"/>
          </svg>
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
    this.knobImageUrl = this.getAttribute('knobImageUrl');

    label.textContent = this.getAttribute('label');

    this.intervals.forEach((interval) => {
      const option = document.createElement('option');
      option.value = interval;
      option.innerHTML = interval;

      intervalSelect.appendChild(option);
    });

    const image = this.shadowRoot.querySelector('#image');
    image.src = this.knobImageUrl ? this.knobImageUrl : this.defaultImageUrl;

    intervalSelect.addEventListener('change', (event) => {
      this.selectedInterval = event.target.value;
    });

    downButton.addEventListener('click', () => {
      upButton.classList.remove('selected');
      downButton.classList.add('selected');
      this.down();
    });

    upButton.addEventListener('click', () => {
      downButton.classList.remove('selected');
      upButton.classList.add('selected');
      this.up();
    });
  }

  up() {
    if (!this.selectedInterval) {
      return;
    }
    this.emit(+this.selectedInterval);
  }

  down() {
    if (!this.selectedInterval) {
      return;
    }
    this.emit(-this.selectedInterval);
  }

  emit(value) {
    const knobEvent = new CustomEvent('knob', { detail: { componentId: this.componentId, value: value } });
    window.dispatchEvent(knobEvent);
  }
}

customElements.define('knob-component', Knob);