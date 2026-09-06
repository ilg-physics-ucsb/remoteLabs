/**
 * Works in conjunction with 
 */
export class Resizer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .handle {
          width: 4px;
          height: 30px;
          border-radius: 2px;
          background-color: var(--tertiary);
        }

        .handle:hover {
          cursor: col-resize;
        }
      </style>

      <div class="handle"></handle>
    `;
  }

  connectedCallback() {
    const handle = this.shadowRoot.querySelector('.handle');

    const leftElement = document.querySelector('video-component');

    let resizing = false;

    if (!leftElement) {
      console.error('Resizer - the video component could not be found');
      return;
    }

    let pointerOffset = 0;
    let leftToHandle = 0;

    const handleResize = (event) => {
      let leftBounding = leftElement.getBoundingClientRect();

      leftElement.style.width = `${event.clientX - pointerOffset - leftBounding.left - leftToHandle}px`;
    };

    handle.addEventListener('mousedown', (event) => {
      const leftBounding = leftElement.getBoundingClientRect();
      const handleBounding = handle.getBoundingClientRect();

      pointerOffset = event.clientX - handleBounding.left;
      leftToHandle = handleBounding.left - leftBounding.right;

      // Set resizing to true so its known whether the window scoped mouse move
      // listener needs to be removed when mouseup happens
      resizing = true;
      window.addEventListener('mousemove', handleResize);
    });

    window.addEventListener('mouseup', () => {
      if (resizing) {
        window.removeEventListener('mousemove', handleResize);
      }
    });
  }
}

customElements.define('resizer-component', Resizer);