# TASK-011 visual review

These captures record the integrated canonical illustration matrix after the
104-subject contact-sheet review. Regenerate them with:

```powershell
$env:UPDATE_TASK_011_VISUALS = "1"
pnpm exec playwright test tests/browser/task-011-canonical-art.spec.mjs
Remove-Item Env:UPDATE_TASK_011_VISUALS
```

The reviewed matrix covers an action and a panoramic Symptom in Library detail,
canonical action art in Bench and hand slots, the compact and 2.15:1 full Ticket
crops, and the 390×844 mobile board. Human review checks technical recognition,
crop survival, no unsafe work, no pseudo-text, no hidden-answer or outcome
leakage, adequate HTML text contrast, and consistency with the night-shift art
bible. Family and subsystem contact sheets live in
`docs/art/task-011-contact-sheets/` and carry the complete review set.
