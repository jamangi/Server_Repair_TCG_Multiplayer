# TASK-016 visual baselines

These captures document the approved diagnostic-bench board at the desktop, short-laptop, tablet, phone, and reduced-motion project sizes.

Regenerate them from the repository root with:

```powershell
$env:UPDATE_TASK_016_VISUALS = '1'
pnpm exec playwright test tests/browser/task-016-board-layout.spec.mjs --workers=1
Remove-Item Env:UPDATE_TASK_016_VISUALS
```

The automated assertions remain authoritative for no document-level desktop scrolling, panel order, clipping, queue overflow, legal-action visibility, 44 px touch targets, filter continuity, focus return, and semantic landmarks.
