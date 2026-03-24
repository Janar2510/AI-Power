# Frontend Migration Map

## Target Ownership

### Modern runtime owns

- bootstrap parsing
- env creation
- service startup
- menu bootstrap
- shell ownership
- runtime selection

### Legacy adapter owns temporarily

- route application
- metadata-driven action rendering
- existing dashboard/list/form/kanban runtime
- legacy shell internals that have not yet moved

## Temporary Bridge

`addons/web/static/src/main.js` is no longer the strategic entrypoint.

During phases 1-5 it acts as:

- legacy renderer
- compatibility bridge
- migration seam for view logic still being moved

## Removal Goal

After phase 5 stabilization:

- no new product work should target `window.Services`, `window.AppCore`, or `window.ViewRenderers` directly
- `main.js` should shrink to a residual adapter or be retired
