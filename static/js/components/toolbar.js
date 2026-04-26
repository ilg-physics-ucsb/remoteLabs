/**
 * Used in conjunction with the ToolDetail component.
 * Displays the different tool groups available to the application,
 * allowing selection. Group names and images are provided by
 * the application via slot and selection event is emitted to be
 * listened to by ToolDetail.
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
    const slot = this.shadowRoot.querySelector('slot');

    slot.addEventListener('click', (event) => {
      let toolGroupId = '';

      try {
        toolGroupId = event.target.attributes.getNamedItem('group-id').value;
      } catch (error) {
        console.error('Toolbar was unable to find and emit selected toolbar id: ', error);
        return;
      }

      if (!toolGroupId) {
        console.error('Invalid group id in Toolbar: ', event);
        return;
      }

      // Set active class on selected tool button
      const buttons = this.querySelectorAll('button[group-id]');

      buttons.forEach((button) => {
        if (button.attributes.getNamedItem('group-id').value === toolGroupId) {
          button.classList.add('active');
        } else {
          button.classList.remove('active');
        }
      });

      this.emit(toolGroupId);
    });

    // TODO listen to camera view selection
  }

  emit(value) {
    const toolbarSelectionEvent = new CustomEvent('toolbarSelection', { detail: { toolGroupId: value } });
    window.dispatchEvent(toolbarSelectionEvent);
  }
}

customElements.define('toolbar-component', Toolbar);