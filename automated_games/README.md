# Automated game reports

This directory stores compact, reproducible reports from the offline, server-authoritative simulation harness. Successful matches are reproduced from their setting-group version pins, policy IDs, and seed; only exceptional runs retain expanded diagnostic artifacts.

Each campaign contains:

- `settings.json` — version-pinned setting groups and deterministic seed lists;
- `matches.json` — one compact result row per requested run;
- `summary.json` and `summary.md` — recomputed totals, turn distributions, scores, stalls, and determinism checks; and
- `exceptions/` — expanded inputs and diagnostics for unsatisfiable, invalidated, stalled, capped, or otherwise failed runs.

Reports contain no hidden Ticket truth or opponent-private Evidence. The verifier reruns the campaign through the same authenticated intent boundary used by computer Players and compares normalized match rows, summaries, and exception artifacts byte-for-byte.

Run the committed TASK-009 campaign verifier with:

```powershell
node tools/run-automated-games.mjs --verify-report automated_games/task-009-foundation-v1
```
