# Frontend Service Registry Contract

## Purpose

Defines the service layer for the modular frontend runtime.

## Core Services

- `session`
- `rpc`
- `menu`
- `action`
- `router`
- `title`
- `notification`
- `i18n`
- `theme`
- `commandPalette`

## Current Runtime Shape

- services are now created through the modular runtime in `addons/web/static/src/app/services.js`
- the service registry is exposed through `env.registries.category("services")`
- **`action`** (Phases **636–639**): `doAction` (legacy classifier + `actionToRoute` for act_window), `navigateFromMenu`, `doActionButton` → `ActionManager`; exposed as `window.ERPFrontendRuntime.action`
- `menu`, `router`, and `theme` now drive shell refreshes directly
- `shell` is the coordinating UI-state service for the modular webclient during migration

## Ownership Rules

- services own remote calls, session state, and cross-surface behavior
- registries own extensibility and pluggability
- shell components consume services instead of reading global state directly
- legacy globals may be wrapped by services during migration, but they are not the long-term public contract

## Bootstrap Contracts

Modern runtime consumes:

- `window.__erpFrontendBootstrap`
- `/web/session/get_session_info`
- `/web/load_views`
- `/web/webclient/load_menus`

## Migration Rule

Any new frontend capability added during phases 1-5 should enter through the service/registry layer first, even if its implementation still bridges to legacy globals behind the scenes.
