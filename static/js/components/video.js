export class Video extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.shadowRoot.innerHTML = `
      <style>
        .video {
          display: flex;
          justify-content: center;
          align-items: center;
        }
      </style>

      <div class="video">
        <p>video placeholder<p>
      </div>
    `;
  }

  connectedCallback() {
  }

  emit(value) {
  }
}

customElements.define('video-component', Video);