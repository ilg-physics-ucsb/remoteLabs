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

async function handleHandoff() {
  if (handoffPromptPending) {
    return;
  }
  handoffPromptPending = true;
  window.remlaJsonPendingHandoff = null;
  const continueWithoutReset = window.confirm(
    "The previous controller disconnected. Select OK to continue, or Cancel to reset the lab before taking control.",
  );
  try {
    await sendCommand({
      deviceName: "Experiment",
      commandName: "handoff",
      arguments: { choice: continueWithoutReset ? "continue" : "reset" },
    });
  } catch (error) {
    console.error("Photoelectric handoff failed", error);
  } finally {
    handoffPromptPending = false;
  }
}

window.addEventListener("remla:ownership-handoff", handleHandoff);
if (window.remlaJsonPendingHandoff) {
  handleHandoff();
}

window.addEventListener("DOMContentLoaded", () => {
  window.addEventListener("remla-command", async (event) => {
    const source = event.detail.source;
    try {
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
