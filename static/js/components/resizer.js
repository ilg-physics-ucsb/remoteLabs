export class Resizer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .handle {
          width: 4px;
          height: 30px;
          border-radius: 2px;
          background-color: var(--tertiary);
        }

        .handle:hover {
          cursor: col-resize;
        }
      </style>

      <div class="handle"></handle>
    `;
  }

  connectedCallback() {
  }
}

customElements.define('resizer-component', Resizer);