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
    const rightElement = document.querySelector('tool-detail-component');

    let resizing = false;

    if (!leftElement || !rightElement) {
      console.error('Resizer - one or both of the componenets next to the resizer could not be found');
      return;
    }

    const handleResize = () => {
      console.log('moving mouse');
    }

    handle.addEventListener('mousedown', (event) => {
      // Set resizing to true so its known whether the window scoped mouse move
      // listener needs to be removed when mouseup happens
      resizing = true;
      window.addEventListener('mousemove', handleResize);
    });

    window.addEventListener('mouseup', () => {
      if (resizing) {
        window.removeEventListener('mousemove', handleResize);
        console.log('removing');
      }
    });


  }
}

customElements.define('resizer-component', Resizer);