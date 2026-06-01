export class Header extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.title = '';

    this.shadowRoot.innerHTML = `
      <style>
        header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        button {
        }
        

      </style>

      <header>
        <button>menu</button>
        <h1></h1>
        <button>temp toggle</button>
      </header>
    `;
  }

  connectedCallback() {
    const heading = this.shadowRoot.querySelector('h1');

    this.title = this.getAttribute('data-title');
    heading.textContent = this.title || 'Untitled';
  }
}

customElements.define('header-component', Header);