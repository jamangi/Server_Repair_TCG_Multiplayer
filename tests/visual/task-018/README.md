# TASK-018 focused visual evidence

These captures document the corrected selected-Ticket visibility and a visibly reopened Inspect dialog after the TASK-016 regressions.

Regenerate them from the repository root with:

```powershell
$env:UPDATE_TASK_018_VISUALS = '1'
pnpm exec playwright test tests/browser/task-018-dialog-ticket-regressions.spec.mjs --project=chromium-desktop --workers=1
Remove-Item Env:UPDATE_TASK_018_VISUALS
```

The browser assertions, rather than the image files, prove repeated dialog lifecycle cleanup, focus restoration, descendant-level Ticket visibility, a complete full-Ticket target, and WCAG AA symptom contrast.
