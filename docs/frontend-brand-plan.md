# Frontend Brand Plan 01

## Purpose

This document is the first frontend architecture and branding plan for the ERP platform. It converts the current implementation into a coherent design program that can be implemented incrementally without changing the platform's metadata-driven UI model.

## Current State

- The platform already has a functional web client under `addons/web/static/src/`.
- Light and dark mode already exist at the token level in `addons/web/static/src/scss/webclient.css`.
- Surface specs already exist for dashboard, list, form, kanban, and settings.
- The visual direction is still inconsistent: `main.js` remains large, several shell areas still render with HTML strings, and the frontend contains hundreds of inline visual style assignments.
- The local `odoo-19.0` checkout referenced by repo docs is not present in the current workspace, so parity comparison for this phase must rely on existing repo documentation and the current implementation.

## Working Direction

- Working product brand: **Foundry One**
- Descriptor: AI-powered modular ERP
- Style: subtle professional skeuomorphism
- Brand character: industrial executive
- Experience target: tactile and premium without becoming retro, theatrical, or slow

## Strategic Goals

1. Create a credible product brand for the ERP before deeper UI implementation work.
2. Establish a global design system that governs shell, navigation, data surfaces, inputs, motion, and theming.
3. Align every primary ERP surface with shared materials, density, and interaction rules.
4. Reduce design debt by moving new UI work away from inline styles and toward tokenized classes.
5. Keep light and dark mode symmetrical so no surface is "light-first" or "dark-first."

## Deliverables

- `docs/brand-system.md`
- `docs/frontend-design-rules.md`
- `design-system/specs/app-shell.md`
- Updated `design-system/MASTER.md`
- Updated `docs/design-system.md`
- Updated UI/UX and frontend agent rules to enforce the new system

## Architecture Decisions

### Keep

- Metadata-driven views
- Action-first navigation
- Existing AppCore / UIComponents namespace model
- Vanilla JS implementation strategy
- Current breakpoint set: 1023px, 768px, 480px

### Change

- Replace the current "soft UI evolution" direction with a subtle skeuomorphic shell and surface language.
- Make the app shell the top-level design contract rather than treating each view independently.
- Treat brand, theming, motion, and surface recipes as first-class architecture, not finishing touches.
- Ban new inline visual styling and require classes plus tokens for future frontend work.

## Phase Sequence

### Phase 1. Brand and foundation

- Define product naming system and recommend a working brand.
- Define typography, palette, material cues, icon direction, voice, and logo behavior.
- Establish semantic token categories for light and dark themes.

### Phase 2. Shell and navigation

- Author the app shell contract for sidebar, navbar, breadcrumbs, systray, notifications, global search, command palette, and AI entry points.
- Define tactile shell behaviors for hover, active, pressed, focus, loading, stale, and disabled states.

### Phase 3. ERP surfaces

- Align dashboard, list, form, kanban, and settings with the same shell and material logic.
- Standardize component recipes for cards, tables, filters, chips, drawers, dialogs, badges, toggles, and KPI tiles.

### Phase 4. Implementation migration

- Prioritize shell, navbar, sidebar, dropdowns, and shared controls first.
- Move repeated visual decisions from `main.js` and scattered inline styles into reusable classes and tokenized CSS.
- Keep component behavior stable while visual ownership moves into stylesheet-driven recipes.

## Acceptance Criteria

- A new contributor can infer the product brand, shell rules, and theme behavior from docs alone.
- Every primary ERP surface references one global token and material vocabulary.
- New work has a clear rule set for class naming, theme safety, motion, and accessibility.
- The plan creates a practical bridge from the current frontend to a more maintainable design system instead of proposing a greenfield rewrite.
