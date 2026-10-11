const LAMP_DEVICE = "HgNeLamp";
const AMBIENT_DEVICE = "Ambient";

function setPowerState(deviceName, state) {
  if (state !== "on" && state !== "off") {
    return;
  }
  if (deviceName === LAMP_DEVICE) {
    const lamp = document.querySelector('toggle-component[device-name="HgNeLamp"]');
    if (lamp) {
      lamp.setState(state === "on");
    }
  }
  if (deviceName === AMBIENT_DEVICE) {
    const header = document.querySelector('header-component');
    if (header) {
      header.setAmbientLightState(state === "on");
    }
  }
}

function applyRemoteState(devices) {
  for (const deviceName of [LAMP_DEVICE, AMBIENT_DEVICE]) {
    const state = devices[deviceName];
    if (state && state.power) {
      setPowerState(deviceName, state.power);
    }
  }
}

async function sendCommand({ deviceName, commandName, arguments: args = [] }) {
  if (typeof window.remlaCommand !== "function") {
    throw new Error("The ReMLA JSON client did not load");
  }
  await window.remlaCommand(deviceName, commandName, args);
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

addEventListener("DOMContentLoaded", () => {
  window.addEventListener("remla-command", async (event) => {
    const source = event.detail.source;
    try {
      await sendCommand(event.detail);
    } catch (error) {
      console.error("Photoelectric command failed", error);
    } finally {
      if (source && typeof source.setPending === "function") {
        source.setPending(false);
      }
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
