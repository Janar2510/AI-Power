# Accessibility audit — Foundry One shell (Phase 802)

**Targets:** [design-system/MASTER.md](../design-system/MASTER.md) (contrast, focus, motion)

## Contrast

- Text on surfaces should meet **4.5:1** for body copy; primary buttons use `--color-text-on-primary` on `--color-primary`.
- Muted text uses `--text-muted`; verify against `--color-surface-*` in both themes.

## Focus

- Interactive controls in the shell use `:focus-visible` in `webclient.css` (nav, sidebar, buttons).
- **Import modal (Phase 802):** focus trap + initial focus on file input preserved; overlay uses tokenized classes (`.o-import-modal-*`).
- Ensure new modals copy the same pattern (focus trap, Escape, primary action).

## Motion

- `prefers-reduced-motion: reduce` disables `.o-card-gradient` and shell transitions (see `webclient.css`).
- Avoid adding non-essential animations without a reduced-motion branch.

## Keyboard

- **Alt+K** / command palette: `command_palette.js` + `webclient_shortcut_contract.md`.
- Sidebar: category fold buttons and links are focusable; nested links use `o-sidebar-link--nested`.

## Checklist (release)

- [ ] Spot-check home app tiles and import modal with keyboard only.
- [ ] Toggle `data-theme="dark"` and re-check focus rings and contrast on navbar + forms.
- [ ] Enable OS “reduce motion” and confirm KPI / card animations stop.
