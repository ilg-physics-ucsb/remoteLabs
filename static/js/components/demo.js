/**
 * See MDN docs: https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements
 * 
 * This component takes an integer input, multiplies it by 2 and displays the result.
 */
export class Demo extends HTMLElement {
  constructor() {
    /**
     * Calls the HTMLElement constructor so the Demo element gets all of the behavior
     * that standard HTML elements have.
     */
    super();

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM
     * 
     * Attaches a shadow DOM tree to the instance of the custom element.
     * When mode is open, the shadow DOM can be accessed by javascript
     * outside of the element. When closed, it cannot. The shadow DOM can
     * be used to encapsulate styles and markup so that they don't affect
     * (and also are not affected by) the rest of the document and its elements.
     */
    this.attachShadow({ mode: 'open' });

    /**
     * The innerHTML of the shadow root defines the HTML content for a component.
     * 
     * A note on styles. When using the shadow DOM, styles defined in the
     * main document do not affect the elements in the shadow DOM, and
     * vice versa.
     * 
     * Styles for web component shadow dom are defined in the shadow root
     * as with the style tag below.
     */
    this.shadowRoot.innerHTML = `
      <style>
        .demo {
          color: pink;
        }
      </style>

      <div class="demo">
        <h2>Demo Component</h2>
        <p>result: <span id="result"></span></p>
        <button id="button">Double</button>
      </div>
    `;
  }

  /**
   * Called each time the element is added to the document. Developers should
   * implement custom element setup like event listeners, component logic in
   * this callback rather than in the constructor.
   */
  connectedCallback() {
    // Get the input value from the HTML template. This input is a simple
    // integer, but input can also be JSON strings that can be parsed into
    // objects for more complex use cases.
    let result = parseInt(this.getAttribute('data-input'));

    // Throw an error to let developer know that a critical input
    // is missing.
    if (!result) {
      throw new Error('Demo component requires a data-input attribute with an integer value.');
    }

    const button = this.shadowRoot.querySelector('#button');
    const resultSpan = this.shadowRoot.querySelector('#result');

    button.addEventListener('click', () => {
      // Double the current value.
      result = this.double(result);

      // Display the updated value.
      resultSpan.textContent = result;

      // TODO: emit event and explain
      this.emit(result);
    });
  }

  /**
   * A user provided method that doubles the input value.
   */
  double(input) {
    return input * 2;
  }

  /**
   * A user provided method that emits the latest value as
   * a custom demo event. Other components, or the main application
   * script may care about this and can listen for the event
   * to react to it.
   */
  emit(multiple) {
    const demoEvent = new CustomEvent('demo', { detail: { multiple: multiple } });
    window.dispatchEvent(demoEvent);
  }

  /**
   * Called each time the element is removed from the document.
   */
  disconnectedCallback() {}

  /**
   * When defined, this is called instead of connectedCallback() and
   * disconnectedCallback() each time the element is moved to a different
   * place in the DOM via Element.moveBefore(). Use this to avoid running
   * initialization/cleanup code in the connectedCallback() and
   * disconnectedCallback() callbacks when the element is not actually being
   * added to or removed from the DOM. See Lifecycle callbacks and
   * state-preserving moves for more details.
   */
  connectedMoveCallback() {}

  /**
   * Called each time the element is moved to a new document.
   */
  adoptedCallback() {}

  /**
   * Called when attributes are changed, added, removed, or replaced. See
   * Responding to attribute changes for more details about this callback.
   * https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements#responding_to_attribute_changes
   */
  attributeChangedCallback() {}
}

/**
 * Registers the custom element with the browser so that it can be used like
 * standard HTML elements: <demo-component></demo-component>
 */
customElements.define("demo-component", Demo);