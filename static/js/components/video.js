/**
 * Connects the video
 */

/**
 * TODO
 * camera selection (should emit message for application to pass to API) name: display in UI, id: API knows (zak)
 * connect to video feed
 * pixel measuring tool
 * camera settings: exposure, brightness, contrast
 */
export class Video extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.shadowRoot.innerHTML = `
      <style>
        .video {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100%;
        }

        video {
          width: 100%;
          max-height: 100%;
          height: 100%;
          object-fit: contain;
        }
      </style>

      <div class="video">
        <video id="video" autoplay src="https://6922136c-83f3-4f95-ad86-9ef1221337ac.mdnplay.dev/shared-assets/videos/flower.webm"></video>
      </div>
    `;
  }

  connectedCallback() {
    this.views = JSON.parse(this.getAttribute('views'));
  }

  emit(value) {
  }
}

customElements.define('video-component', Video);