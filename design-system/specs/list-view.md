# List View + Control Panel Specification

Inherits [foundations.md](./foundations.md) and [app-shell.md](./app-shell.md).

List pages use a reusable control panel and table renderer while preserving current list behaviors (search, filters, grouping, bulk actions, export/import, paging).

## List page shell

- Root class: `.o-list-shell`
- Header row with title (`h2`) and controls in `.o-control-panel`
- Optional active facets row in `.o-filter-chips`
- Table wrapper `.o-list-table-wrapper` for horizontal overflow on small screens
- Bottom pager area `.o-pager`

## Control panel

- Class: `.o-control-panel`
- Uses spacing tokens only (`--space-*`, `--card-gap`)
- Contains:
  - `.o-view-switcher` for mode buttons
  - `.o-search-bar` with input + search + AI search
  - `.o-control-panel-filters` for filter chips/selects
  - `.o-control-panel-actions` for save filter / export / import / print / add
- Buttons are based on `UIComponents.Button` kinds (`primary`, `secondary`)

## View switcher

- Class: `.o-view-switcher`
- Modes: `list`, `kanban`, `graph`, `pivot`, `calendar`, `activity`, `gantt`
- Active button has `.active` and uses primary token colors

## Active filter chips

- Wrapper: `.o-filter-chips`
- Chip: `.o-filter-chip`
- Remove button: `.o-filter-chip-remove`
- Supports:
  - active search filters
  - active group by

## List table

- Base table: `.o-list-table` (`role="grid"`)
- Header cells:
  - sortable cells use `.o-list-th-sortable`
  - sort indicator uses text arrows (no icon dependency)
- Rows:
  - data row class `.o-list-data-row`
  - group header row `.o-list-group-header`
  - subtotal row `.o-list-group-subtotal`
- Selection:
  - select all checkbox + row checkboxes
  - bulk bar toggles based on selected count

## Bulk action bar

- Container: `.o-bulk-action-bar`
- Count text: `.o-bulk-action-count`
- Actions: delete selected + clear
- Hidden by default, displayed as row flex when selections exist

## Pager

- Class: `.o-pager`
- Label format: `"1-80 of 250"`
- Prev/next buttons:
  - `.o-pager-prev`
  - `.o-pager-next`

## Accessibility

- `role="grid"`, `role="row"`, `role="gridcell"` in table
- Search input includes `aria-label`
- Select-all and row checkboxes include labels
- Keyboard navigation:
  - Up/down to move row focus
  - Enter to open edit form for focused row

## Responsive behavior

- <= 768px:
  - `.o-control-panel` stacks
  - `.o-list-table-wrapper` scrolls horizontally
- <= 480px:
  - action buttons remain touch-sized via shared token rules

## Dark mode and token policy

- All new colors must come from CSS custom properties
- No hardcoded hex colors for new list/control-panel styles
- Preserve existing design language used by dashboard/settings
- Dense table surfaces should keep a clear work-plane hierarchy with subtle row depth, strong selection cues, and restrained shell chrome.
