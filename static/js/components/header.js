/**
 * Header component for labs. Contains a title, session timer,
 * a sidenav menu for displaying manuals, and a toggle button.
 */
export class Header extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.shadowRoot.innerHTML = `
      <style>
        .text {
          text-align: center;
        }

        .text h1 {
          margin-bottom: 0.5rem;
        }

        .text p {
          margin-top: 0.5rem;
        }

        .time {
          color: red;
        }

        header {
          display: grid;
          grid-template-columns: 160px auto 160px;
          align-items: center;
          padding: 0.5rem 2rem;
          background-color: var(--header-color);
          border-radius: var(--border-radius);
        }

        .button-container {
          display: flex;
        }

        .button-container:nth-child(1) {
          justify-content: start;
        }

        .button-container:nth-child(2) {
          justify-content: end;
        }

        .button {
          color: var(--light-text);
          background-color: var(--tertiary);
          border-radius: var(--border-radius);
          padding: 0.5rem 1rem;
          border: none;
          cursor: pointer;
        }

        .manuals-menu {
          display: none;
          height: 100%;
          width: 250px;
          position: fixed;
          z-index: 1;
          top: 0;
          left: 0;
          background-color: var(--tertiary);
          overflow-x: hidden;
          padding: 0 1rem;
          border-radius: 0 var(--border-radius) var(--border-radius) 0;
        }

        .manuals-menu .manuals-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .manuals-header h2 {
          margin: 0;
        }

        .toggle {
          display: flex;
          flex-direction: column;
          align-items: end;
          width: 100%;
        }

        .toggle-label {
          text-transform: uppercase;
          font-size: 0.75rem;
          font-weight: bold;
          margin-bottom: 0.25rem;
        }

        toggle-component {
          display: block;
          width: 64px;
        }

        .manuals-menu .close {
          font-size: 36px;
          background: none;
          border: none;
          color: var(--light-text);
          cursor: pointer;
        }
      </style>

      <header>
        <div class="button-container">
          <button class="manuals button">Manuals</button>
        </div>
        <div class="text">
          <h1></h1>
          <p class="session-message">This session will end and the motors will reset in <span class="time"></span></p>
        </div>
        <div class="button-container">
          <div class="toggle">
            <span class="toggle-label">Turn on ambient light</span>
            <toggle-component></toggle-component>
          </div>
        </div>
        <div class="manuals-menu">
          <div class="manuals-header">
            <h2>Manuals</h2>
            <button class="close">&times;</button>
          </div>
          <slot name="manuals"></slot>
        </div>
      </header>
    `;
  }

  connectedCallback() {
    const heading = this.shadowRoot.querySelector('h1');
    const defaultTitle = 'Untitled';

    heading.textContent = this.getAttribute('data-title') || defaultTitle;

    this.handleManualsClick = this.openNav.bind(this);
    this.handleCloseClick = this.closeNav.bind(this);
    this.handleSlotChange = this.attachSidenavCloseListener.bind(this);

    this.manualsButton = this.shadowRoot.querySelector('.manuals');
    this.manualsSlot = this.shadowRoot.querySelector('slot[name="manuals"]');
    this.closeButton = this.shadowRoot.querySelector('.close');
    this.ambientLightSwitch = this.shadowRoot.querySelector('.toggle');

    if (this.manualsButton) {
      this.manualsButton.addEventListener('click', this.handleManualsClick);
    }

    if (this.manualsSlot) {
      this.manualsSlot.addEventListener('slotchange', this.handleSlotChange);
    }

    if (this.closeButton) {
      this.closeButton.addEventListener('click', this.handleCloseClick);
    }

    this.attachSidenavCloseListener();

    // Session time limit in minutes
    const minutesRemaining = parseFloat(this.getAttribute('data-time-limit')) || 0;

    const ambientLightEnabled = this.getAttribute('data-enable-ambient-light') === 'true';

    if (ambientLightEnabled) {
      this.ambientLightSwitch.style.display = 'flex';
    } else {
      this.ambientLightSwitch.style.display = 'none';
    }

    if (minutesRemaining) {
      this.startSessionTimer(minutesRemaining);
    }
  }

  disconnectedCallback() {
    if (this.manualsButton) {
      this.manualsButton.removeEventListener('click', this.handleManualsClick);
    }

    if (this.manualsSlot) {
      this.manualsSlot.removeEventListener('slotchange', this.handleSlotChange);
    }

    if (this.closeButton) {
      this.closeButton.removeEventListener('click', this.handleCloseClick);
      this.closeButton = null;
    }

    if (this.sessionTimerId) {
      clearInterval(this.sessionTimerId);
      this.sessionTimerId = null;
    }
  }

  attachSidenavCloseListener() {
    if (this.closeButton) {
      this.closeButton.removeEventListener('click', this.handleCloseClick);
    }

    const closeButton = this.shadowRoot.querySelector('.close');

    if (closeButton) {
      closeButton.addEventListener('click', this.handleCloseClick);
      this.closeButton = closeButton;
    } else {
      this.closeButton = null;
    }
  }

  getSidenavElement() {
    return this.shadowRoot.querySelector('.manuals-menu');
  }

  startSessionTimer(minutes) {
    const timeSpan = this.shadowRoot.querySelector('.time');

    if (!timeSpan) {
      return;
    }

    if (this.sessionTimerId) {
      clearInterval(this.sessionTimerId);
    }

    let secondsRemaining = Math.max(Math.floor(minutes * 60), 0);

    const renderTime = () => {
      const hours = Math.floor(secondsRemaining / 3600);
      const remainingMinutes = Math.floor((secondsRemaining % 3600) / 60);
      const seconds = secondsRemaining % 60;

      const formattedHours = String(hours).padStart(2, '0');
      const formattedMinutes = String(remainingMinutes).padStart(2, '0');
      const formattedSeconds = String(seconds).padStart(2, '0');

      timeSpan.textContent = formattedHours + ':' + formattedMinutes + ':' + formattedSeconds;
    };

    renderTime();

    this.sessionTimerId = setInterval(() => {
      if (secondsRemaining <= 0) {
        clearInterval(this.sessionTimerId);
        this.sessionTimerId = null;
        return;
      }

      secondsRemaining -= 1;
      renderTime();
    }, 1000);
  }

  openNav() {
    const sidenav = this.getSidenavElement();

    if (sidenav) {
      sidenav.style.display = 'block';
    }
  }

  closeNav() {
    const sidenav = this.getSidenavElement();

    if (sidenav) {
      sidenav.style.display = 'none';
    }
  }
}

customElements.define('header-component', Header);