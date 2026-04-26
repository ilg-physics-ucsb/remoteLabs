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
    this.handleCameraChange = this.handleCameraChange.bind(this);

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

    // Handle cameraChange event emitted by video component to filter
    // toolbar buttons based on camera group.
    window.addEventListener('cameraChange', this.handleCameraChange);
  }

  disconnectedCallback() {
    window.removeEventListener('cameraChange', this.handleCameraChange);
  }

  handleCameraChange(event) {
    const cameraGroupId = event?.detail?.value || '';
    const buttons = Array.from(this.querySelectorAll('button[group-id]'));

    buttons.forEach((button) => {
      const buttonCameraGroup = button.getAttribute('camera-group');
      const isVisible = !cameraGroupId || !buttonCameraGroup || buttonCameraGroup === cameraGroupId;
      const buttonContainer = button.closest('li');

      if (buttonContainer && this.contains(buttonContainer)) {
        buttonContainer.style.display = isVisible ? '' : 'none';
      } else {
        button.style.display = isVisible ? '' : 'none';
      }

      if (!isVisible) {
        button.classList.remove('active');
      }
    });

    const visibleButtons = buttons.filter((button) => button.offsetParent !== null);

    if (visibleButtons.length < 1) {
      return;
    }

    const hasActiveVisibleButton = visibleButtons.some((button) => button.classList.contains('active'));

    if (!hasActiveVisibleButton) {
      const firstVisibleButton = visibleButtons[0];
      firstVisibleButton.classList.add('active');
      this.emit(firstVisibleButton.getAttribute('group-id'));
    }
  }

  emit(value) {
    const toolbarSelectionEvent = new CustomEvent('toolbarSelection', { detail: { toolGroupId: value } });
    window.dispatchEvent(toolbarSelectionEvent);
  }
}

customElements.define('toolbar-component', Toolbar);