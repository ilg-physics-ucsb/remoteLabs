/**
 * Used in conjunction with the Toolbar component.
 * Displays the group of tools based on the currently
 * selected tool group in the toolbar.
 */
export class ToolDetail extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.selectedGroupId = '';

    // Remembers which tool within a group was last shown, keyed by group id,
    // so switching away and back to a group restores the same sub-tool.
    this.groupToolIndex = new Map();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          box-sizing: border-box;
        }

        .default {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .tool-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          height: 100%;
          overflow: auto;
        }

        .tool-container div {
          display: none;
          flex-direction: column;
        }

        ::slotted(div) {
          display: none;
          flex-direction: column;
        }

        .active {
          display: flex !important;
        }

        ::slotted(.active) {
          display: flex;
          flex: 1 1 0;
          min-height: 0;
        }

        .default.active {
          flex: 1 1 auto;
        }

        .carousel {
          display: flex;
          flex-direction: row !important;
          flex: 0 0 auto;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .carousel.visible {
          display: flex;
        }

        .carousel button {
          cursor: pointer;
        }

        .carousel button:disabled {
          cursor: not-allowed;
        }
      </style>

      <div class="tool-container">
        <div class="default active">
          <p>Click on a tool below!</p>
        </div>
        <div class="carousel">
          <button type="button" class="prev">Previous</button>
          <span class="carousel-label"></span>
          <button type="button" class="next">Next</button>
        </div>
        <slot></slot>
      </div>
    `;
  }

  connectedCallback() {
    this.shadowRoot.querySelector('.prev').addEventListener('click', () => this.step(-1));
    this.shadowRoot.querySelector('.next').addEventListener('click', () => this.step(1));

    window.addEventListener('toolbarSelection', (event) => {
      this.selectedGroupId = event.detail.toolGroupId;
      this.render();
    });
  }

  step(direction) {
    const count = this.getGroupTools().length;
    if (count < 2) {
      return;
    }

    const current = this.groupToolIndex.get(this.selectedGroupId) || 0;
    const next = current + direction;
    if (next < 0 || next >= count) {
      return;
    }

    this.groupToolIndex.set(this.selectedGroupId, next);
    this.render();
  }

  getGroupTools() {
    const slot = this.shadowRoot.querySelector('slot');
    const slotted = slot ? slot.assignedElements({ flatten: true }) : [];
    return slotted.filter(el => (el.getAttribute('group-id') || el.id) === this.selectedGroupId);
  }

  render() {
    const container = this.shadowRoot.querySelector('.tool-container');
    const defaultDiv = container.querySelector('.default');
    const carousel = container.querySelector('.carousel');
    const slot = container.querySelector('slot');
    const slotted = slot ? slot.assignedElements({ flatten: true }) : [];

    [defaultDiv, ...slotted].forEach(tool => {
      if (tool && tool.classList) {
        tool.classList.remove('active');
      }
    });

    carousel.classList.remove('visible');

    if (this.selectedGroupId === '') {
      defaultDiv.classList.add('active');
      return;
    }

    const groupTools = this.getGroupTools();

    if (!groupTools.length) {
      console.error(`ToolDetail: unable to find tool(s) by group id: ${this.selectedGroupId}`);
      return;
    }

    let activeIndex = this.groupToolIndex.get(this.selectedGroupId) || 0;
    if (activeIndex >= groupTools.length) {
      activeIndex = 0;
    }
    this.groupToolIndex.set(this.selectedGroupId, activeIndex);

    groupTools[activeIndex].classList.add('active');

    const multiple = groupTools.length > 1;
    carousel.classList.toggle('visible', multiple);
    carousel.querySelector('.prev').disabled = activeIndex === 0;
    carousel.querySelector('.next').disabled = activeIndex === groupTools.length - 1;
    carousel.querySelector('.carousel-label').textContent = `(${activeIndex + 1} of ${groupTools.length})`;
  }
}

customElements.define('tool-detail-component', ToolDetail);
