export class AlertDialog extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.notices = [];
    this.currentNotice = null;
    this.confirmation = null;
    this.previousFocus = null;
    this.onAlert = (event) => this.show(event.detail);
    this.onDisconnect = () => {
      this.notices = [];
      this.currentNotice = null;
      if (this.confirmation) {
        this.confirmation.resolve(null);
        this.confirmation = null;
      }
      this.close();
    };
    this.onControl = (event) => {
      if (event.detail?.handoffRequired === false && this.confirmation?.kind === 'handoff') {
        this.cancelConfirmation();
      }
    };

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: none;
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(0, 0, 0, 0.6);
          justify-content: center;
          align-items: center;
          padding: 1rem;
          box-sizing: border-box;
        }

        .dialog {
          box-sizing: border-box;
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          width: min(100%, 420px);
          max-height: 90vh;
          overflow: auto;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        }

        :host([data-severity="warning"]) .dialog { border-top: 5px solid #b26800; }
        :host([data-severity="error"]) .dialog { border-top: 5px solid #ad1d1d; }

        h2, p { color: black; }
        .buttons { display: flex; justify-content: flex-end; gap: 0.75rem; }
        button[hidden] { display: none; }
      </style>

      <div class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="title"
          aria-describedby="message" tabindex="-1">
        <h2 id="title"></h2>
        <p id="message"></p>
        <div class="buttons">
          <button id="close" type="button">OK</button>
          <button id="no" type="button" hidden>No</button>
          <button id="yes" type="button" hidden>Yes</button>
        </div>
      </div>
    `;
    this.shadowRoot.querySelector('#close').addEventListener('click', () => this.hide());
    this.shadowRoot.querySelector('#yes').addEventListener('click', () => this.answer(true));
    this.shadowRoot.querySelector('#no').addEventListener('click', () => this.answer(false));
    this.shadowRoot.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (!this.confirmation) this.hide();
      }
      if (event.key === 'Tab') {
        const buttons = [...this.shadowRoot.querySelectorAll('button:not([hidden])')];
        const active = this.shadowRoot.activeElement;
        if (event.shiftKey && (active === buttons[0] || active === this.shadowRoot.querySelector('.dialog'))) {
          event.preventDefault();
          buttons.at(-1).focus();
        } else if (!event.shiftKey && (active === buttons.at(-1) || active === this.shadowRoot.querySelector('.dialog'))) {
          event.preventDefault();
          buttons[0].focus();
        }
      }
    });
  }

  connectedCallback() {
    window.addEventListener('remla:alert', this.onAlert);
    window.addEventListener('remla:connection-closed', this.onDisconnect);
    window.addEventListener('remla:ownership-control', this.onControl);
    window.remlaJsonAlertReady = true;
    for (const alert of window.remlaJsonPendingAlerts?.splice(0) || []) this.show(alert);
  }

  disconnectedCallback() {
    window.removeEventListener('remla:alert', this.onAlert);
    window.removeEventListener('remla:connection-closed', this.onDisconnect);
    window.removeEventListener('remla:ownership-control', this.onControl);
    window.remlaJsonAlertReady = false;
    this.onDisconnect();
  }

  show(detail) {
    if (typeof detail?.message !== 'string' || !detail.message) return;
    const status = /^Experiment\/controlStatus\/[01],(.*)$/.exec(detail.message);
    if (status) {
      // Routine ownership status is already shown in the queue header.
      if (/^(You have control of the lab equipment|You are connected but do not have control|Choose CONTROL\/handoff\/)/.test(status[1])) return;
      detail = { ...detail, message: status[1] };
    }
    this.notices.push(detail);
    if (this.notices.length > 10) this.notices.shift();
    if (!this.confirmation && !this.currentNotice) this.showNext();
  }

  dismiss(kind) {
    this.notices = this.notices.filter(notice => notice?.kind !== kind);
    if (this.currentNotice?.kind === kind) {
      this.currentNotice = null;
      if (!this.confirmation) this.showNext();
    }
  }

  showNext() {
    this.currentNotice = this.notices.shift() || null;
    if (this.currentNotice) this.render(this.currentNotice, false);
    else this.close();
  }

  confirm(detail) {
    if (this.confirmation) return this.confirmation.promise;
    if (this.currentNotice) {
      this.notices.unshift(this.currentNotice);
      this.currentNotice = null;
    }
    let resolve;
    const promise = new Promise((done) => { resolve = done; });
    this.confirmation = { resolve, promise, kind: detail?.kind };
    this.render(detail, true);
    return promise;
  }

  render(detail, asking) {
    if (this.style.display !== 'flex') {
      this.previousFocus = document.activeElement;
      while (this.previousFocus?.shadowRoot?.activeElement) {
        this.previousFocus = this.previousFocus.shadowRoot.activeElement;
      }
    }
    this.shadowRoot.querySelector('#title').textContent = typeof detail?.title === 'string' ? detail.title : 'ReMLA';
    this.shadowRoot.querySelector('#message').textContent = typeof detail?.message === 'string' ? detail.message : '';
    this.dataset.severity = ['info', 'warning', 'error'].includes(detail?.severity) ? detail.severity : 'info';
    this.shadowRoot.querySelector('#close').hidden = asking;
    this.shadowRoot.querySelector('#yes').hidden = !asking;
    this.shadowRoot.querySelector('#no').hidden = !asking;
    this.style.display = 'flex';
    this.shadowRoot.querySelector(asking ? '.dialog' : '#close').focus();
  }

  answer(value) {
    if (!this.confirmation) return;
    const { resolve } = this.confirmation;
    this.confirmation = null;
    resolve(value);
    this.showNext();
  }

  cancelConfirmation() {
    if (!this.confirmation) return;
    const { resolve } = this.confirmation;
    this.confirmation = null;
    resolve(null);
    this.showNext();
  }

  hide() {
    if (this.confirmation) return;
    this.currentNotice = null;
    this.showNext();
  }

  close() {
    this.style.display = 'none';
    this.previousFocus?.focus?.();
    this.previousFocus = null;
  }
}

customElements.define('alert-dialog', AlertDialog);
