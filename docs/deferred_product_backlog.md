# Deferred product areas (Track 6 / matrix)

Large **behavioural** work that is structurally scaffolded in the parity matrix but not scheduled unless product prioritizes it.

- **Localisation:** `l10n_*` modules — country-specific taxes, charts of accounts, reports.
- **Marketing / comms:** mass mailing, SMS campaigns at full Odoo depth.
- **Discuss / livechat:** real-time support stack parity.
- **Spreadsheets / studio-style** tooling.
- **Other niche apps** listed as deferred in `docs/parity_matrix.md`.

**Rule:** Do not start these without explicit product scope and phase budget. Complete stock/MRP/account/web/AI core tracks first (see `docs/ai-rules.md` reference analysis and `docs/odoo19_reference_map.md`).

## Product gates (planning-only until sign-off)

- **647b (account reconcile):** **`docs/account_partial_reconcile_design.md`** — **D1** (dated **`res.currency`** rates vs implied line rate) and **D2** (cross-currency statement vs line policy, optional gain/loss stub). No implementation until product approves scope.
- **679 / phases 490–524:** **`docs/ai-implementation-checklist.md`** — product must **name one row** (e.g. MRP workorders, HR depth, web bundle hardening, AI/embeddings ops, readiness) before coding; through **1.233.0** there is still no **490–524** implementation without that pick.

When a row is chosen, add a short **acceptance paragraph** (models touched, tests, rollout risk) to this file or the relevant gap audit, then schedule a phase number in the matrix.
