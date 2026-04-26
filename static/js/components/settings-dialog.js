export class SettingsDialog extends HTMLElement {
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

        h2 {
          color: black !important;
        }
      </style>

      <div class="dialog">
        <h2>Settings Dialog</h2>
        <button id="close">OK</button>
      </div>
    `;
  }

  connectedCallback() {
    this.shadowRoot.querySelector('#close').addEventListener('click', () => {
      this.hide();
    });

    window.addEventListener('keydown', (event) => {
      if (event.metaKey && event.shiftKey && event.key === 'ArrowUp') {
        this.show();
      }
    });

  }

  show() {
    this.style.display = "flex";
  }

  hide() {
    this.style.display = "none";
  }
}

customElements.define('settings-dialog', SettingsDialog);