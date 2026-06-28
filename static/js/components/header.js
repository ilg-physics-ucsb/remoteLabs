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
          display: flex;
          gap: 1rem;
          align-items: center;
          justify-content: space-between;
          background-color: var(--header-color);
          border-radius: var(--border-radius);
        }

        .button {
          color: var(--light-text);
          background-color: var(--tertiary);
          border-radius: var(--border-radius);
          padding: 0.5rem 1rem;
          border: none;
          cursor: pointer;
        }

        .manuals {
          margin-left: 1rem;
        }

        .toggle {
          margin-right: 1rem;
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
        }

        .manuals-header h2 {
          margin: 0;
        }

        .manuals-menu a {
          padding: 8px 8px 8px 32px;
          text-decoration: none;
          font-size: 25px;
          color: #818181;
          display: block;
        }

        .manuals-menu a:hover {
          color: #f1f1f1;
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
        <button class="manuals button">Manuals</button>
        <div class="text">
          <h1></h1>
          <p class="session-message">This session will end and the motors will reset in <span class="time"></span></p>
        </div>
        <button class="toggle button">temp toggle</button>
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