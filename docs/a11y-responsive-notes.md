# Accessibility & responsive UI (Phase 493–496)

## WCAG 2.1 AA checklist (audit)

- **Keyboard:** All primary actions reachable via Tab; modals trap focus; Escape closes dialogs.
- **Focus visible:** Use `:focus-visible` (see `webclient.css` tokens) — avoid removing outlines without replacement.
- **Contrast:** Rely on design-system CSS variables for text/background pairs; do not hardcode colors.
- **Forms:** Associate labels with inputs; surface validation errors in text, not color alone.
- **Live regions:** Use ARIA live for toast / async RPC errors where content updates without full reload.

## i18n runtime

- Server exposes translated strings via the existing `i18n` service; load `.po` through the standard ERP i18n pipeline (no client-side hardcoded copy for user-visible strings).

## Mobile / touch

- Breakpoints: prefer `--space-*` and container max-width tokens; list/kanban views should scroll horizontally on narrow viewports.
- Kanban: touch targets ≥ 44px; defer drag-and-drop enhancement to pointer events with keyboard alternative.

## References

- `design-system/MASTER.md`
- `docs/frontend.md`
