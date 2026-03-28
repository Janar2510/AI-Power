# Gantt view

## Scope

- **Phase 753:** Legacy gantt rendering delegates to **`AppCore.GanttViewModule.render()`** when registered (`app/gantt_view_module.js`); **`main.js`** keeps **`renderGanttViewFallback`** if the module is absent.
- Timeline table uses token-oriented classes (`.gantt-view`, `.o-gantt-scroll`, `.o-gantt-table`, `.o-gantt-th`, `.o-gantt-td`, `.o-gantt-bar`) defined in **`webclient.css`**; bar position uses inline `left` / `width` / `min-width` for geometry only (not brand colors).

## Layout

- **Toolbar:** `h2` title, **`.o-gantt-fallback-toolbar`** with view switcher, search field (**`.o-list-search-field`**), **Search** / **Add** actions (**`.o-btn`**).
- **Grid:** Scroll container **`.o-gantt-scroll`**, table **`.o-gantt-table`**, name column **`.o-gantt-th--name`** / **`.o-gantt-td--name`**, timeline **`.o-gantt-th--timeline`** / **`.o-gantt-td--timeline`** with **`.o-gantt-bar`** for the date range segment.
- Empty state: **`.o-gantt-empty`** inside the scroll region when there are no records.

## Behaviour

- Date fields come from the loader (`date_start` / `date_deadline` for `project.task`, `date_start` / `date_finished` for `mrp.production`).
- Row links use **`o-erp-actwindow-form-link`**; **`attachActWindowFormLinkDelegation`** runs on **`.o-gantt-scroll`**.

## Spacing and tokens

- Prefer **`var(--space-*)`** for any new padding/margin on this surface; align toolbar gaps with list/graph (**`--card-gap`**).

## Acceptance

- With **`GanttViewModule`** loaded, behaviour matches the previous inline **`renderGanttView`** path.
- No new hardcoded hex for primary surfaces; use semantic tokens from **`foundations.md`**.
