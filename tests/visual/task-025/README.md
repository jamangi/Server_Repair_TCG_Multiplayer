# TASK-025 visual QA

These captures record the exact pre-spend Document Live preview and the read-only archived Ticket inspector using the real staged Viewer and authoritative local Worker.

Regenerate with:

```powershell
$env:UPDATE_TASK_025_VISUALS = '1'
pnpm exec playwright test tests/browser/task-025-document-archive.spec.mjs --project=chromium-desktop --workers=1
```

The browser assertions prove cancellation and focus behavior, identifier/summary correspondence, exactly-once spending, in-place Worklog enrichment, authorized archive filtering, responsive reflow, and dialog teardown. The captures are retained for human review of hierarchy, readability, and scroll affordance.
