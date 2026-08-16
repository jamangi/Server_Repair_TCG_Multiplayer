# Server Repair TCG Multiplayer

An educational, server-authoritative multiplayer card game about diagnosing and repairing computer-server faults.

## Core loop

Players move through the practical repair sequence:

1. Observe symptoms.
2. Form a hypothesis.
3. Run tests.
4. Isolate the fault.
5. Perform a repair.
6. Verify recovery.
7. Document the result.

The first playable target is a competitive prototype in which technicians race to close shared repair tickets and earn 10 Service Points. Hidden fault information and all authoritative match decisions remain on the server.

## Repository map

- `docs/design/` — game rules, content catalogs, and implementation guidance.
- `docs/schema-notes/` — domain/runtime schema notes and server-authority rules.
- `schemas/domain/` — schemas for reusable server-repair knowledge.
- `schemas/runtime/` — schemas for multiplayer match state and commands.
- `examples/` — domain and runtime example records.
- `viewer/` — static prototype for browsing and searching domain content.
- `tools/validation/` — content-validation helpers.

## Current status

This repository begins with the design, schema, example, and domain-viewer artifacts produced during the **Server Repair Tech Interview** design session. The next milestone is to turn the starter catalogs into a validated Core v0.1 content pack before implementing playable cards.

## Domain viewer

From the repository root:

```powershell
python -m http.server 8080 --directory viewer
```

Then open <http://127.0.0.1:8080/>. Do not open `viewer/index.html` through the `file://` protocol because the browser cannot reliably fetch its JSON content files that way.

Rebuild the viewer manifest after changing its content:

```powershell
node viewer/scripts/build-manifest.mjs
```

## Provenance

The source ZIP archives remain untouched in the creator's Downloads folder. Their contents were normalized into this repository so the domain and runtime schemas do not overwrite one another and the viewer can evolve independently.
