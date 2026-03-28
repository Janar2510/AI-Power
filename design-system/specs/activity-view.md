# Activity matrix view

## Scope

- **Phase 758 (spec):** Documents the **activity** view type rendered inline in **`main.js`** (`renderActivityMatrix`): records × **`mail.activity.type`** columns with schedule actions. Extraction to a dedicated module is **deferred** (RPC/session complexity).

## Layout

- **Toolbar:** `h2`, **`.o-activity-matrix-toolbar`** with view switcher, search (**`.o-activity-matrix-search`**), **Add**.
- **Matrix:** **`.o-activity-matrix-scroll`**, table **`.o-activity-matrix-table`**, header **`.o-activity-matrix-th`**, record column **`.o-activity-matrix-th--record`** / **`.o-activity-matrix-td--record`**, cells **`.o-activity-matrix-td`** with lines **`.o-activity-matrix-cell-line`** and meta **`.o-activity-matrix-cell-meta`**.
- Schedule control: **`.btn-schedule-activity`** / **`.o-activity-schedule-btn`** per cell.
- Empty state: **`.o-activity-matrix-empty`**.

## Behaviour

- Loader (`loadActivityData`) fetches **`mail.activity.type`**, model **`search_read`**, and **`mail.activity`** for the matrix.
- **+ Schedule** prompts for summary and due date, then **`mail.activity`** **`create`** via RPC.

## Tokens and a11y

- Use **`var(--border-color)`**, **`var(--color-text)`**, **`var(--space-*)`** for any new rules; table **`role="grid"`** / **`role="row"`** / **`role="columnheader"`** / **`role="gridcell"`** as today.

## Acceptance

- Future **`ActivityViewModule`** (if added) must preserve grid semantics, token classes, and schedule RPC contract documented here.
