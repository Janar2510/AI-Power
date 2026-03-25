# Kanban View Spec

Inherits [foundations.md](./foundations.md) and [app-shell.md](./app-shell.md).

## Goals
- Keep kanban interaction parity for fold/select/load/reorder flows.
- Maintain token-based visuals and premium interaction feedback.

## Column behavior
- Columns support fold/unfold and persist state.
- Empty columns show actionable empty states (not plain text).

## Card behavior
- Card shell: `.o-kanban-card` with `.o-card-gradient` on the outer card; title in `.o-kanban-card-title`; secondary fields in `.o-kanban-card-body` / `.o-kanban-card-field` (tokens only, no inline `style=` on new chrome).
- Multi-select is supported with a visible bulk action bar.
- Progressive loading supports "load more" in large columns.

## Drag and reorder
- Drag feedback uses clear affordances (`.o-list-row--dragging`, `.o-list-row--drag-over` style equivalents for kanban/list).
- Reordering actions must persist through RPC.

## Visual system
- Use CSS custom properties for color, spacing, radius, and motion.
- Main cards keep gradient border animation (`.o-card-gradient`) per design rules.
- Columns and cards should feel tactile and movable, but still consistent with the shell and table/form surfaces.

## Accessibility
- Keyboard access for primary actions.
- Reduced motion media query respected for animation-heavy interactions.
