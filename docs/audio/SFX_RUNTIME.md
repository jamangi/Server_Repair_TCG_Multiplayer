# App-wide SFX runtime

TASK-032 implements the reviewed TASK-031 interaction and recipe catalogues with one dependency-free Web Audio service owned by the outer Viewer shell. Library and every Play destination share that service; page modules never create their own audio contexts or synthesis graphs.

## Lifecycle and behavior

- `viewer/scripts/build-sfx-assets.mjs` validates and projects the source catalogues into `viewer/generated/sfx/catalog.mjs`. The generated module is committed and verified in CI.
- `viewer/js/sfx-service.mjs` owns delegated interaction matching, intent precedence, cooldowns, polyphony, synthesis, master volume, and teardown.
- The service creates no `AudioContext` until a trusted pointer or keyboard activation at nonzero volume. Locked interactions are discarded rather than queued.
- `sfx_volume_percent` is validated in the existing settings record. Version-2 and version-3 local states and exports migrate to the default value of 40; reset also restores 40. A value of 0 stops active voices and keeps the runtime silent.
- Slider movement is silent. The explicit Settings Preview action can audition the selected value without saving it.
- Touch hover, continuous pointer movement, initial rendering, restored/programmatic focus, disabled controls, no-op selections, and every catalogue `NO_SFX` family remain silent.
- Synthesis uses short oscillators and generated noise, envelopes, filters, and an optional bounded delay. There are no samples, binary audio assets, or runtime audio requests.

## Source-of-truth workflow

Edit the JSON catalogues in `docs/audio/`, then run:

```powershell
node tools/validate-sfx-catalog.mjs
node viewer/scripts/build-sfx-assets.mjs
node viewer/scripts/verify-sfx-assets.mjs
```

Do not edit `viewer/generated/sfx/catalog.mjs` by hand.

## Verification

The focused Node tests cover catalogue validation, settings migrations and portability, trusted activation, volume behavior, deduplication, cooldown, graph parameters, cleanup, unsupported Web Audio, and silent slider input. The focused browser suite installs an in-page Web Audio probe and covers the global shell, every Play route family, desktop keyboard input, mobile touch input, programmatic focus suppression, persisted levels 0/40/100, selector syntax, and the single-context invariant.

Automated probes do not replace a human hardware listening check. Before a release, listen on representative desktop and mobile devices at 0, 40, and 100 percent and confirm conservative loudness, a non-harsh Error cue, low repetition fatigue, and no Cursor chatter.
