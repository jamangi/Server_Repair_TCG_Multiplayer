# Quiet Cascade generated graph report

Generated from the declarative Story pack. The JSON companion is authoritative for exact inventories.

## Inventory

- Entry labels: `story.qc01.entry`
- Scripts: 4
- Statements: 324
- Labels: 66
- Scenes: 24
- Dialogue / narration: 90 / 5
- Choices / conditions: 4 / 15
- Match nodes: 6
- Checkpoints: 29
- Reachable statements: 324
- Unreachable labels: 0
- Undeclared cycles: 0
- Calls / returns: 0 / 0

## Endings

- `ending.qc01.bounded_account`
- `ending.qc01.defensible_release`
- `ending.qc01.gate_hold`

Every score gate has a lower-band fallback. The six terminal variants preserve the remembered client-framing choice while resolving to three outcome IDs.

## Match returns

- `story.match.qc01.shift01.wrong_device` → `story.qc01.shift01.return`
- `story.match.qc01.shift02.power_lot` → `story.qc01.shift02.return`
- `story.match.qc01.shift03.memory_compare` → `story.qc01.shift03.return`
- `story.match.qc01.shift04.passes_cold` → `story.qc01.shift04.return`
- `story.match.qc01.shift05.no_offer` → `story.qc01.shift05.return`
- `story.match.qc01.shift06.quiet_cascade` → `story.qc01.shift06.return`

Each Match owns a pre-Match and post-Match durable checkpoint through the `start_match` statement. No explicit checkpoint jumps wrap the boundary.

## Production reachability

- Background and transient IDs: 9
- Established characters: 7
- Convergence labels: 14
- Dead ends: 6, all terminal `end` statements
