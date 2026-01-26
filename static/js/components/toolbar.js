/**
 * Used in conjunction with the ToolDetail component.
 * Displays the different tool groups available to the application,
 * allowing selection. Group names and images are provided by
 * the application via slot and selection event is emitted to be
 * heard by ToolDetail.
 */
export class Toolbar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          box-sizing: border-box;
        }
      </style>

      <div class="toolbar">
        <slot></slot>
      </div>
    `;
  }

  connectedCallback() {

  }

  emit(value) {
    const toolbarEvent = new CustomEvent('toolbar', { detail: {} });
    window.dispatchEvent(toolbarEvent);
  }
}

customElements.define('toolbar-component', Toolbar);