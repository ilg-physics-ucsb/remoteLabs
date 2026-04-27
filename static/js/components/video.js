/**
 * Connects the video
 */

/**
 * TODO
 * camera selection (should emit message for application to pass to API) name: display in UI, id: API knows (zak)
 * connect to video feed
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

        .video .start-marker {
          display: none;
          position: absolute;
          width: 5px;
          height: 5px;
          background-color: #FFFFFF;
          border-radius: 50%;
          border: solid 1px #000000;
          pointer-events: none;
          z-index: 2;
        }

        .video .distance-path {
          display: none;
          position: absolute;
          height: 1px;
          border-bottom: dashed 1px #000000;
          border-top: dashed 1px #FFFFFF;
          transform-origin: left center;
          pointer-events: none;
          z-index: 1;
        }

        .video.measureEnabled .distance,
        .video.measureEnabled .distance-path {
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

        .views {
          display: none;
        }

        .views.has-views {
            display: flex;
            gap: 0.5rem;
            padding: 0 2rem;
            margin: 0.5rem 0 1.5rem 0;
            justify-content: center;
        }

        .views button {
          background-color: #5E5E5E;
          color: #FFFFFF;
          border: none;
          border-radius: 1rem;
          padding: 0.5rem 1rem;
          cursor: pointer;
          text-transform: uppercase;
        }

        .views button.active {
          background-color: #0D8B28
        }
      </style>

      <div class="views"></div>
      <div class="video">
        <video id="video" autoplay src="https://6922136c-83f3-4f95-ad86-9ef1221337ac.mdnplay.dev/shared-assets/videos/flower.webm"></video>
        <div class="controls">
          <button id="take-snapshot" title="Take snapshot">📸 Take Snapshot</button>
          <button id="measure-button" title="Measure">📏 Measure</button>
        </div>
        <div class="distance">Click to start measuring</div>
        <div class="distance-path"></div>
        <div class="start-marker"></div>
      </div>
    `;
  }

  connectedCallback() {
    const videoContainer = this.shadowRoot.querySelector('.video');
    const measureButton = this.shadowRoot.querySelector('#measure-button');
    const snapshotButton = this.shadowRoot.querySelector('#take-snapshot');
    const distance = this.shadowRoot.querySelector('.distance');
    const distancePath = this.shadowRoot.querySelector('.distance-path');
    const startMarker = this.shadowRoot.querySelector('.start-marker');

    // Set up camera views when provided
    this.setUpCameraViews();

    measureButton.addEventListener('click', (event) => {
      event.stopPropagation(); // Prevent button click from triggering video container click
      this.measureEnabled = !this.measureEnabled;

      if (this.measureEnabled) {
        const distanceLabel = this.shadowRoot.querySelector('.distance');

        videoContainer.classList.add('measureEnabled');
        measureButton.textContent = '❌ Stop Measuring';
        measureButton.title = 'Stop measuring';
        this.repositionLabel(distanceLabel, [event.clientX, event.clientY]);
      } else {
        videoContainer.classList.remove('measureEnabled');
        this.startCoordinate = [];
        measureButton.textContent = '📏 Measure';
        measureButton.title = 'Measure';
        distance.textContent = 'Click to start measuring';

        // remove class instead
        startMarker.style.display = 'none';
        distancePath.style.display = 'none';
      }
    });

    snapshotButton.addEventListener('click', () => {
      // implement GET for once snapshot is made available for download
      console.warn('snapshot not yet implemented');
    });

    videoContainer.addEventListener('click', (event) => {
      if (this.measureEnabled) {
        this.startCoordinate = this.getRelativeCoordinate(videoContainer, event);

        // add class instead
        startMarker.style.display = 'block';
        startMarker.style.left = `${this.startCoordinate[0] - 3}px`;
        startMarker.style.top = `${this.startCoordinate[1] -3}px`;

        distancePath.style.display = 'block';
        distancePath.style.left = `${this.startCoordinate[0]}px`;
        distancePath.style.top = `${this.startCoordinate[1]}px`;
        distancePath.style.width = '0px';
        distancePath.style.transform = 'rotate(0deg)';
      }
    });


    videoContainer.addEventListener('mousemove', (event) => {
      if (this.measureEnabled) {
        const distanceLabel = this.shadowRoot.querySelector('.distance');

        if (!distanceLabel) {
          return;
        }

        const currentCoordinate = this.getRelativeCoordinate(videoContainer, event);
        const dx = currentCoordinate[0] - this.startCoordinate[0];
        const dy = currentCoordinate[1] - this.startCoordinate[1];
        const distance = Math.sqrt(dx * dx + dy * dy);

        this.repositionLabel(distanceLabel, [event.clientX, event.clientY]);

        if (!this.startCoordinate.length) {
          distanceLabel.textContent = 'Click to start measuring';
          distancePath.style.display = 'none';
        } else {
          distanceLabel.textContent = `Distance: ${distance.toFixed(1)}px`;
          distancePath.style.display = 'block';
          distancePath.style.left = `${this.startCoordinate[0]}px`;
          distancePath.style.top = `${this.startCoordinate[1]}px`;
          distancePath.style.width = `${distance}px`;
          distancePath.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
        }
      }
    });
  }

  getRelativeCoordinate(container, event) {
    const rect = container.getBoundingClientRect();

    return [event.clientX - rect.left, event.clientY - rect.top];
  }

  repositionLabel(distanceLabel, coordinate) {
    distanceLabel.style.left = `${coordinate[0] + 10}px`;
    distanceLabel.style.top = `${coordinate[1] + 10}px`;
  }

  setUpCameraViews() {
    let views = [];

    try {
      views = JSON.parse(this.dataset.views);
    } catch (e) {
      console.warn('Failed to parse views for video component.', e);
    }

    if (views.length < 1) {
      return;
    }

    const viewsContainer = this.shadowRoot.querySelector('.views');
    viewsContainer.classList.add('has-views');

    views.forEach((view) => {
      const button = document.createElement('button');
      button.textContent = view.name;
      button.setAttribute('view-name', view.name);
      button.setAttribute('view-id', view.id);
      viewsContainer.appendChild(button);
    });

    const buttons = viewsContainer.querySelectorAll('button');

    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const cameraId = button.getAttribute('view-id');

        buttons.forEach((btn) => btn.classList.remove('active'));
        button.classList.add('active');

        this.emit(cameraId);
      });
    });

    // Set first view as active by default.
    buttons[0].click();
  }

  emit(value) {
    const cameraEvent = new CustomEvent('cameraChange', { detail: { value: value } });
    window.dispatchEvent(cameraEvent);
  }
}

customElements.define('video-component', Video);