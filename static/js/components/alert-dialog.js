export class AlertDialog extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0,0,0,0.4);
          justify-content: center;
          align-items: center;
        }

        .dialog {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          max-width: 300px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        }

        h2, p {
          color: black !important;
        }
      </style>

      <div class="dialog">
        <h2 id="title"></h2>
        <p id="message"></p>
        <button id="close">OK</button>
      </div>
    `;
  }
  
  connectedCallback() {
    this.shadowRoot.querySelector('#close').addEventListener('click', () => {
      this.hide();
    });

    window.addEventListener('alert', (event) => {
      this.show(event.detail);
    });
  }

  show(detail) {
    this.shadowRoot.querySelector('#title').textContent = detail.title;
    this.shadowRoot.querySelector('#message').textContent = detail.message;
    this.style.display = "flex";
  }

  hide() {
    this.style.display = "none";
  }
}

customElements.define('alert-dialog', AlertDialog);