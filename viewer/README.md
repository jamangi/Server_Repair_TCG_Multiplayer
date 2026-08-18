# Server Repair Domain Viewer — Prototype

A static HTML/CSS/JavaScript viewer for the Server Repair Card Game technical knowledge database.

## Flow

```text
index.html
  -> js/app.js
  -> js/data-loader.js
  -> content/manifest.json
  -> any number of JSON content packs
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

Then run:

```bash
node scripts/build-manifest.mjs
```

No edit to `index.html`, `app.js`, or `data-loader.js` is required.

The included GitHub Actions workflow can regenerate and commit the manifest automatically after content changes. If repository policy prevents Actions from pushing directly to the branch, run the manifest script locally or adapt the workflow to generate the manifest during Pages deployment instead.

## Why a manifest instead of importing an entire directory?

Browsers can fetch or import known URLs, but a normal static GitHub Pages directory does not give client JavaScript a portable directory-globbing API. The manifest provides discovery without coupling the entrypoint to every pack filename.

## Local testing

Do not double-click `index.html`, because the viewer fetches JSON. Serve the folder over HTTP, for example:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000/`.

## Illustrations

Records already contain reusable illustration references, for example:

```json
"illustration": {
  "asset_id": "art.component.ecc_dimm",
  "alt_text": "An ECC server DIMM."
}
```

The test viewer displays the asset metadata but does not yet resolve an image file. A later `assets/manifest.json` can map these IDs to PNG/WebP/SVG resources.

## Suggested next additions

- validate every pack against the JSON Schemas in CI
- hyperlink referenced stable IDs to related records
- add expansion/set filters
- resolve illustration assets
- persist filters/search in the URL
- create the complete Core v0.1 Domain Content Pack
