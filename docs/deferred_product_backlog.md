# Deferred product areas (Track 6 / matrix)

Large **behavioural** work that is structurally scaffolded in the parity matrix but not scheduled unless product prioritizes it.

- **Localisation:** `l10n_*` modules — country-specific taxes, charts of accounts, reports.
- **Marketing / comms:** mass mailing, SMS campaigns at full Odoo depth.
- **Discuss / livechat:** real-time support stack parity.
- **Spreadsheets / studio-style** tooling.
- **Other niche apps** listed as deferred in `docs/parity_matrix.md`.

**Rule:** Do not start these without explicit product scope and phase budget. Complete stock/MRP/account/web/AI core tracks first (see `docs/ai-rules.md` reference analysis and `docs/odoo19_reference_map.md`).

### Odoo 19 reference paths (read-only, when a vertical is prioritized)

Use a local `odoo-19.0/addons/` checkout to scope behaviour — no verbatim code in ERP.

| Vertical | Typical Odoo 19 CE paths (indicative) |
|----------|--------------------------------------|
| **Localisation** | `l10n_*` per country (e.g. `l10n_fr`, `l10n_de`, …) — charts, taxes, reports |
| **Mass mailing / marketing** | `mass_mailing`, `mass_mailing_*`, `marketing_card` |
| **Livechat / support** | `im_livechat`, `website_livechat`, `crm_livechat` |
| **Spreadsheets** | `spreadsheet`, `spreadsheet_dashboard`, bridge modules (`spreadsheet_account`, …) |

When product signs off one vertical: add acceptance (models, security CSV, tests, rollout) here or in the relevant gap audit, then add a **parity_matrix** row with phase number.

## Product gates (planning-only until sign-off)

- **647b (account reconcile):** **`docs/account_partial_reconcile_design.md`** — **D1** (dated **`res.currency`** rates vs implied line rate) and **D2** (cross-currency statement vs line policy, optional gain/loss stub). No implementation until product approves scope.
- **679 / phases 490–524:** **`docs/ai-implementation-checklist.md`** — product must **name one row** (e.g. MRP workorders, HR depth, web bundle hardening, AI/embeddings ops, readiness) before coding; through **1.233.0** there is still no **490–524** implementation without that pick.

When a row is chosen, add a short **acceptance paragraph** (models touched, tests, rollout risk) to this file or the relevant gap audit, then schedule a phase number in the matrix.

### 647b — acceptance template (product fills before engineering)

| Sign-off | Product choice (check one) |
|----------|----------------------------|
| **D1** | [ ] Use **`res.currency.rate`** (or ERP equivalent) for conversion on **same-currency** statement/move pairs instead of implied rate from **`amount_currency`** / debit–credit. |
| **D2** | [ ] Support **cross-currency** reconcile (statement currency ≠ move line foreign currency) with stated policy: rate date = statement date / move date / company default; [ ] optional draft **gain/loss** `account.move` stub. |

**Acceptance (engineering completes after sign-off):** Models: extend **`account.reconcile.allocation`**, **`account.bank.statement.line`**, wizard in **`account_reconcile_wizard.py`** as per **`account_partial_reconcile_design.md`**; **`res.currency`** / rates if D1. Tests: extend **`tests/test_account_reconcile_allocation_phase577.py`** (unskip **`test_phase647b_gated_next_slice_placeholder`** or add D1/D2 modules). Rollout: DB migration for new columns; document ops in **`DeploymentChecklist.md`**; no change to public JSON-2 contracts without **`api-contracts.md`** update.

### 679 — named next-depth row (default product pick for additional 490–524 scope)

Baseline checklist rows under **490–524** are already shipped (MRP, HR, web build, AI pgvector guard, ops probes). The **679** gate applies to *further* depth in that spirit. **Recommended named row:** **full Odoo `view_service` client depth (Phase P5)** — see **`docs/odoo19-webclient-gap-table.md`** section *Full `view_service` scope*.

**Acceptance paragraph:** *Scope: batch view + fields RPC shape (or equivalent), lazy per-view-type loading beyond **`/web/load_views`**, registries owning list/form/kanban/graph/calendar paths, progressive removal of monolithic **`main.js`** branches. Models touched: none on server unless **`load_views`** / RPC contracts change (then **`api-contracts.md`**). Tests: **`tests/test_modern_action_contract_phase636.py`**, **`tests/test_main_js_route_consistency_phase631.py`**, JS **`test_runner.html`** view suites, **`npm run check:assets-concat`** + **`npm run build:web`**. Rollout risk: high — CSP/OWL interaction and asset order; ship behind incremental phases with bundle rebuild after each merge.*

Product may substitute another **679** row; if so, replace this subsection and link the relevant gap audit.

### Track A — engineering execution checklist (Phase 807)

- **647b:** Do **not** merge FX reconcile code until product checks **D1** and/or **D2** in the template table above (and updates this file or **`account_odoo19_gap_audit.md`** with any scope nuance). Engineering may prepare branches behind the gate.
- **679 / Phase P5:** Do **not** start a **`view_service`** mega-milestone until product **confirms** the default row (**§679 named next-depth row**) or **substitutes** another row and acceptance is written here. Incremental webclient slices (navbar, widgets, ORM client) may continue without this gate.

### Deferred vertical — acceptance template (Phase 809)

When product picks **one** vertical from the path table above, fill in and link a new **parity_matrix** phase row:

1. **Vertical name** (e.g. l10n_fr, mass_mailing, im_livechat).
2. **Odoo 19 CE paths** (read-only diff targets under `odoo-19.0/addons/`).
3. **ERP modules / models / `ir.model.access.csv`** touched.
4. **Tests** (Python and/or JS paths).
5. **Rollout risk** (DB migration, feature flag, training).

Until this block is filled, **Track E** code is out of scope.

## Plan execution log (2026-03)

- **F1 / 647b** — FX partial reconcile: still **no implementation**; design gate unchanged in `docs/account_partial_reconcile_design.md`.
- **F2 / 679** — Phases **490–524** depth rows: still require **one named product row** before coding; no new row picked in this release.
- **Post-1.249 Phase F** — Unchanged: **647b** and **679** remain **product-gated**; no backend scope shipped under Phase F in release **1.249.0**.
- **Post-1.250 Phase F** — Unchanged: **647b** / **679** not implemented; frontend-only wave (**form WithSearch**, **`route_apply_registry`** plugins, boot debug, docs). **Full `view_service`** depth (Phase P5) not scheduled.

## Plan execution log (2026-04)

- **647b** — **Acceptance template** added above (D1/D2 checkboxes + models/tests/rollout). Implementation still **blocked** until product checks scope.
- **679** — **Default named row** documented: **Phase P5 / full `view_service` depth** with acceptance paragraph; product may override with another row.
- **Post–1.250.2** — **807** Track A execution checklist; **809** deferred vertical acceptance template; **808** prefetch + client ORM cache notes in **`odoo19_core_gap_table.md`**.
