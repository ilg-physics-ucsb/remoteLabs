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

function hasControl() {
  return controlState?.hasControl === true && controlState.lifecycle === 'ready';
}

function updateControlAvailability() {
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
  handoffCancelled = true;
  controlState = null;
  queueState = null;
  queueNoticeShown = false;
  queueNoticePending = false;
  queueSession++;
  updateControlAvailability();
});
window.addEventListener('remla:ownership-control', (event) => {
  controlState = event.detail;
  updateControlAvailability();
  updateQueueState();
  if (event.detail?.handoffRequired === false) handoffCancelled = true;
});
window.addEventListener('remla:ownership-queue', (event) => {
  queueState = event.detail;
  updateQueueState();
});
window.addEventListener("remla:ownership-handoff", () => {
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
  updateQueueState();
  window.addEventListener("remla-command", async (event) => {
    const source = event.detail.source;
    try {
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
