# JSON frontend integration for justLabs

## Current state
- [x] Prepare a clean candidate from `justLabs` (`2e0dabd`) containing the reviewed frontend and browser tests. Four review-only lab YAML edits, two image deletions and 513 unrelated unstaged deletions from the source checkout are excluded. Retained Franck-Hertz images remain accessible; fix the manual thumbnail reference.
- [x] Default-deny routed-power commands on candidate pages; original YAML has no approved routed consumers/instrument routes. The browser-only `data-routed-power` opt-in is for an explicitly reviewed installed configuration, not authorization. Check the resulting PR diff for credentials or config changes before merging.
- [ ] Verify final full browser suite and review candidate tree, then push and open a PR into `justLabs` for the operator to review and merge. No Pi was changed as part of the PR.

## Prioritized next steps
- [ ] Operator: review/rotate existing exposed secrets out of band, confirm each lab's actual PDU outlets, power routes, camera views and lock groups, and provision per-Pi secrets/config before enabling routed-power UI. Do not install the unapproved YAML from the source branch.
- [ ] Operator: pilot ReMLA 0.5.0 and frontend on photo2, franck1 and franck2 one at a time; check service/stream health, owner/queue/handoff and asset paths in a clear window. Preserve lab-specific YAML, the existing website and rollback; connecting/disconnecting an owner can move devices. Franck-Hertz remains video-only.
- [ ] Complete fault/command-error and power-unknown UI feedback, real two-browser/browser-snapshot/WHEP checks, physical motor and camera-view acceptance before wider control rollout.
