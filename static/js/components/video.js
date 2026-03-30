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
    this.measureEnabled = false;
    this.startCoordinate = [];

    this.shadowRoot.innerHTML = `
      <style>
        .video {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100%;
          position: relative;
        }

        .video:hover .controls {
          opacity: 1;
        }

        .video.measureEnabled {
          cursor: crosshair;
        }

        .video .distance {
          display: none;
          position: fixed;
          pointerEvents: none;
          background: #000000;
          color: #FFFFFF;
          padding: 4px 8px;
          font-size: 12px;
          border-radius: 4px;
          z-index: 9999;
        }

        .video.measureEnabled .distance {
          display: block;
        }

        video {
          width: 100%;
          max-height: 100%;
        }

        .controls {
          position: absolute;
          bottom: 0.5rem;
          right: 0.5rem;
          opacity: 0;
          transition-property: opacity;
          transition-duration: 100ms;
          display: flex;
          gap: 4px;
          padding: 8px;
          background-color: var(--tertiary);
          border-radius: 8px;
        }
      </style>

      <div class="video">
        <video id="video" autoplay src="https://6922136c-83f3-4f95-ad86-9ef1221337ac.mdnplay.dev/shared-assets/videos/flower.webm"></video>
        <div class="controls">
          <button id="take-snapshot" title="Take snapshot">📸 Take Snapshot</button>
          <button id="measure-button" title="Measure">📏 Measure</button>
        </div>
        <div class="distance">Click to start measuring</div>
      </div>
    `;
  }

  connectedCallback() {
    // TODO: show different views/cameras to select from
    this.views = JSON.parse(this.getAttribute('views'));

    const measureButton = this.shadowRoot.querySelector('#measure-button');
    const videoContainer = this.shadowRoot.querySelector('.video');
    const distance = this.shadowRoot.querySelector('.distance');

    measureButton.addEventListener('click', (event) => {
      event.stopPropagation(); // Prevent button click from triggering video container click
      this.measureEnabled = !this.measureEnabled;

      if (this.measureEnabled) {
        const distanceEl = this.shadowRoot.querySelector('.distance');

        videoContainer.classList.add('measureEnabled');
        measureButton.textContent = '❌ Stop Measuring';
        measureButton.title = 'Stop measuring';
        this.repositionLabel(distanceEl, [event.clientX, event.clientY]);
      } else {
        videoContainer.classList.remove('measureEnabled');
        this.startCoordinate = [];
        measureButton.textContent = '📏 Measure';
        measureButton.title = 'Measure';
        distance.textContent = 'Click to start measuring';
      }
    });

    videoContainer.addEventListener('click', (event) => {
      if (this.measureEnabled) {
        this.startCoordinate = [event.clientX, event.clientY];
      }
    });


    videoContainer.addEventListener('mousemove', (event) => {
      if (this.measureEnabled) {
        const distanceEl = this.shadowRoot.querySelector('.distance');

        if (!distanceEl) {
          return;
        }

        const dx = event.clientX - this.startCoordinate[0];
        const dy = event.clientY - this.startCoordinate[1];
        const distance = Math.sqrt(dx * dx + dy * dy);

        this.repositionLabel(distanceEl, [event.clientX, event.clientY]);

        if (!this.startCoordinate.length) {
          distanceEl.textContent = 'Click to start measuring';
        } else {
          distanceEl.textContent = `Distance: ${distance.toFixed(1)}px`;
        }
      }
    });
  }

  repositionLabel(distanceLabel, coordinate) {
    distanceLabel.style.left = `${coordinate[0] + 10}px`;
    distanceLabel.style.top = `${coordinate[1] + 10}px`;
  }
}

customElements.define('video-component', Video);