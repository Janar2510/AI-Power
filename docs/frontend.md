# Frontend Framework Rules

## Overview

The web client is a metadata-driven framework that renders UI from declarative view definitions. It targets Odoo-like parity for action-first navigation, view architecture, and control panel behaviour.

## UI/UX Rules

### Action-First Navigation

- Router and breadcrumbs treat actions as first-class (window, client, URL)
- Workflow is action-driven; scheduled actions modelled as `ir.cron`

### View Architecture

- Support progressive enhancement: list ↔ form ↔ kanban
- Rendering pipeline: XML → AST → render
- UI declarations are module data

### Control Panel

- Centralise search, filters, grouping, favourites, context actions
- Consistent surface across list/form/kanban views

## Component Model

- **Registries**: View types, field widgets, services, public components
- **Service container**: rpc, notification, action, router, session, i18n, user, company
- **Modifier evaluation**: Small Python-expression evaluator in JS for view modifiers

## State Rules

- **Server-state**: Authoritative; versioned by write-date; updated by RPC
- **UI-state**: Ephemeral (dialogs, edit modes, filters); serialisable for session restore

## i18n, Accessibility, Theming

- **Translation**: `_(...)` wrappers; `.po` compatible; module-scoped
- **Accessibility**: Keyboard nav, ARIA roles, contrast, focus visibility
- **Theming**: SCSS variables; bundle inheritance (before/after/replace/remove)
- **Responsive**: Breakpoints; table collapse, form stack, kanban scale

## Testing

- **JS unit tests**: Mock server, deterministic RPC fixtures
- **Integration tours**: Playwright e2e for business flows
- **Asset debug**: `debug=assets` for no minification, sourcemaps

## Parity Targets

- Asset bundling semantics
- Service injection pattern
- View renderer contracts

## Non-Goals

- Exact Odoo Owl/legacy JS implementation
- Full mobile JS layer (deferred)
