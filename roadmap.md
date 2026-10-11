# Frontend JSON Adoption Roadmap

## Current state
- `feature/json-remla-client` is deployed to diffrac2. ReMLA `0.4.3` is active and
  `/var/www/remla/static/js/remlaJsonApp.js` matches this branch's source.
- `DiffractionInterference/index.html` retains its jQuery/image-map UI, but now
  uses a page-level JSON client and explicit JSON commands rather than
  `remlaSocket.js` or `window.dataChannel`.
- `diffrac2.yml` matches the active Pi configuration, including REST PDU mode,
  named-secret reference, power consumers, camera selection, and website setup.
- The reusable Web Component architecture is documented in `static/js/README.md`
  and used by `PhotoElectricEffect/zindex.html`, not by DiffractionInterference.
- `sudo remla setup deploy-website` already installs both `remlaSocket.js` and
  `remlaJsonSocket.js` into the deployed `static/js/` directory. A page must use
  exactly one of those protocol clients.

## Plan
- [x] Add `remlaJsonApp.js`, a page-level `RemlaJsonSocket` owner that exposes
  structured `remlaCommand(deviceName, commandName, arguments)` calls and
  emits snapshot, state, queue, fault, connection, and command-result/error
  browser events.
- [x] Migrate every active diffraction command to explicit JSON calls; no active
  page code uses slash-command WebSocket framing or `window.dataChannel`.
- [x] Reconcile power, ambient, stage, slit, and camera UI updates after JSON
  command completion. Serialize slit commands/nudges and prevent overlapping
  stage moves.
- [x] Retain and render the latest JSON snapshot/state changes for Laser, Screen,
  and Ambient, including snapshots received before the jQuery page is ready.
- [x] Prompt a handoff-pending JSON client to choose continue or reset through
  the structured `Experiment/handoff` command.
- [x] Synchronize the active diffrac2 lab YAML into this branch without copying
  a plaintext credential.
- [x] Deploy this branch to diffrac2 and verify the active ReMLA service, local
  HTTP endpoint, and deployed JSON-app asset hash.
- [ ] Perform browser smoke tests against diffrac2 with an operator present:
  ownership/handoff, one camera selection, a non-motion control, a scoped power
  action, command rejection, disconnect/reconnect, and revision-gap recovery.
- [ ] Add the shared declarative-control adapter for Web Components: parse
  `data-cmd` into a structured CustomEvent, while each lab app remains the sole
  JSON server boundary. Then migrate DiffractionInterference UI controls only
  when its visual rewrite is desired.

## Blockers and decisions
- Do not load legacy and JSON socket clients on the same page.
