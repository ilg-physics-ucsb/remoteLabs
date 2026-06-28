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
      </style>

      <header>
        <button class="manuals button">Manuals</button>
        <div class="text">
          <h1></h1>
          <p class="session-message">This session will end and the motors will reset in <span class="time"></span></p>
        </div>
        <button class="toggle button">temp toggle</button>
        <slot name="menu"></slot>
      </header>
    `;
  }

  connectedCallback() {
    const heading = this.shadowRoot.querySelector('h1');
    const sessionMessage = this.shadowRoot.querySelector('p');
    const defaultTitle = 'Untitled';

    heading.textContent = this.getAttribute('data-title') || defaultTitle;

    // Session time limit in minutes
    const minutesRemaining = parseFloat(this.getAttribute('data-time-limit')) || 0;

    if (minutesRemaining) {
      this.startSessionTimer(minutesRemaining);
    }
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
}

customElements.define('header-component', Header);