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
          // overflow: scroll;
        }

        ::slotted(div) {
          display: none;
          flex-direction: column;
          // overflow: scroll;
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

        .sub-tabs {
          display: none;
          flex: 0 0 auto;
          gap: 0.5rem;
        }

        .sub-tabs.visible {
          display: flex;
        }

        .sub-tabs button {
          cursor: pointer;
        }

        .sub-tabs button.active {
          font-weight: bold;
        }
      </style>

      <div class="tool-container">
        <div class="default active">
          <p>Click on a tool below!</p>
        </div>
        <div class="sub-tabs"></div>
        <slot></slot>
      </div>
    `;
  }

  connectedCallback() {
    window.addEventListener('toolbarSelection', (event) => {
      this.selectedGroupId = event.detail.toolGroupId;
      this.render();
    });
  }

  render() {
    const container = this.shadowRoot.querySelector('.tool-container');
    const defaultDiv = container.querySelector('.default');
    const subTabs = container.querySelector('.sub-tabs');
    const slot = container.querySelector('slot');
    const slotted = slot ? slot.assignedElements({ flatten: true }) : [];

    [defaultDiv, ...slotted].forEach(tool => {
      if (tool && tool.classList) {
        tool.classList.remove('active');
      }
    });

    subTabs.innerHTML = '';
    subTabs.classList.remove('visible');

    if (this.selectedGroupId === '') {
      defaultDiv.classList.add('active');
      return;
    }

    const matchesSelectedGroup = (el) => (el.getAttribute('group-id') || el.id) === this.selectedGroupId;
    const groupTools = slotted.filter(matchesSelectedGroup);

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

    if (groupTools.length > 1) {
      subTabs.classList.add('visible');

      groupTools.forEach((tool, index) => {
        const label = tool.getAttribute('data-tool-label')
          || tool.querySelector('.tool-title')?.textContent?.trim()
          || `Tool ${index + 1}`;

        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = label;
        button.classList.toggle('active', index === activeIndex);
        button.addEventListener('click', () => {
          this.groupToolIndex.set(this.selectedGroupId, index);
          this.render();
        });

        subTabs.appendChild(button);
      });
    }
  }
}

customElements.define('tool-detail-component', ToolDetail);
