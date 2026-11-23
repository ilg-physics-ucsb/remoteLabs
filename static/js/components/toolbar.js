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
    this.handleCameraChange = this.handleCameraChange.bind(this);

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

      this.selectTool(toolGroupId, 'local');
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
      this.selectTool(firstVisibleButton.getAttribute('group-id'), 'camera');
    }
  }

  selectTool(value, source = 'remote') {
    const buttons = [...this.querySelectorAll('button[group-id]')];
    if (value && !buttons.some(button => button.getAttribute('group-id') === value)) return false;
    buttons.forEach(button => button.classList.toggle('active', Boolean(value) && button.getAttribute('group-id') === value));
    this.selectedGroupId = value;
    this.emit(value, source);
    return true;
  }

  emit(value, source = 'local') {
    const toolbarSelectionEvent = new CustomEvent('toolbarSelection', { detail: { toolGroupId: value, source } });
    window.dispatchEvent(toolbarSelectionEvent);
  }
}

customElements.define('toolbar-component', Toolbar);
