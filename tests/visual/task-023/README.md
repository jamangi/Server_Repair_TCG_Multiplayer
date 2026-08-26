# TASK-023 visual evidence

The deterministic captures show a real hypothesized Candidate on the cream compact Ticket for desktop, tablet, phone, and reduced-motion compositions. The browser assertions—not image approval alone—measure the final computed text, fill, and border colors, retain the visible `Hypothesis`/`Ruled out` cues, and exercise full-Ticket paper, returned-diagnosis, disabled, dark-Evidence, focus, hover, and forced-colors states.

Regenerate after completing `docs/ui-plan/task-023-visual-qa.md`:

```powershell
$env:UPDATE_TASK_023_VISUALS = '1'
pnpm exec playwright test tests/browser/task-023-ticket-semantic-contrast.spec.mjs --workers=1
Remove-Item Env:UPDATE_TASK_023_VISUALS
```
