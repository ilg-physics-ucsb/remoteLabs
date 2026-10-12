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
- The Photoelectric web-component page now uses the JSON client, structured
  component command events, remote Lamp/Ambient state, and ownership handoff
  prompts. photo1 runs ReMLA `0.4.5`; its selected configuration uses the
  root-owned `pepdu-password` secret and provider-routed power consumers.
- On photo1, `~/remla` now links to `/var/lib/remla/labs`, including its shared
  `static/` directory. The pre-migration tree is preserved at `~/remla_legacy`
  until operator validation is complete.
- Photoelectric's `video-component` now uses photo1's same-origin MediaMTX
  WHEP feed instead of the former demo video. The deployed `reader.js` and
  component assets match source; browser playback remains operator validation.
- Photoelectric pages use page-relative `static/...` URLs so they work through
  the `remotelabs.physics.ucsb.edu/photo1/` proxy mount; do not use
  `../static/...`, which escapes that mount.
- The shared JSON app and image-map component avoid strict-mode `arguments`
  bindings; Photoelectric's deployed command bridge and component module now
  parse in module-capable browsers.
- The Header's ambient toggle now resolves its default images through the
  Photo1 proxy mount; the deployed off-state image returns HTTP 200.
  The Small.chat MIME warning remains intentionally unchanged pending a provider
  decision.
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
- [x] Migrate PhotoElectricEffect to the JSON client while retaining the Web
  Component architecture. Shared toggle, knob, and SVG image-map components now
  emit structured commands that the page app relays to ReMLA.
- [x] Upgrade photo1 to ReMLA `0.4.3`, provision root-owned `pepdu-password`,
  migrate the selected lab configuration, and verify a read-only legacy-PDU
  outlet-state request without sending hardware commands.
- [x] Deploy PhotoElectricEffect to photo1 and verify the active service, local
  HTTP endpoint, and deployed JSON-app asset hash.
- [ ] Perform PhotoElectricEffect browser smoke tests against photo1 with an
  operator present: WHEP video playback/reconnect, Lamp/Ambient cross-tab state,
  potentiometer, both filter wheels, meter controls, command rejection,
  disconnect/reconnect, and handoff.
- [ ] Normalize photo1's canonical source layout to match diffrac2
  (`static/` alongside a `remoteLabs/` workspace) and remove only the inactive
  migration artifacts after operator validation. Preserve `~/remla_legacy`
  until rollback is no longer needed.
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
