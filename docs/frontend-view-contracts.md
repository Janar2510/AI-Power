# Frontend View Contracts

## Phase 4 Target

Move the following ERP surfaces onto the modular frontend architecture:

- dashboard
- list
- form
- kanban

## Invariants

- server metadata remains authoritative
- actions, menus, and views still come from backend metadata
- no ORM or RPC redesign in the 1-5 phase wave

## Required Frontend Boundaries

- view registry
- field/widget registry
- action container ownership
- control panel/search ownership
- shell/view separation

### Control panel / search (Phase 650)

- New filters, group-by chips, favourites UI, and list action buttons must be implemented in **`addons/web/static/src/app/list_control_panel.js`** and mirrored in **`addons/web/static/src/core/list_control_panel_shim.js`** for the concatenated **`web.assets_web`** bundle (keep both in sync).
- **`addons/web/static/src/core/list_view.js`** must not reintroduce a second inline copy of that HTML; it always calls **`window.AppCore.ListControlPanel`**.

## Styling Rules

- migrated views must use shared tokens and class-based styling
- high-visibility inline style rendering should be removed as those views move
- dark/light parity is required on every migrated surface
