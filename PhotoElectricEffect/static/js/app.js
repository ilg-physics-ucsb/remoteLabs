const LAMP_DEVICE = "HgNeLamp";
const AMBIENT_DEVICE = "Ambient";

function applyRemoteState(devices) {
  for (const deviceName of [LAMP_DEVICE, AMBIENT_DEVICE]) {
    const state = devices?.[deviceName]?.power;
    if (state !== "on" && state !== "off") {
      continue;
    }
    if (deviceName === LAMP_DEVICE) {
      document.querySelector('toggle-component[device-name="HgNeLamp"]')?.setState(state === "on");
    } else {
      document.querySelector('header-component')?.setAmbientLightState(state === "on");
    }
  }
}

function sendCommand({ deviceName, commandName, arguments: args = [] }) {
  if (typeof window.remlaCommand !== "function") {
    return Promise.reject(new Error("The ReMLA JSON client did not load"));
  }
  return window.remlaCommand(deviceName, commandName, args);
}

let handoffPromptPending = false;
let handoffCancelled = false;
let controlState = window.remlaJsonLatestControl || null;
let queueState = window.remlaJsonLatestQueue || null;
let queueNoticeShown = false;
let queueNoticePending = false;
let queueSession = 0;
let followingController = true;
let uiState = window.remlaJsonLatestUiState || null;
let publishScheduled = false;
let publishPending = Promise.resolve();
let publishGeneration = 0;
let lastControl = null;
let lastControlRevision = 0;
let displayedControlRevision = null;
let snapshotGeneration = 0;
let snapshotPending = false;
let snapshotAbort = null;

function updateSnapshotAvailability() {
  document.querySelectorAll('video-component').forEach(video => {
    video.setSnapshotState?.({ enabled: hasControl(), pending: snapshotPending });
  });
}

function invalidateSnapshot() {
  snapshotGeneration++;
  snapshotAbort?.abort();
}

function snapshotFailureAlert(error) {
  if (error?.code === 'snapshot_limit') {
    if (error.detail === 'Snapshot cooldown is active') {
      return { title: 'Snapshot cooldown', severity: 'info',
        message: 'There is a required 10-second waiting period between taking pictures. Please wait before taking another snapshot.' };
    }
    if (error.detail === 'Snapshot interruption budget is exhausted') {
      return { title: 'Snapshot limit reached', severity: 'warning',
        message: 'Snapshot limit reached: 100 attempts per hour. Please try again later.' };
    }
    if (error.detail === 'A snapshot is already in progress') {
      return { title: 'Snapshot in progress', severity: 'info',
        message: 'A snapshot is already in progress. Please wait.' };
    }
  }
  if (error?.code === 'snapshot_unavailable') {
    return { title: 'Snapshot failed', severity: 'error',
      message: 'Snapshot failed: capture could not be completed. Please check the live video.' };
  }
  if (error instanceof Error && error.message === 'Snapshot download failed') {
    return { title: 'Snapshot failed', severity: 'error',
      message: 'Snapshot failed: download was unavailable. Please try again later.' };
  }
  return { title: 'Snapshot failed', severity: 'error',
    message: 'Snapshot failed. Please try again when the live video returns.' };
}

window.addEventListener('remla:snapshot-request', async (event) => {
  const source = event.detail?.source;
  if (!hasControl() || snapshotPending || source?.localName !== 'video-component' || !source.isConnected) return;
  const generation = snapshotGeneration;
  const current = () => generation === snapshotGeneration && hasControl() && source.isConnected;
  snapshotPending = true;
  snapshotAbort = new AbortController();
  updateSnapshotAvailability();
  try {
    const result = await sendCommand({ deviceName: 'Experiment', commandName: 'capture_still', arguments: {} });
    if (!current()) return;
    const data = result?.data;
    if (data?.downloadPath !== 'ws/snapshot' || data.mimeType !== 'image/png'
        || typeof data.token !== 'string' || !/^[A-Za-z0-9._~+/-]+=*$/.test(data.token)
        || !Number.isSafeInteger(data.width) || data.width <= 0
        || !Number.isSafeInteger(data.height) || data.height <= 0) {
      throw new Error('Invalid snapshot response');
    }
    const endpoint = new URL('ws/snapshot', new URL('.', window.location.href));
    const response = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${data.token}` },
      credentials: 'same-origin', cache: 'no-store', redirect: 'error', signal: snapshotAbort.signal,
    });
    if (!current()) return;
    if (!response.ok) throw new Error('Snapshot download failed');
    const blob = await response.blob();
    if (!current()) return;
    if (blob.type !== 'image/png' || blob.size === 0) throw new Error('Invalid snapshot image');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    try {
      link.href = url;
      link.download = 'snapshot.png';
      document.body.append(link);
      link.click();
    } finally {
      link.remove();
      // Allow the browser to resolve the synthetic click before releasing its blob.
      setTimeout(() => URL.revokeObjectURL(url), 200);
    }
  } catch (error) {
    // Transport errors can contain private ticket details; never render or log them.
    if (current()) window.dispatchEvent(new CustomEvent('remla:alert', { detail: snapshotFailureAlert(error) }));
  } finally {
    snapshotPending = false;
    snapshotAbort = null;
    updateSnapshotAvailability();
    if (source.isConnected) source.connectWhepFeed?.();
  }
});

function currentView() {
  return {
    selectedTool: document.querySelector('toolbar-component')?.selectedGroupId || '',
    potInterval: document.querySelector('knob-component[device-name="Pot"]')?.selectedInterval || '',
    ...(lastControl && {
      lastControlKind: lastControl.kind,
      lastControlDevice: lastControl.deviceName,
      lastControlId: lastControl.id,
      lastControlRevision,
    }),
  };
}

function controls() {
  return [
    ...document.querySelectorAll('tool-detail-component knob-component, tool-detail-component img-map-device, tool-detail-component toggle-component'),
    document.querySelector('header-component')?.shadowRoot?.querySelector('toggle-component[device-name="Ambient"]'),
  ].filter(Boolean);
}

function showLastControl(kind, deviceName, id, replay = false) {
  for (const control of controls()) {
    const matches = (kind === 'knob' && control.localName === 'knob-component')
      || (kind === 'map' && control.localName === 'img-map-device')
      || (kind === 'toggle' && control.localName === 'toggle-component');
    const selected = matches && control.getAttribute('device-name') === deviceName ? id : '';
    control.setSelectedControl?.(selected, replay && Boolean(selected));
  }
}

function clearView() {
  document.querySelector('toolbar-component')?.selectTool('');
  document.querySelector('knob-component[device-name="Pot"]')?.setInterval('');
  showLastControl('', '', '');
  lastControl = null;
  displayedControlRevision = null;
}

function publishValues(values) {
  const generation = publishGeneration;
  publishPending = publishPending.catch(() => {}).then(() => {
    if (generation === publishGeneration && hasControl()) return window.remlaUiState('photoelectric', values);
  }).catch(error => console.error('Photoelectric UI state failed', error));
}

function publishView(immediate = false) {
  if (!hasControl() || typeof window.remlaUiState !== 'function') return;
  if (immediate) {
    publishValues(currentView());
    return;
  }
  if (publishScheduled) return;
  publishScheduled = true;
  queueMicrotask(() => {
    publishScheduled = false;
    if (hasControl()) publishValues(currentView());
  });
}

function recordClick(kind, deviceName, id) {
  if (!hasControl() || typeof id !== 'string' || !id || id.length > 80) return;
  lastControl = { kind, deviceName, id };
  lastControlRevision = lastControlRevision < Number.MAX_SAFE_INTEGER ? lastControlRevision + 1 : 1;
  showLastControl(kind, deviceName, id, kind !== 'knob' || id === 'interval');
  publishView(true);
}

function showControllerClick(values) {
  const { lastControlKind: kind, lastControlDevice: deviceName, lastControlId: id,
    lastControlRevision: revision } = values;
  const valid = ['knob', 'map', 'toggle'].includes(kind)
    && typeof deviceName === 'string' && typeof id === 'string'
    && Number.isSafeInteger(revision) && revision > 0;
  const replay = valid && displayedControlRevision !== null && revision !== displayedControlRevision;
  displayedControlRevision = valid ? revision : null;
  showLastControl(valid ? kind : '', valid ? deviceName : '', valid ? id : '', replay);
}

function applyControllerView() {
  if (hasControl() || !followingController || !controlState) return;
  const values = uiState?.namespaces?.photoelectric;
  if (!values) {
    clearView();
    return;
  }
  if (!isWaitingForControl()) return;
  document.querySelector('toolbar-component')?.selectTool(
    typeof values.selectedTool === 'string' ? values.selectedTool : ''
  );
  document.querySelector('knob-component[device-name="Pot"]')?.setInterval(
    typeof values.potInterval === 'string' ? values.potInterval : ''
  );
  showControllerClick(values);
}

function hasControl() {
  return controlState?.hasControl === true && controlState.lifecycle === 'ready'
    && controlState.handoffRequired !== true;
}

function updateControlAvailability() {
  updateSnapshotAvailability();
  const disabled = !hasControl();
  document.body?.toggleAttribute('data-remla-controls-disabled', disabled);
  document.querySelectorAll('tool-detail-component .tool-interface').forEach(interfaceElement => {
    interfaceElement.querySelectorAll('toggle-component, knob-component, img-map-device').forEach(control => {
      control.inert = disabled;
      control.setAttribute('aria-disabled', String(disabled));
    });
  });
  const header = document.querySelector('header-component');
  header?.toggleAttribute('data-remla-controls-disabled', disabled);
  const ambient = header?.shadowRoot?.querySelector('toggle-component[device-name="Ambient"]');
  if (ambient) {
    ambient.inert = disabled;
    ambient.setAttribute('aria-disabled', String(disabled));
  }
}

function isWaitingForControl() {
  return controlState?.hasControl === false && controlState.lifecycle === 'ready'
    && controlState.handoffRequired !== true && Number.isInteger(queueState?.position)
    && queueState.position > 0;
}

async function showQueueNoticeOnJoin() {
  if (queueNoticeShown || queueNoticePending || !isWaitingForControl()) return;
  queueNoticePending = true;
  const session = queueSession;
  await customElements.whenDefined('alert-dialog');
  if (session !== queueSession) return;
  queueNoticePending = false;
  if (!isWaitingForControl()) return;
  const dialog = document.querySelector('alert-dialog');
  if (!dialog) return;
  queueNoticeShown = true;
  dialog.show({
    kind: 'queued-control',
    title: 'Waiting for control',
    message: 'You have joined the queue. You cannot control any lab equipment until it is your turn.',
    severity: 'info',
  });
}

function updateQueueState() {
  if (!isWaitingForControl()) {
    document.querySelector('alert-dialog')?.dismiss?.('queued-control');
  }
  showQueueNoticeOnJoin();
}

async function handleHandoff() {
  if (handoffPromptPending) {
    return;
  }
  handoffPromptPending = true;
  window.remlaJsonPendingHandoff = null;
  try {
    await customElements.whenDefined('alert-dialog');
    if (handoffCancelled || window.remlaJsonLatestControl?.handoffRequired === false) return;
    const dialog = document.querySelector('alert-dialog');
    if (!dialog) throw new Error('The lab handoff dialog is unavailable');
    const reset = await dialog.confirm({
      kind: 'handoff',
      title: 'Lab handoff',
      message: 'The previous controller disconnected. Do you want to reset the lab before taking control? Yes resets the equipment; No continues without resetting.',
      severity: 'warning',
    });
    if (reset == null || handoffCancelled || window.remlaJsonLatestControl?.handoffRequired === false) return;
    await sendCommand({
      deviceName: "Experiment",
      commandName: "handoff",
      arguments: { choice: reset ? "reset" : "continue" },
    });
  } catch (error) {
    console.error("Photoelectric handoff failed", error);
  } finally {
    handoffPromptPending = false;
  }
}

window.addEventListener('remla:connection-closed', () => {
  invalidateSnapshot();
  publishGeneration++;
  handoffCancelled = true;
  controlState = null;
  queueState = null;
  queueNoticeShown = false;
  queueNoticePending = false;
  queueSession++;
  uiState = null;
  followingController = true;
  clearView();
  updateControlAvailability();
});
window.addEventListener('remla:ownership-control', (event) => {
  const wasOwner = hasControl();
  controlState = event.detail;
  if (wasOwner && !hasControl()) {
    invalidateSnapshot();
    publishGeneration++;
    lastControl = null;
    showLastControl('', '', '');
    displayedControlRevision = null;
  }
  updateControlAvailability();
  updateQueueState();
  if (hasControl()) {
    if (!wasOwner) {
      if (!uiState?.namespaces?.photoelectric) {
        clearView();
      }
      followingController = true;
      document.querySelector('header-component')?.setFollowing(true);
      publishView();
    }
  } else {
    if (event.detail?.handoffRequired) {
      showLastControl('', '', '');
      displayedControlRevision = null;
    } else {
      applyControllerView();
    }
  }
  if (event.detail?.handoffRequired === false) handoffCancelled = true;
});
window.addEventListener('remla:ownership-queue', (event) => {
  queueState = event.detail;
  updateQueueState();
  applyControllerView();
});
window.addEventListener('remla:ui-state', (event) => {
  uiState = event.detail;
  applyControllerView();
});
window.addEventListener('remla:follow-change', (event) => {
  followingController = event.detail.enabled;
  if (followingController) applyControllerView();
  else showLastControl('', '', '');
});
window.addEventListener('toolbarSelection', (event) => {
  if (event.detail.source === 'remote') return;
  if (hasControl()) {
    if (event.detail.source === 'local') recordClick('tool', '', event.detail.toolGroupId);
    else publishView();
  }
  else if (isWaitingForControl() && followingController && event.detail.source === 'local') {
    followingController = false;
    document.querySelector('header-component')?.setFollowing(false);
    showLastControl('', '', '');
    displayedControlRevision = null;
  }
});
window.addEventListener('knobIntervalChange', () => {
  if (hasControl()) recordClick('knob', 'Pot', 'interval');
});
window.addEventListener('remla:control-click', (event) => {
  const { kind, deviceName, id } = event.detail || {};
  if (['knob', 'map', 'toggle'].includes(kind)) recordClick(kind, deviceName, id);
});
window.addEventListener("remla:ownership-handoff", () => {
  invalidateSnapshot();
  controlState = null;
  updateControlAvailability();
  handoffCancelled = false;
  handleHandoff();
});
if (window.remlaJsonPendingHandoff) {
  handleHandoff();
}
updateControlAvailability();
updateQueueState();

window.addEventListener("DOMContentLoaded", () => {
  updateControlAvailability();
  customElements.whenDefined('header-component').then(updateControlAvailability);
  customElements.whenDefined('video-component').then(updateSnapshotAvailability);
  updateQueueState();
  if (window.remlaJsonLatestUiState) uiState = window.remlaJsonLatestUiState;
  applyControllerView();
  if (hasControl()) publishView();
  window.addEventListener("remla-command", async (event) => {
    const source = event.detail.source;
    try {
      if (event.detail.deviceName === 'Experiment' && event.detail.commandName === 'capture_still') return;
      if (event.detail.deviceName !== 'Experiment' && !hasControl()) return;
      await sendCommand(event.detail);
    } catch (error) {
      console.error("Photoelectric command failed", error);
    } finally {
      source?.setPending?.(false);
    }
  });

  window.addEventListener("remla:state-snapshot", (event) => {
    applyRemoteState(event.detail.devices);
  });
  window.addEventListener("remla:state-changed", (event) => {
    applyRemoteState(event.detail.devices);
  });
  if (window.remlaJsonLatestState) {
    applyRemoteState(window.remlaJsonLatestState.devices);
  }
});
