# Server Repair static Library and local Solo Play

A static HTML/CSS/JavaScript GitHub Pages application with two top-level areas: the established technical Domain Library and the browser-local `solo-pages-v1` training client.

## Flow

```text
index.html
  -> js/app.js
     -> Library: js/data-loader.js -> content/manifest.json -> JSON content packs
     -> Play: js/play/play-app.mjs -> dedicated module Worker
              -> generated/play/ canonical engine, Builder, gameplay, and vendored motion runtime
```

The viewer includes tabs for Faults, Symptoms, Components, Tests, Tools, Commands, Repairs, Validations, Protocols, and Everything; full-text search; category filtering; sorting; and record detail dialogs.

## Adding a content pack

Drop another `.json` file into `content/` with this general shape:

```json
{
  "pack_id": "core-v0.1-storage-01",
  "name": "Core v0.1 Storage",
  "version": "0.1.0",
  "entities": [
    { "id": "...", "entity_type": "fault" }
  ]
}
```

New records must use unique stable IDs, validate against the matching schema in
`../schemas/domain/`, and reference IDs that exist in a manifest-loaded pack with the
expected entity type. No edit to `index.html`, `app.js`, or `data-loader.js` is required.

After adding or changing content, run the routine content checks from the repository root:

```bash
node viewer/scripts/build-manifest.mjs
node --test tests/viewer-content-schema.test.mjs tests/viewer-baseline.test.mjs
```

CI runs the same schema, reference, causal-edge, and baseline checks for viewer-content
changes. Schema validation is part of normal content maintenance, not a future viewer
feature.

The included GitHub Actions workflow can regenerate and commit the manifest automatically after content changes. If repository policy prevents Actions from pushing directly to the branch, run the manifest script locally or adapt the workflow to generate the manifest during Pages deployment instead.

## Why a manifest instead of importing an entire directory?

Browsers can fetch or import known URLs, but a normal static GitHub Pages directory does not give client JavaScript a portable directory-globbing API. The manifest provides discovery without coupling the entrypoint to every pack filename.

## Causal relationship data

`content/core-v0.1-fault-graph.json` stores authored Fault-to-Fault causal edges used by
domain-network and future Ticket Builder validation. It is not the retired interactive
fault-graph visualization. The current viewer does not draw a graph or expose a causal-edge
tab; edge records remain visible only through **Everything**.

## Local testing

Prepare the complete allowlisted Pages artifact from the repository root with one command:

```bash
node viewer/scripts/build-play-assets.mjs
```

Then serve `viewer/` over HTTP. Do not double-click `index.html`, because both areas fetch modules and JSON:

```bash
python -m http.server 8000 --directory viewer
```

Then visit `http://localhost:8000/`.

Run `node viewer/scripts/verify-play-assets.mjs` to confirm that the staged Play subtree is complete, hash-matched, and free of denylisted server/simulation material.

## Illustrations

Records may contain reusable illustration references, for example:

```json
"illustration": {
  "asset_id": "art.component.ecc_dimm",
  "alt_text": "An ECC server DIMM."
}
```

The Library displays illustration metadata. Play resolves stable `asset_id` values through
an external asset manifest and falls back through domain/category-specific placeholders.
The canonical full illustration set remains reserved for TASK-011.

## Current scope

Library intentionally preserves search, category filtering, sorting, and generic record
details for the Core v0.1 packs. Play is a local solo training profile, not an account,
multiplayer, campaign, Room, cloud-save, or anti-cheat client. Its active Match is intentionally
non-resumable; validated backup export contains only profile, decks, settings, processed IDs,
and aggregates.
