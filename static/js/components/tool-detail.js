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
          height: 100%;
        }

        .tool-container div {
          display: none;
          height: 100%;
          flex-direction: column;
          // overflow: scroll;
        }

        ::slotted(div) {
          display: none;
          height: 100%;
          flex-direction: column;
          // overflow: scroll;
        }

        .active {
          display: flex !important;
        }

        ::slotted(.active) {
          display: flex;
        }
      </style>

      <div class="tool-container">
        <div class="default active">
          <p>Click on a tool below!</p>
        </div>
        <slot></slot>
      </div>
    `;
  }

  connectedCallback() {
    window.addEventListener('toolbarSelection', (event) => {
      this.selectedGroupId = event.detail.toolGroupId;

      const container = this.shadowRoot.querySelector('.tool-container');
      const defaultDiv = container.querySelector('.default');
      const slot = container.querySelector('slot');
      const slotted = slot ? slot.assignedElements({ flatten: true }) : [];

      const tools = [defaultDiv, ...slotted];

      tools.forEach(tool => {
        if (tool && tool.classList) {
          tool.classList.remove('active');
        }
      });

      const selectedTool = slotted.find(el => el.id === this.selectedGroupId) || (this.selectedGroupId === '' ? defaultDiv : null);

      if (selectedTool && selectedTool.classList) {
        selectedTool.classList.add('active');
      } else {
        console.error(`ToolDetail: unable to find tool by id: ${this.selectedGroupId}`);
      }
    });
  }
}

customElements.define('tool-detail-component', ToolDetail);