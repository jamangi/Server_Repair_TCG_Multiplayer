# TASK-050 five-Ticket atlas package

Status: **complete research package; `SYSTEM-001` pending; TASK-051 blocked**

This directory is a reviewable illustration-of-concept, not production Ticket or Component data. [`atlas-data.json`](atlas-data.json) is the hand-authored structured model; [`generate-atlas.mjs`](generate-atlas.mjs) deterministically renders the five Markdown dossiers, five original SVG schematics, the responsive [`review.html`](review.html), the atlas index, and both human-readable comparison matrices.

The package deliberately separates:

- public structure, released public Symptoms/Candidates, narrative, SVG, and text equivalent;
- private authored Fault/outcome/Isolation/Repair/Verification compatibility proof;
- primary-source claims in [`source-ledger.json`](source-ledger.json);
- Component/relationship findings in [`component-relationship-audit.json`](component-relationship-audit.json); and
- measured architecture evidence in [`architecture-evaluation.json`](architecture-evaluation.json).

Run or check the generated package with:

```powershell
node docs/system-models/task-050/generate-atlas.mjs
node docs/system-models/task-050/generate-atlas.mjs --check
node --test tests/task-050-system-model-atlas.test.mjs
pnpm exec playwright test tests/browser/task-050-system-model-atlas.spec.mjs
```

The renderer is research tooling only. It may not be imported into production Viewer/runtime code or treated as the TASK-051 implementation before the project owner approves `SYSTEM-001`.
