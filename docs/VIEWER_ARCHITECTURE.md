# Viewer architecture

## Purpose

The domain viewer is a dependency-free static web application that makes the repository's server-repair domain packs readable by humans. It does not execute content as code and is not the multiplayer game client.

## Runtime path

1. GitHub Pages serves `viewer/index.html`.
2. `viewer/js/app.js` boots the interface.
3. `viewer/js/data-loader.js` fetches `viewer/content/manifest.json`.
4. The loader fetches every JSON pack named by the manifest and flattens its `entities` into records.
5. `viewer/js/entity-types.js` supplies the first-class tab registry, display labels, ordering, and category-field selection.
6. `app.js` applies tab, search, category, and sort state, then renders cards and the generic detail dialog.

## Content and deployment

- `viewer/content/*.json` is inert domain data.
- `viewer/scripts/build-manifest.mjs` discovers content packs and generates the manifest.
- `.github/workflows/rebuild-content-manifest.yml` commits manifest changes after content changes.
- `.github/workflows/deploy-pages.yml` regenerates the manifest and publishes `viewer/` to GitHub Pages.

## Extension rule

New entity types should reuse the generic list and detail rendering path whenever their data can be represented by the existing record contract. A specialized view should be introduced only when a task demonstrates that the generic view is insufficient.

