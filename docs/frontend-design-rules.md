# Frontend Design Rules

## Purpose

These rules govern all new frontend design and frontend-facing documentation for the ERP platform.

## Mandatory Foundations

- Read `docs/brand-system.md` before designing a new product surface.
- Read `design-system/MASTER.md` before writing or changing a design spec.
- Read the matching surface spec in `design-system/specs/` before implementing UI changes.

## Visual Direction

- Default style is **subtle professional skeuomorphism**.
- Design for dense enterprise workflows, not marketing-site minimalism.
- Favor tactile depth, inset controls, glass, layered panels, and premium shadow discipline.
- Keep the effect restrained; realism is supportive, not decorative.

## Theming

- Every new surface must work in light and dark mode from the start.
- All visual values must come from CSS custom properties, except token definitions themselves.
- Light and dark mode must use the same structural hierarchy and interaction logic.
- Never ship a feature that looks finished in one theme and incidental in the other.

## Styling Rules

- No new inline visual `style=` assignments for colors, spacing, borders, shadows, radii, or transitions.
- Prefer semantic classes and shared surface recipes over one-off component styling.
- No raw hex values in specs or implementation except inside token-definition blocks.
- Do not invent a local mini-design system inside a feature module.

## Shell and Navigation

- The app shell is the primary design contract for the product.
- Sidebar, navbar, breadcrumbs, systray, command/search, notifications, and AI entry points must all follow the app-shell spec.
- App-level navigation must feel structural and stable across modules.

## Surface Rules

- Use consistent recipes for cards, sheets, tables, drawers, dialogs, chips, toggles, badges, KPI tiles, and empty states.
- Treat tables, forms, kanban cards, and settings sections as first-class ERP surfaces with dedicated tactile states.
- Primary KPI cards may use `.o-card-gradient`; do not spread hero styling to every card.

## Motion and Behavior

- Motion should confirm hierarchy and state changes, not entertain.
- Use short, controlled transitions for hover, focus, panel open, and route changes.
- Always provide a `prefers-reduced-motion` safe path.
- Pressed, active, selected, and drag states must feel clear without relying on color alone.

## Accessibility

- Preserve `:focus-visible` on all interactive controls.
- Keep contrast at or above the existing accessibility target.
- Ensure keyboard access for shell, table, filter, drawer, modal, and command surfaces.
- Use ARIA roles and labels for icon-only and structural controls.

## Review Gates

- New frontend work must cite the spec it implements.
- New design docs must include responsive, dark-mode, and accessibility notes.
- New shell or shared-surface work should reduce design debt, not add to it.
- If a change adds new visual complexity, it must also improve consistency or usability.
