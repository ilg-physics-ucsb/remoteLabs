/**
 * Allows students to resize the video stream and tool detail windows.
 * 
 * @param attribute allow-resize: string e.g. "true", "false" whether the student should be able to resize or not.
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

    const allowResize = this.getAttribute('allow-resize');

    // If not set to allow resizing in the lab html, hide the handle
    // and don't allow resizing.
    if (allowResize !== 'true') {
      handle.style.display = 'none';
      return;
    }

    let resizing = false;

    if (!leftElement) {
      console.error('Resizer - the video component could not be found');
      return;
    }

    let pointerOffset = 0;
    let leftToHandle = 0;

    const rightBoundary = 200;
    const leftBoundary = 200;

    const handleResize = (event) => {
      // If user is close to the edge of the window, exit to prevent the layout from breaking.
      if (event.clientX < leftBoundary || event.clientX > window.innerWidth - rightBoundary) {
        return;
      }

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