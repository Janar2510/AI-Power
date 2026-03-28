# AI Implementation Checklist

Verification checklist for AI assistant module deployment and feature additions.

## Master plan 799–802 (v1.244.0)

- [x] **`docs/odoo19_core_gap_table.md`** — Odoo `odoo/` vs `core/` mapping.
- [x] Business gap audits: **`sale`**, **`purchase`**, **`MRP`**, **`HR`**, **`CRM`** (`docs/*_odoo19_gap_audit.md`).
- [x] **`docs/odoo19-webclient-gap-table.md`** — field widget / action / hotkey rows; asset default note.
- [x] **`erp_webclient_esbuild_primary_enabled()`** default on; **`ERP_WEBCLIENT_ESBUILD_PRIMARY=0`** → concat (`core/http/routes.py`, **`tests/test_http.py`**).
- [x] **`legacy_main_route_tables.js`**, **`legacy_main_route_resolve.js`**, **`legacy_main_parse_utils.js`** + **`app/router.js`**, **`app/home_module.js`**.
- [x] Import modal token classes (**`webclient.css`**); **`docs/main_js_extraction_catalog.md`**, **`docs/design_spec_coverage_audit.md`**, **`docs/design_system_a11y_audit.md`**.
- [x] **`docs/parity_matrix.md`** rows **799–802**.

## Sale confirmation helper chain + schema bootstrap (Unreleased)

- [x] `core/db/schema.py` allows explicit `create_date` / `write_date` model fields without emitting duplicate access-log columns during `init_schema()` / `add_missing_columns()` (Phase **653** — `tests.test_schema_audit_columns`).
- [x] `sale.order.action_confirm()` works with the merged `sale` + `stock` + `account` + `sale_purchase` model stack via `_action_confirm_sale_core` / `_action_confirm_stock_core` / `_action_confirm_account_core` rather than fragile `super()` chains (Phase **654** — docstring + `tests.test_sale_confirm_phase465`).
- [x] Confirming a sale order still preserves all expected side effects: pricelist application, delivery picking creation, invoice status refresh, delivery status refresh, and confirmation email queueing (**Phase 665** — registry exposes **`_action_confirm_sale_core`**, **`_action_confirm_stock_core`**, **`_action_confirm_account_core`**; chain covered by **`tests.test_sale_confirm_phase465`** + **`tests.test_sale_confirm_side_effects_phase665`**; full mail/picking E2E: manual QA when changing confirm code).
- [x] `sale.order._create_invoice_with_quantities()` skips empty invoices when there are no invoiceable lines or delivered quantities (evidence: `tests.test_sale_invoice_phase466`, changelog).
- [x] `sale.order._create_invoice_with_quantities()` skips creating a duplicate only when a **draft** `out_invoice` already exists for the same SO reference; posted invoices do not block a new draft (`tests.test_sale_invoice_phase466`).
- [x] `purchase.order._create_bill_with_quantities()` skips empty vendor bills when there are no billable PO lines or received quantities (`tests.test_purchase_bill_phase471`).
- [x] `purchase.order._create_bill_with_quantities()` does not create a duplicate **draft** vendor bill when a draft already exists for the same PO reference (`invoice_origin` + `in_invoice`); posted bills do not block a new draft (`tests.test_purchase_bill_phase471`).
- [x] `purchase.order._get_received_qty_by_product()` includes pickings linked by `purchase_id` or by `origin` matching the PO name (**evidence:** **`tests.test_purchase_receipt_domain_phase473`** — **663**).
- [x] `purchase_stock` `purchase.order` `receipt_count` uses the same picking domain as received-qty (OR `purchase_id` / `origin`) (**evidence:** **`tests.test_purchase_receipt_domain_phase473.TestPurchaseStockReceiptCountDomain`** — **664**).
- [x] `purchase.order.action_cancel()` cancels open incoming pickings (draft/assigned) for the PO and related `stock.move` rows before setting state to `cancel` (restricts to `incoming` picking type when configured, same pattern as SO outgoing) (**evidence:** **`tests.test_purchase_cancel_pickings_phase476`** — **666**).
- [x] With `stock` installed, `sale.order.action_cancel()` cancels open **outgoing** pickings (draft/assigned) for the SO (`sale_id` or `origin`) and related moves before setting state to `cancel` (**evidence:** **`tests.test_sale_cancel_pickings_phase477`** — **666**).
- [x] `purchase.order.button_confirm()` and `sale.order._action_confirm_sale_core()` only confirm **draft** orders; cancelled orders are not returned to confirmed states (**Phase 673** — docstrings + **`tests.test_confirm_draft_guard_phase478`**).
- [x] `inter_company_rules` `sale.order.create` calls `sale.order._create_sale_order_record` instead of `super().create` (registry merge-safe) (**Phase 674** — `addons/inter_company_rules/models/sale_order.py`).
- [x] New `purchase.order` `create` overrides should delegate to `cls._create_purchase_order_record(vals)` (merge-safe), same as sale (**Phase 675** — **`tests.test_purchase_merge_safe_create_phase675`**).
- [x] New `res.partner` `create` overrides should delegate to `cls._create_res_partner_record(vals)` (merge-safe) (**Phase 685** — **`addons/base/models/res_partner.py`**, **`tests.test_res_partner_merge_safe_create_phase685`**).
- [x] New `account.move` `create` overrides should delegate to `cls._create_account_move_record(vals)` (merge-safe) (**Phase 686** — verified in **`addons/account/models/account_move.py`**).
- [x] New `payment.transaction` `create` overrides should delegate to `cls._create_payment_transaction_record(vals)` then run any post-create sync (merge-safe) (**Phase 727** — **`addons/payment/models/payment_transaction.py`**, **`tests.test_merge_safe_create_evidence_phase727`**).
- [x] New `product.template` `create` overrides should delegate to `cls._create_product_template_record(vals)` then run `_create_variant_ids` when variants apply (merge-safe) (**Phase 727** — **`addons/product/models/product_template.py`**, **`tests.test_merge_safe_create_evidence_phase727`**).
- [x] **`sale`** extends **`product.template`** with **`sale_ok`**, **`invoice_policy`**, **`service_type`**, **`expense_policy`** (**Phase 750** — **`addons/sale/models/product_template.py`**, **`tests.test_sale_product_integration_phase750`**).
- [x] New `mrp.production` `create` overrides should delegate to `cls._create_mrp_production_record(vals)` (merge-safe) (**Phase 727** — **`addons/mrp/models/mrp_production.py`**, **`tests.test_merge_safe_create_evidence_phase727`**).
- [x] New `mail.activity` `create` overrides should delegate to `cls._create_mail_activity_record(vals)` (merge-safe) (**Phase 727** — **`addons/mail/models/mail_activity.py`**, **`tests.test_merge_safe_create_evidence_phase727`**).
- [x] New `pos.order` / `pos.session` `create` overrides should delegate to `cls._create_pos_order_record(vals)` / `cls._create_pos_session_record(vals)` (merge-safe) (**evidence:** **`addons/pos/models/pos_order.py`**, **`pos_session.py`**).
- [x] New `account.bank.statement` `create` overrides should delegate to `cls._create_account_bank_statement_record(vals)` (merge-safe) (**evidence:** **`addons/account/models/account_bank_statement.py`**).
- [x] New `hr.leave` `create` overrides should delegate to `cls._create_hr_leave_record(vals)` (merge-safe) (**evidence:** **`addons/hr/models/hr_leave.py`**).
- [x] New `hr.expense.sheet` / `hr.payslip` `create` overrides should delegate to `cls._create_hr_expense_sheet_record(vals)` / `cls._create_hr_payslip_record(vals)` (merge-safe) (**Phase 728** — **`addons/hr_expense/models/hr_expense_sheet.py`**, **`addons/hr_payroll/models/hr_payslip.py`**, **`tests.test_merge_safe_create_evidence_phase728`**).
- [x] **`hr.expense.sheet.action_sheet_move_create()`** / **`_create_account_move_for_sheet()`** build a posted **`account.move`** (`entry`) with expense debits + payable credit; **`account.move.hr_expense_sheet_id`** links back to the sheet (**Phase 751** — **`addons/hr_expense/models/hr_expense_sheet.py`**, **`addons/hr_expense/models/account_move.py`**, **`tests.test_hr_expense_posting_phase751`**).
- [x] `mrp.production.action_cancel()` cancels open production-linked `stock.move` rows (draft/assigned) before setting the MO to `cancel` (**Phase 676** — **`tests.test_mrp_phase153.TestMrpPhase153.test_mrp_cancel_cancels_open_moves`**).
- [x] `account.move.action_post()` rejects non-draft moves, lines without `account_id`, moves without journal lines, and unbalanced debit/credit totals (**Phase 729** — **`account_move._validate_balanced_before_post`**, **`tests.test_account_post_phase467`** including **`test_action_post_rejects_non_draft_moves`**, **`test_action_post_rejects_line_missing_account`**).
- [x] Completed `payment.transaction` rows linked by `account_move_id` reduce `account.move.amount_residual` and auto-sync invoice state to `paid` when fully covered (**Phase 731** — **`addons/account/models/account_move.py`** **`_get_done_transaction_amount_for_move`**, **`_sync_payment_state_from_transactions`**; **`addons/payment/models/payment_transaction.py`** **`_sync_linked_invoice_payment_state`**; **`tests.test_account_payment_phase468`**).
- [x] `account.move.transaction_count` and `account.move.amount_paid` include direct `payment.transaction.account_move_id` links when `transaction_ids` is empty (**Phase 730** — **`addons/account_payment/models/account_move.py`** **`_get_linked_transactions`**; **`tests.test_account_payment_stats_phase469`**).
- [x] Completed invoice-linked `payment.transaction` rows create idempotent `account.payment` records with invoice link, payment reference, company, and journal defaults (**Phase 731** — **`payment_transaction._ensure_account_payment_record`**; **`tests.test_account_payment_record_phase470`**).
- [x] Focused regressions pass: `tests.test_schema_audit_columns` (requires psycopg2/DB — skipped in non-DB env), `tests.test_sale_confirm_phase465`, `tests.test_sale_invoice_phase466`, `tests.test_account_post_phase467`, `tests.test_account_payment_phase468`, `tests.test_account_payment_stats_phase469`, `tests.test_account_payment_record_phase470`, `tests.test_purchase_bill_phase471`, `tests.test_purchase_receipt_domain_phase473`, `tests.test_purchase_cancel_pickings_phase476`, `tests.test_sale_cancel_pickings_phase477` — 31/32 pass (Phase 1.245); (optional DB) `tests.test_confirm_draft_guard_phase478`, and (optional DB) `tests.test_mrp_phase153`.

## Phases 490–524 (business depth, frontend, AI, production)

- [ ] **Phase 679 (optional):** product must pick a **490–524** row before implementation — through **1.233.0** this slice stays **docs-only** (no **490–524** code); see **`docs/deferred_product_backlog.md`**.
- [ ] MRP: `mrp.workorder`, reservation + quant completion on MO done; SO-driven MO when `product.template.manufacture_on_order` and `sale_mrp` loaded.
- [ ] HR: employee lifecycle + contract start + attendance promotion; leave approval note; payroll + attendance lines.
- [ ] Web: `npm run build:web` succeeds when Node is available; `tsconfig.json` + `framework/component_base.js` present.
- [x] AI: `ai_assistant.embeddings.pipeline` documents pgvector; `retrieve_chunks` uses **`<=>`** only when **`pg_extension.vector`** is installed **and** the embedding column is native **`vector`**; otherwise ILIKE (**Phase 745**).
- [ ] Ops: `/readiness` for probes; `json_log.format_json_log` available; security checklist doc reviewed.

## Phases 525–529 (reference roadmap: stock/MRP depth, assets, RAG, hardening)

- [x] Stock picking behavioural lifecycle documented in `docs/parity_matrix.md` (Phase 525).
- [x] MRP BOM operations + multi work orders + cost estimate heuristic (Phase 526); tests `test_mrp_bom_operations_phase526`.
- [x] Web concat guard: `npm run check:assets-concat`; CI runs `build:web` when Node is installed (Phase 527).
- [x] `ai.document.chunk` embedding refresh on text write; pipeline doc in `embeddings/pipeline.py` (Phase 528); test `test_ai_chunk_embed_phase528`.
- [x] JSON access logging: `ERP_JSON_ACCESS_LOG` / `--json-access-log`; health vs readiness docstrings (Phase 529).

## Phases 530–534 (stock partial reserve, MRP cost stub, RAG, sale picking count, rules)

- [x] Planning gate: `docs/ai-rules.md` reference analysis (Odoo 19.0 + ERP); `.cursor/rules/dual-codebase-analysis.mdc`.
- [x] Stock partial reservation: `quantity_reserved`, `partial` move state; tests `test_stock_partial_reserve_phase530`.
- [x] MRP: `cost_draft_move_id` + draft `account.move` stub on MO done when `cost_estimate` > 0.
- [x] `sale_stock.picking_count` uses `stock.picking` `sale_id` OR `origin`.
- [x] `ai.rag.reindex` includes `knowledge.article`; `retrieve_chunks` ilike test `test_ai_retrieve_chunks_phase532`.
- [x] Deferred large modules: `docs/deferred_product_backlog.md`.

## Phases 535–538 (account depth wave F)

- [x] Gap audit doc: `docs/account_odoo19_gap_audit.md` (clone `odoo-19.0` for upstream file inventory when missing).
- [x] `account.move.action_post`: move must be **draft**; each line has **account_id**; still balanced (Phase 535).
- [x] `account.tax.compute_all`: single **percent** + **price_include** extracts tax from included subtotal (Phase 536).
- [x] Bank reconcile: `action_reconcile` + wizard flows tested (Phase 537); partial reconcile vs Odoo remains **deferred** (matrix 538 / audit).
- [x] Full Odoo `account_reports` parity **deferred**; ERP SQL reports unchanged (Phase 538).
- [x] Quick verify: `./scripts/run_account_wave_f_smoke.sh` or `npm run test:account-smoke` (3 modules, no DB); broader: `./scripts/run_account_wave_f_broad.sh` or `npm run test:account-broad` (+ sale/purchase invoice fakes). Full account+DB+stock chain is slower because **each** `tests.test_*` file runs `load_module_graph()` once—see `DeploymentChecklist.md` Phase 535–538.

## Phases 539–544 (next waves G–L)

- [x] Stock + `stock_account` gap audit: `docs/stock_odoo19_gap_audit.md`; Phases **539–541** in `tests/test_phases_539_541_stock_mrp_sale_db.py` (one `load_module_graph` + `load_default_data`); helper `./scripts/run_phases_539_541_db.sh`.
- [x] Web dual-codebase asset strategy in `docs/frontend.md` Phase **542**; concat+guard remains default.
- [x] `RAG_REINDEX_MODELS` includes `sale.order`; Phase **543**; `test_ai_rag_scope_phase543`.
- [x] Account Wave L deferrals (Phase **544**): fiscal slices **546**/**551**/**555**; minimal lock **557**; **544** row tracks multi-tax chain, partial reconcile, strict sequences — `docs/account_odoo19_gap_audit.md`.

## Wave M — Phases 545–549

- [x] **545:** Phase 540 in `test_phases_539_541_stock_mrp_sale_db` creates expense + `asset_current` accounts when missing; `tests/test_translate_discover_phase545.py`; CI workflow notes pgvector optional on stock Postgres image.
- [x] **546:** Minimal fiscal positions (`account.fiscal.position`, `.tax`), `sale.order.fiscal_position_id`, `apply_fiscal_position_taxes()` — `tests/test_account_fiscal_phase546.py`.
- [x] **547:** `embedding_column_is_pgvector_type` + `retrieve_chunks` uses `<=>` only for native `vector` column; `tests/test_embedding_column_phase547.py`.
- [x] **548:** `GET /web/manifest.webmanifest` + manifest link in webclient shell — `tests/test_http.py`.
- [x] **549:** `parity_matrix.md`, gap audits, `frontend.md`, this checklist updated.

## Wave N — Phases 550–554

- [x] **550:** README + `DeploymentChecklist.md` — inline `#` vs `erp-bin` args; Homebrew/pgvector note; pointer to `tests/test_translate_discover_phase545.py`.
- [x] **551:** `purchase.order.fiscal_position_id`, `apply_fiscal_position_taxes()`; `account.move.fiscal_position_id` + draft line `tax_ids` via `apply_fiscal_position_taxes()` — `tests/test_account_fiscal_purchase_invoice_phase551.py`.
- [x] **552:** JSONB→vector migration + re-embed notes in `addons/ai_assistant/embeddings/pipeline.py`; read-only `scripts/check_embedding_column.py`.
- [x] **553:** `GET /web/sw.js` + shell `navigator.serviceWorker.register` — `tests/test_http.py`.
- [x] **554:** `parity_matrix.md` rows 550–553, Phase **544** description update, `docs/frontend.md`, `docs/account_odoo19_gap_audit.md` Phase 551, this checklist.

## Wave O — Phases 555–559

- [x] **555:** `res.partner.fiscal_position_id`; `sale.order._sale_order_prepare_vals` + account merge; PO fiscal from partner — `tests/test_account_fiscal_partner_default_phase555.py`.
- [x] **556:** SW `caches.open` / `addAll` for concat shell assets — `tests/test_http.py`.
- [x] **557:** `res.company.account_lock_date` + post guard — `tests/test_account_lock_date_phase557.py`.
- [x] **558:** Command palette a11y + README/`frontend.md` Mod+K.
- [x] **559:** Parity matrix 555–559, Phase **544** row, gap audit, this checklist, `changelog.md`, `DeploymentChecklist.md`.

## Phase P — Modular frontend foundation + account company (560)

- [x] **Frontend:** Acceptance criteria in `docs/frontend.md` (Modular bootstrap — Phase P); `docs/odoo19-webclient-gap-table.md` status column + foundation vs full parity; `addons/web/static/src/app/main.js` non-blocking `menu.load(false)` after `startServices`; rebuild `addons/web/static/dist/modern_webclient.js` via `npm run build:web` (or `npx esbuild` as in CI).
- [x] **Parity matrix:** Modular frontend bootstrap foundation row **done**; Phase **560** row for `account.move` / `account.journal` `company_id` + per-company lock.
- [x] **560:** `account.move.company_id`, `account.journal.company_id`; `action_post` uses move company for `account_lock_date`; index `account_move_company_id_idx`; tests `tests/test_account_move_company_phase560.py` (DB optional).
- [x] **Stock design:** `docs/stock_valuation_layers_scope.md` (Tier A–C pre-code); link from `docs/stock_odoo19_gap_audit.md`.
- [x] **Account audit:** `docs/account_odoo19_gap_audit.md` Phase 560 shipped notes.

## Phases 561–565 (Waves Q–S: web depth, account, stock Tier A)

- [x] **561–562:** `shell_chrome.js`, `list_control_panel.js`, `list_view.js` delegation, `odoo19-webclient-gap-table.md`, `frontend.md` Wave Q section; `npm run build:web` / `npx esbuild` for `modern_webclient.js`.
- [x] **563:** Multi-tax all-included `compute_all`; `tests/test_account_tax_multi_include_phase563.py`; gap audit + matrix **544** / **563**.
- [x] **564:** `ir.sequence.company_id`, `next_by_code(..., company_id)`; `account_move` naming; `tests/test_ir_sequence_company_phase564.py`.
- [x] **565:** `stock.valuation.layer` `remaining_qty` / `remaining_value`; `stock_move_quant` create paths; `stock_valuation_layers_scope.md` + `stock_odoo19_gap_audit.md`.

## Phases 566–573 (post–1.207: Wave U/V/W)

- [x] **566–567:** `navbar_contract.js`, `form_footer_actions.js`, `AppCore.FormFooterActions`, legacy `main.js` delegation; `odoo19-webclient-gap-table.md`; `npm run build:web` → `modern_webclient.js`.
- [x] **568:** Mixed include/exclude `account.tax.compute_all`; tests in `tests/test_account_tax_multi_include_phase563.py`.
- [x] **569:** `ir.sequence` `reference_date` + `use_date_range`; `account.move` passes move `date`; `tests/test_ir_sequence_date_range_phase569.py`.
- [x] **570–571:** FIFO `remaining_*` consumption on outgoing; `res.company.stock_valuation_auto_account_move`; `stock_valuation_layers_scope.md` + `stock_odoo19_gap_audit.md`.
- [x] **572:** `docs/account_partial_reconcile_design.md` (design-only).
- [x] **573:** `docs/frontend.md` Phase 542 milestone + gap table assets row; `changelog.md` **1.208.0**; `DeploymentChecklist.md`; matrix **544** / **566–573**; `account_odoo19_gap_audit.md`.

## Phases 574–583 (post–1.208: Waves X/Y/Z/H)

- [x] **574–575:** Breadcrumb strip + kanban chrome + navbar systray facade; `odoo19-webclient-gap-table.md`; `npm run build:web` → `modern_webclient.js`.
- [x] **576:** `ERP_WEBCLIENT_ESBUILD_PRIMARY` pilot documented in `docs/frontend.md`; CI comment `.github/workflows/ci.yml`.
- [x] **577:** `account.reconcile.allocation`, wizard `allocate_amount`, `account_partial_reconcile_design.md` + matrix **544** / **577**, `account_odoo19_gap_audit.md`; `tests/test_account_reconcile_allocation_phase577.py`.
- [x] **578–581:** AVCO outgoing, `lot_id` layers, `stock_valuation_allow_negative`, category account fields; `stock_valuation_layers_scope.md`, `stock_odoo19_gap_audit.md`; `tests/test_stock_valuation_post208_phase578_581.py`.
- [x] **582–583:** `next_by_code` company_id on SO/PO/bank statement; `account_lock_adviser_group_id` bypass on post.
- [x] **Release docs:** `core/release.py` **1.209.0**, `changelog.md`, `DeploymentChecklist.md`, `docs/parity_matrix.md`.

## Phases 584–589 (post–v1.209: FE-1 / FE-2 / release 1.210.0)

- [x] **584:** `navbar_chrome.js` + `AppCore.NavbarChrome.buildHtml`; `core/navbar.js` delegates; glass search row + `wireGlobalSearch`; `__erpLegacyRuntime.renderSystrayMount` after navbar render.
- [x] **585:** `dashboard_kpi_strip.js` + `AppCore.DashboardKpiStrip`; `renderHome` KPI strip (`dashboard-home.md` grid).
- [x] **586:** `ERP_WEBCLIENT_ESBUILD_PRIMARY` → `_webclient_html` per-file JS; bootstrap `esbuildPrimary`; `tests/test_http.py` coverage.
- [x] **587–589:** Shell CSS tokens/layout; parity matrix + gap table; `core/release.py` **1.210.0**, `changelog.md`, `DeploymentChecklist.md`, `frontend.md`, CI comment.

## Phases 590–596 (parallel track / v1.211.0)

- [x] **590:** KPI **`wireHomeKpiStrip`**; **`ListView`/`DiscussView` setImpl** + fallthrough in `list_view.js`/`discuss.js`; **`opts.rpc`** in discuss core renderer.
- [x] **591–592:** CRM **`getTitle`**; list/form PDF via **`PdfViewer`**; **`test_pdf_viewer.js`**; attachment focus restore.
- [x] **593:** SW dynamic precache + **`tests/test_http.py`** SW tests.
- [x] **594:** **`tests/test_parallel_track_be_phase590.py`** (CRM config XML + lost reason model).
- [x] **595–596:** Gap table Views row; release **1.211.0** docs.

## Phases 597–601 (post–v1.211: chatter, dashboard, account journal, shortcuts, release 1.212.0)

- [x] **597:** Modular **chatter chrome** (`chatter_strip.js`, `AppCore.ChatterStrip`, `main.js` / `loadChatter`); `form-view.md` chatter section; `webclient.css` tokens.
- [x] **598:** **Dashboard** KPI empty state (`EmptyState`); **activity feed** meta includes **res_model** hint.
- [x] **599:** **`account.journal.currency_id`** default from company; **`test_account_journal_currency_phase599.py`**.
- [x] **600:** **`webclient_shortcut_contract.js`** + **`test_webclient_shortcut_contract.js`**; legacy **list fallback** toolbar/table token CSS in `main.js` / `webclient.css`.
- [x] **601:** Release **1.212.0** docs (changelog, matrix, DeploymentChecklist, gap table).
- [x] **602:** **`init_schema`** on **`erp-bin`** startup for existing DBs (**`_sync_orm_schema`**); prefork **`_ensure_default_db`**; release **1.212.1** docs (**evidence:** `core/cli/server.py`, `changelog.md`, matrix, DeploymentChecklist).

## Phases 603–607 (kanban card, gantt/activity tokens, move currency, checklist 437 bite, release 1.213.0)

- [x] **603:** **`KanbanCardChrome`** + **`kanban_renderer`** delegation; **`kanban-view.md`** card shell (**evidence:** `kanban_card_chrome.js`, `app/main.js`, `webclient.css`).
- [x] **604:** **Gantt** / **activity matrix** legacy **`main.js`** toolbars + tables tokenized (**evidence:** `main.js`, `webclient.css`).
- [x] **605:** **`account.move.currency_id`** from **`journal_id.currency_id`** on create (**evidence:** `account_move.py`, `test_account_move_currency_from_journal_phase605.py`).
- [x] **606:** Checklist **437** load order — **`helpers.js`** immediately before **`form_view.js`** in **`web.assets_web`** (**evidence:** `addons/web/__manifest__.py` asset list order).
- [x] **607:** Release **1.213.0** docs (changelog, matrix, DeploymentChecklist, gap table, account audit).

## Phases 608–613 (SearchModel + graph chrome + field tokens + lock adviser + release 1.214.0)

- [x] **608:** **`SearchModel.applyDefaultsFromContext`** for **`search_default_*`**; **`facets`** + **`_facetsDefaultsApplied`** reset when list **model** changes (**evidence:** `search_model.js`, `main.js`, `test_search_model.js`).
- [x] **609:** **`AppCore.GraphViewChrome.buildToolbarHtml`**; **`main.js`** graph fallback delegates; **`design-system/specs/graph-view.md`**; **`webclient.css`** graph toolbar tokens (**evidence:** `app/graph_view_chrome.js`, `__manifest__.py`, `app/main.js` side-effect import for esbuild).
- [x] **610:** **`priority`** / **`state_selection`** widgets use **`webclient.css`** classes (**evidence:** `field_registry.js`, `test_field_registry.js`).
- [x] **611:** **`test_account_lock_adviser_phase611.py`** + **`account_odoo19_gap_audit.md`** adviser bypass note (**583**).
- [x] **612:** **`getAutocompleteSuggestions`** matches name/label only (**evidence:** `search_model.js`, `test_search_model.js`).
- [x] **613:** Release **1.214.0** docs (changelog, matrix, DeploymentChecklist, gap table, checklist).

## Phases 614–619 (pivot/calendar chrome, ActionManager tests, RPC context, release 1.215.0)

- [x] **614:** **`AppCore.PivotViewChrome`** + **`pivot-view.md`** + **`.o-pivot-*`** table tokens (**evidence:** `pivot_view_chrome.js`, `main.js`, `webclient.css`, `__manifest__.py`).
- [x] **615:** **`AppCore.CalendarViewChrome`** + **`calendar-view.md`** + **`.o-calendar-*`** grid (**evidence:** `calendar_view_chrome.js`, `main.js`).
- [x] **616:** **`ActionManager.doActionButton`** **`object`** vs **`action`** — **`test_action_manager_phase616.js`** + **`test_runner.html`** (**evidence:** checklist **437** row).
- [x] **617:** **`merge_session_into_rpc_context`** in **`core/rpc_session_context.py`** + **`tests/test_merge_rpc_context_phase617.py`** (**evidence:** `core/http/rpc.py` imports).
- [x] **618:** Graph/pivot load errors → **`o-list-load-error`** (**evidence:** `main.js`**).
- [x] **619:** Release **1.215.0** docs (changelog, matrix, DeploymentChecklist, gap table, checklist).

## Phases 630–635 (app routing parity + strict routing flag + release 1.219.0)

- [x] **630:** Playbook in **`docs/frontend.md`** — **`__ERP_DEBUG_SIDEBAR_MENU`**, **`__ERP_STRICT_ROUTING`**, hash triage.
- [x] **631:** **`tests/test_main_js_route_consistency_phase631.py`** — **`DATA_ROUTES_SLUGS`** vs **`getModelForRoute`** vs **`menuToRoute`** literals + **`fleet_vehicle`** mapping.
- [x] **632:** **`main.js`** — **`fleet`** + **`website`** + **`ecommerce`** in **`DATA_ROUTES_SLUGS`**; **`actionToRoute`** **`fleet_vehicle`→`fleet`**; **`menuToRoute`** **`messaging`→`discuss`**; dedicated **`website`** / **`ecommerce`** placeholder shells.
- [x] **633:** **`window.__ERP_STRICT_ROUTING`** — unknown list/form routes show **`EmptyState`** instead of silent **`renderHome()`**.
- [x] **634:** Missing apps parity + working menu rows closed with evidence (**above**).
- [x] **635:** Version **1.219.0** + changelog + matrix + DeploymentChecklist.

## Phases 647+ partial, 681, 689–692 (post–1.224.0 + release 1.225.0)

- [x] **647+ (partial):** **`account.reconcile.allocation`** **`amount_currency`** / **`currency_id`**; wizard converts statement amounts when statement and move line share foreign currency + **`amount_currency`** on the line (**evidence:** **`account_reconcile_wizard.py`**, **`tests/test_account_reconcile_allocation_phase577.py`** **`test_phase647_allocation_has_currency_audit_fields`**).
- [x] **681:** **`applyActionStackForList`** + **`__ERP_PENDING_LIST_NAV_SOURCE`** (**sidebar** / **selectApp** / **navigateFromMenu**) — **`tests/test_modern_action_contract_phase636.py`** **`test_phase681_list_breadcrumb_append_from_chrome`**.
- [x] **689:** **`window.__ERP_getModelForRoute`**, **`getAppIdForRoute`** model fallback documented (**evidence:** **`docs/frontend.md`**, **`tests/test_main_js_route_consistency_phase631.py`** **`test_phase689_app_chrome_model_fallback_hook`**).
- [x] **691:** **`createViewService`**, registry **`view`**, **`loadViews`** (**evidence:** **`app/services.js`**, **`test_modern_action_contract_phase636`** **`test_phase691_view_service_registered`**).
- [x] **692:** CI **Webclient esbuild-primary smoke** step (**evidence:** **`.github/workflows/ci.yml`**).

## Phases 693–694, 668 slice, 726, 647b, ops staging (release 1.226.0)

- [x] **693:** **`ViewManager.openFromActWindow`** calls **`view.loadViews`** + **`__ERP_lastLoadViews`** (**evidence:** **`view_manager.js`**, **`test_modern_action_contract_phase636`** **`test_phase693_view_manager_prefetches_load_views`**).
- [x] **694:** **`syncHashWithActionStackIfMulti`** + stack preserve in **`applyActionStackForList`** (**evidence:** **`main.js`**, **`test_phase694_breadcrumb_stack_sync_hash`**).
- [x] **668 (726):** Form object **`act_window`** → **`route()`** (**evidence:** **`test_phase668_form_object_action_act_window_uses_route`**).
- [x] **726:** **`stock.picking`** / **`hr.expense`** merge-safe **`create`** (**evidence:** **`test_stock_picking_merge_safe_create_phase726`**, **`test_hr_expense_merge_safe_create_phase726`**).
- [x] **727:** **`payment.transaction`**, **`product.template`**, **`mrp.production`**, **`mail.activity`** merge-safe **`create`** evidence (**`tests.test_merge_safe_create_evidence_phase727`**); process-env esbuild smoke (**`tests.test_esbuild_primary_process_env_phase727`** when **`ERP_WEBCLIENT_ESBUILD_PRIMARY=1`**).
- [x] **728:** **`hr.expense.sheet`** / **`hr.payslip`** merge-safe **`create`** evidence (**`tests.test_merge_safe_create_evidence_phase728`**).
- [x] **729 (partial Q):** **`account.move.action_post`** guardrails documented in checklist + **`tests.test_account_post_phase467`** (non-draft, missing **`account_id`**).
- [x] **730 (Q row 34):** **`transaction_count`** / **`amount_paid`** fallback via **`account_move_id`** when **`transaction_ids`** empty (**`account_payment`** + **`tests.test_account_payment_stats_phase469`**).
- [x] **731 (Q rows 33 + 35):** Residual / **`paid`** sync + idempotent **`account.payment`** from done **`payment.transaction`** (**`tests.test_account_payment_phase468`**, **`tests.test_account_payment_record_phase470`**).
- [x] **732:** Portal **`/my/invoices/<id>/pay`** (demo) and **`/payment/status/<ref>`** rely on **`payment.transaction`** sync hooks (**Phase 731**), not direct **`account.move.write({state: paid})`** (**evidence:** **`payment/controllers/payment.py`**, **`website/controllers/website.py`**, **`tests.test_portal_invoice_pay_phase199`**).
- [x] **733:** **`test_portal_invoice_pay_phase199`** bootstraps minimal sale journal + accounts when **`load_default_data`** is thin; **`test_payment_transaction_invoice_db_phase733`** DB smoke; **`account_odoo19_gap_audit.md`** **`account_move_id`** vs M2M note.
- [x] **734:** **`test_payment_transaction_write_done_phase734`** — **`write({state: done})`** after **`pending`** **`create`**; shared **`tests/payment_test_bootstrap.py`**.
- [x] **647b:** Design gate in **`account_partial_reconcile_design.md`** + skipped **`test_phase647b_gated_next_slice_placeholder`**.
- [x] **Ops staging:** **`DeploymentChecklist.md`** — **`ERP_WEBCLIENT_ESBUILD_PRIMARY=1`** pilot smoke.

## Phases 620–628 (kanban load-more + home layout + checklist audit + release 1.218.0)

- [x] **620–622:** Kanban **load more** + **delegated** events + **`test_kanban_renderer.js`** (**evidence:** **`kanban_renderer.js`**, **`test_kanban_renderer.js`**).
- [x] **623–626:** **`renderHome`** — app grid before KPI strip; dashboard wrap unchanged (**evidence:** **`main.js`**).
- [x] **621 (audit):** Checklist rows **215–218** verified against **`routes.py`**, **`rpc.py`**, **`main.js`** (bundled into wave 1 checklist pass).
- [x] **627–628:** Router **`setHandlers`** test + version **1.218.0** + docs (**evidence:** **`test_router.js`**, **`core/release.py`**, **`changelog.md`**).

## Sidebar navigation (greyed-out submenus)

- [x] CRM Configuration submenus (Stages, Tags, Lost Reasons) resolve actions and routes; `crm.lost.reason` model installed after upgrade (**evidence:** `crm_views.xml` act_windows + menus; `tests/test_parallel_track_be_phase590.py`; `DATA_ROUTES_SLUGS` / `getModelForRoute` already include `crm_stages`, `crm_tags`, `crm_lost_reasons`).
- [x] `DATA_ROUTES_SLUGS` in `main.js` stays aligned with `actionToRoute` / `getModelForRoute` for new list routes (**verified for CRM config slugs in this wave**).
- [x] `window.__ERP_DEBUG_SIDEBAR_MENU` can be used to trace any remaining menus without routes (**evidence:** `docs/frontend.md` playbook; `main.js` opt-in logging when flag is true).

## Frontend Pro Max phases 451-464 (1.205)

- [x] Typography tokens (`--font-*`, `--text-*`, leading/tracking tokens) are present and used by shell/headings (**evidence:** `webclient.css` navbar brand + KPI strip use `var(--font-display)` / `var(--font-body)` / `var(--text-*)`; foundations unchanged).
- [x] Glassmorphism tokens (`--color-glass`, `--glass-blur`, `--glass-border`) are applied to navbar/modal/dropdowns without breaking contrast (**evidence:** `#navbar` + `.o-navbar-glass-row` use `var(--color-glass)` / `var(--glass-border)` / inner surfaces).
- [x] View transition classes (`.o-view-enter/.o-view-exit`) are active and reduced-motion safe (**evidence:** `main.js` `routeApplyInternal`; `@media (prefers-reduced-motion: reduce)` clears animation/transform on enter/exit and KPI hover).
- [x] Skeleton helper (`AppCore.Helpers.renderSkeletonHtml`) is used for list/form/report loading states (**evidence:** `main.js` `skeletonHtml()` delegates to `HelpersCore.renderSkeletonHtml`; `loadRecords` / report tables use it).
- [x] Empty state component (`UIComponents.EmptyState`) is wired in list no-record branch (**evidence:** `core/list_view.js` uses `UI.EmptyState.renderHTML` when available).
- [x] `services/systray_registry.js` is loaded and systray async badge updates from `/web/async/call_notify` (**evidence:** manifest + `main.js` `renderSystrayMount` fetch; **584** calls mount after `AppCore.Navbar.render`).
- [x] `AppCore.DiscussView.setImpl` and `AppCore.ListView.setImpl` boundaries are available (**evidence:** `main.js` registers adapters returning false → default **`core/*`** renderers; **590**).
- [x] PDF preview component opens `/report/pdf/...` from both list and form actions (**evidence:** list **Print** + form **Print** → **`PdfViewer.open`**; **591**).
- [x] Attachment viewer opens image previews and supports close/keyboard flow (**evidence:** **Esc** / arrows existing; close button focus on open + restore focus on close — **592**).
- [x] Expanded keyboard shortcuts (`Alt+N/S/E/L/K/P`, `Esc`) execute expected actions (**evidence:** `main.js` keydown handler; frozen **`__ERP_WEBCLIENT_SHORTCUT_CONTRACT`** + **`test_webclient_shortcut_contract.js`** documents the Alt+ set and Escape branch).
- [x] JS unit tests are wired for helpers/systray/onboarding/attachment viewer (**evidence:** **`test_pdf_viewer.js`** added to **`test_runner.html`** — **592**).

## Phases 437–450 (1.204)

- [x] `core/helpers.js` is loaded before `form_view.js` / `list_view.js` and shared helpers are available at `window.AppCore.Helpers` (**evidence:** **`web.assets_web`** order in **`addons/web/__manifest__.py`** — **`helpers.js`** precedes **`form_view.js`** and **`list_view.js`**; Phase **606**).
- [x] `SearchModel` facet lifecycle works end-to-end (`addFacet/removeFacet/renderFacets`) and `search_default_*` context values become initial facets (**evidence:** **`list_view.js`** + **`test_search_model.js`**; **608**).
- [x] Search autocomplete suggestions appear from search-view fields and selected suggestion applies a domain facet (**evidence:** **`list_view.js`** input handler + **`getAutocompleteSuggestions`**; precision **612**).
- [x] Custom filter builder can add ad-hoc domain facets and reload list results (**evidence:** **Custom filter…** branch in **`list_view.js`** — **608** scope).
- [x] Kanban supports fold persistence, multi-select bulk bar, progressive loading, optional **`cardTemplate`**, and **load-more** rows use **`KanbanCardChrome`** when registered (**evidence:** **`kanban_renderer.js`** + **`test_kanban_renderer.js`** — **620–622**).
- [x] `field_registry.js` renders new widgets (`priority`, `state_selection`, `handle`, `email`, `url`, `phone`, `copy_clipboard`, `float_time`, `radio`, `many2many_checkboxes`) (**evidence:** **`test_field_registry.js`**; **610** token classes for **`priority`** / **`state_selection`**).
- [x] `ActionManager.doActionButton()` handles both `type="object"` and `type="action"` form header buttons (**evidence:** **`main.js`** `[data-btn-type]` wiring + **`test_action_manager_phase616.js`** — **616**).
- [x] `ConfirmDialog.openModal()` is usable for wizard flows (`target: "new"`) including breadcrumb updates (**evidence:** **`main.js`** form button runner + **`confirm_dialog.js`** **`setBreadcrumbs`** — **621** audit).
- [x] `/web/action/run_server_action` executes `ir.actions.server` with user context and returns JSON result payload (**evidence:** **`core/http/routes.py`** **`run_server_action`** — **621** audit).
- [x] `/web/async/call_notify` returns async queue counts for the current user session (**evidence:** **`routes.py`** **`async_call_notify`** + **`main.js`** systray fetch — **621** audit).
- [x] Session includes `allowed_company_ids` and RPC context receives `company_id` + `allowed_company_ids` when provided (**evidence:** **`merge_session_into_rpc_context`** + **`core/http/rpc.py`** call_kw paths — **617** / **621** audit).
- [x] JS unit tests are wired and visible in `test_runner.html` for search model, field registry, **ActionManager**, **kanban_renderer**, **router** (**evidence:** **`test_kanban_renderer.js`**, **`test_router.js`** — **620** / **627**).

## Phases 423–436 (1.203)

- [x] Router handlers are registered through `AppCore.Router.setHandlers` and route flow still handles unsaved form confirmation (**evidence:** **`main.js`** boot **`RouterCore.setHandlers`** + **`test_router.js`** **setHandlers** test — **627**).
- [x] `AppCore.Sidebar` is loaded before `main.js` and sidebar render/wire delegation is active (**evidence:** **`addons/web/__manifest__.py`** **`sidebar.js`** before **`main.js`** + **`main.js`** **`AppCore.Sidebar.setImpl`** — **627** audit).
- [x] `AppCore.FormView.setImpl` is registered from `main.js` (no behavior regression for form create/edit/chatter paths) (**evidence:** **`main.js`** **`AppCore.FormView.setImpl`** — **627** audit).
- [x] `ir.async` model is available over RPC (`call`, `call_notify`, `run_pending`, `gc_done`) and scheduler runs pending jobs (**evidence:** **`core/http/rpc.py`** `_CLASS_METHODS`; **`tests/test_ir_async_rpc_phase644.py`** — **644**).
- [x] Report async endpoint `/report/pdf_async/<report>/<ids>` queues jobs successfully (**evidence:** **`core/http/report.py`** `handle_report` + **401** without session in **`test_ir_async_rpc_phase644`** — **644**; full queue requires logged-in session).
- [x] `core/http/report.py` qweb-ish directive mapping works for templates using `t-foreach`, `t-if`, `t-esc`, `t-raw` (Phase **656** multi-pass — `tests.test_report_qweb_phase656`).
- [x] `ir.actions.report` supports `attachment_use` flow and PDF cache writes to `ir.attachment` when enabled (existing `_render_report_pdf` path — **656** wave documents parity; no behavioural change this release).
- [x] Record-rule evaluation applies default company domain when model has `company_id` and context has `allowed_company_ids` (Phase **657** — `_append_allowed_company_domain_for_model` on XML + DB `ir.rule` paths; `tests.test_record_rule_company_phase657`).
- [x] Added scaffold bridges are importable: `sale_stock`, `purchase_stock`, `stock_account`, `contacts`, `mrp_account`, `website`, `website_sale`, `inter_company_rules` (**evidence:** all 8 dirs present under `addons/` — **Phase 1.245 F4**).
- [x] Added phase 436 tests run in CI/local and handle schema-unavailable environments via skips.

## Phases 409–422 (1.202)

- [ ] DB upgrade after pull: `ir.model.data`, `ir.model.fields`, generic XML loader paths.
- [ ] Demo optional: `erp-bin db init --demo` or `ERP_LOAD_DEMO=1`.
- [ ] Web: `__erpForm`, Discuss RPC view, SelectCreateDialog modal, fuzzy command palette (`mod+k`), import CSV helpers.
- [ ] Prefetch: call sites may use `Model.prefetch_read` before iterating recordsets (optional optimization).

## Next phases / Odoo parity (1.201)

- [x] `web.assets_web` loads `field_registry.js`, `search_model.js`, `action_manager.js` before `list_view.js` / `main.js` (**evidence:** **`addons/web/__manifest__.py`** — **627** audit).
- [ ] Confirm modal works for bulk delete, row delete, and unsaved form navigation (`UIComponents.ConfirmDialog`).
- [ ] Optional: set `attachment_location=file` and `data_dir` (or `filestore_path`) for disk attachments; Pillow optional for image resize (`attachment_image_max`).
- [ ] In-process cron runs in dev (`erp-bin server` single worker); `ir.cron._trigger` issues `NOTIFY erp_cron_wake` when DB supports it.
- [ ] `mail.followers` / `mail.tracking.value` access rows present; upgrade DB after pull so new tables/columns exist.

## Missing apps parity (1.200)

- [x] CRM app root is `CRM` with nested Sales/Leads/Reporting/Configuration menus (**evidence:** **`addons/crm/views/crm_views.xml`** **`crm_menu_root`** / **`crm_menu_sales`** / **`crm_menu_report`** / **`crm_menu_config`** — **634**).
- [x] Discuss has a top-level app menu (`menu_discuss_root`) and routes to **`#discuss`** (**evidence:** **`addons/mail/views/mail_template_views.xml`**; **`main.js`** **`renderDiscuss`** + **`menuToRoute`** **`discuss`** / **`messaging`** — **630–632**).
- [x] HR sub-apps promoted to top-level: Expenses, Attendances, Recruitment, Time Off (**evidence:** **`tests/test_missing_apps_parity_phase408.py`** **`test_hr_promoted_app_roots_exist`** — **634**).
- [x] Analytic root moved under Invoicing Configuration (**evidence:** **`tests/test_missing_apps_parity_phase408.py`** **`test_analytic_moved_under_invoicing_config`** — **634**).
- [x] App menu/routing matrix supports: `pipeline`, `crm/activities`, `expenses`, `attendances`, `recruitment`, `time_off`, `repair_orders`, `surveys`, `lunch_orders`, `livechat_channels`, `project_todos`, `recycle_models`, `skills`, `elearning` (**evidence:** **`DATA_ROUTES_SLUGS`** + **`getModelForRoute`** + **`tests/test_main_js_route_consistency_phase631.py`** — **631**).
- [x] Scaffold modules expose at least one root menu + list/form action view: repair, survey, lunch, im_livechat, project_todo, data_recycle, hr_skills (**evidence:** **`test_scaffold_modules_have_view_files_and_root_menus`** in **`test_missing_apps_parity_phase408.py`** — **634**; **website_slides** via **`slide.channel`** / **`elearning`** route).
- [x] Regression check passes: `python3 -m unittest tests.test_missing_apps_parity_phase408`.

## Working menu + apps home launcher (1.199)

- [x] `main.js` home route renders app launcher tiles from app-root menus (`getAppRoots`) instead of dashboard-only output (**evidence:** **`renderHome`** **`o-app-grid`** — **623–626**).
- [x] `main.js` keeps dashboard available on home below app launcher (no regression to KPI/activity widgets) (**evidence:** KPI strip + **`o-home-dashboard-wrap`** + **`DashboardCore.render`** after grid — **623–626**).
- [x] `main.js` routing maps include: `taxes`, `payment_terms`, `pricelists`, `bank_statements`, `reordering_rules`, `analytic_accounts`, `analytic_plans` (**evidence:** **`DATA_ROUTES_SLUGS`** + **`getModelForRoute`** — **627** audit).
- [x] Sidebar app context remains route-driven (`getAppIdForRoute`) and current app label appears in navbar (**evidence:** **`main.js`** **`getAppIdForRoute`**, **`selectApp`**, **`renderNavbar`** — **634** review; incremental UX hardening deferred).
- [x] Menu XML hierarchy for **stock** / **account** app roots reviewed for fragmentation (**evidence:** **`tests/test_missing_apps_parity_phase408`** + manual **`stock_views.xml`** / **`account_views.xml`** menu trees — **634**; follow-up only if product reports broken tiles).

## Frontend/Backend roadmap scaffold (1.198)

- [x] `web.assets_web` includes new service layer files: `hotkey.js`, `command_palette.js`, `debug_menu.js`, `pwa.js` (**evidence:** **`addons/web/__manifest__.py`** — **627** audit).
- [ ] `main.js` initializes command palette hotkey and PWA registration without breaking existing routes (**partial:** **`Services.pwa.register`** in **`main.js`**; command palette may be service-driven — still track full hotkey wiring).
- [x] New component contracts are loaded: `form_field`, `statusbar`, `one2many`, `many2many_tags`, `breadcrumbs`, `confirm_dialog`, `select_create_dialog`, `search_panel` (**evidence:** **`__manifest__.py`** lists these before **`main.js`** — **627** audit).
- [x] ORM registry hooks are called (`_register_hook`, `_unregister_hook`) when env is attached/cleared (**evidence:** **`core/orm/registry.py`** `_call_register_hooks` / `_call_unregister_hooks` on `set_env` — **Phase 1.245 F1**).
- [x] `_log_access` writes `create_uid/create_date/write_uid/write_date` on create/write where available (**evidence:** **`core/orm/models.py`** `create` ~L1607-1614, `write` ~L1062-1070 — **Phase 1.245 F1**).
- [x] Schema manager creates audit columns for `_log_access` models and supports SQL views via `_table_query` (**evidence:** **`core/db/schema.py`** `create_table` audit_columns block ~L99-109; **`ModelBase._get_table_query`** — **Phase 1.245 F1**).
- [x] `search` / `search_count` / `_read_group` combine caller domains with `ir.rule` via `_combine_domain_with_record_rules` (nested `&`), not list concatenation (which breaks top-level `|`) (**evidence:** **`core/orm/models.py`** L11-29 — **Phase 1.245 F1**).
- [x] Tooling helpers are available from `core.tools`: `safe_eval`, `date_utils`, `float_utils`, `image`, `misc`, `mail` + `json_log`, `sql_debug`, `translate` (**evidence:** **`core/tools/__init__.py`** expanded `__all__` — **Phase 1.245 F1**).

## Web client / dashboard (1.178)

- [x] Home dashboard loads via `AppCore.Dashboard.render` + `design-system/specs/dashboard-home.md` tokens; home shell (header, app grid, KPI strip) remains structured in **`main.js`** (**evidence:** **`renderHome`** + **`dashboard.js`** **`AppCore.Dashboard.render`** — **623–626**).
- [x] `web.assets_web` includes `kpi_card`, `activity_feed`, `shortcuts_bar`, `recent_items`, `core/dashboard.js` before `main.js` (**evidence:** **`__manifest__.py`** — **627** audit).

## Deployment

- [x] `ai_assistant` in `DEFAULT_SERVER_WIDE_MODULES` (core/tools/config.py) (**evidence:** `DEFAULT_SERVER_WIDE_MODULES` list includes `ai_assistant` — **Phase 1.245 F2**).
- [x] `./erp-bin db init -d <db>` creates `ai_audit_log`, `ai_tool_definition`, `ai_prompt_template` tables (**evidence:** models registered in `addons/ai_assistant/models/__init__.py`; ORM schema auto-creates tables — **Phase 1.245 F2**).
- [ ] Routes: `GET /ai/tools`, `POST /ai/chat`, `GET /ai/config`, `POST /ai/nl_search`, `POST /ai/extract_fields` registered (core/http/application.py)
- [ ] Runtime sanity after deploy: no 500s from `/web/dataset/call_kw` while dashboard/AI panel are open
- [ ] Runtime sanity after deploy: `/ai/chat` and bus polling remain healthy after browser hard refresh

## Security

- [x] `/ai/tools` returns 401 when not authenticated (**evidence:** `ai_controller.py` `ai_tools` returns 401 JSON when `get_session_uid(request) is None` — **Phase 1.245 F2**).
- [x] `/ai/chat` requires session; tools execute under user context (no sudo) (**evidence:** `ai_controller.py` `ai_chat` returns 401 when `uid is None` — **Phase 1.245 F2**).
- [x] `ai.audit.log` records prompt_hash, tool_calls, user_id, outcome per invocation (**evidence:** `addons/ai_assistant/models/ai_audit_log.py` fields: `prompt_hash`, `tool_calls`, `user_id`, `outcome` — **Phase 1.245 F2**).

## Tool Registry

- [x] `addons/ai_assistant/tools/registry.py`: get_tools(), execute_tool(), log_audit()
- [x] Tools use ORM (search_read, read) under env with user uid
- [x] Available tools: search_records, summarise_recordset, nl_search (extend as needed)

## RAG Retrieval

- [x] ai.document.chunk model indexed (manual or on-write)
- [x] GET /ai/retrieve?q=query&limit=10 returns chunks (record rules applied)
- [x] /ai/chat with retrieve=true passes retrieved_doc_ids to audit

## Phase 136 (Vector embeddings)

- [ ] pgvector extension; ai.document.chunk.embedding (vector 1536)
- [x] index_record_for_rag: embeds via OpenAI text-embedding-3-small on write
- [x] Chunk rows: `_inherit` refreshes embedding when `text` changes (Phase 528)
- [x] **Phase 791:** Long-field RAG text normalized before embed (`addons/ai_assistant/tools/rag_text.py`); test `tests.test_ai_rag_normalize_phase791`
- [x] retrieve_chunks: cosine similarity when embeddings exist; ilike fallback

## LLM Integration (Phase 88)

- [x] addons/ai_assistant/llm.py: call_llm() with OpenAI function-calling; tool_calls loop
- [x] ir.config_parameter: ai.openai_api_key, ai.llm_enabled, ai.llm_model
- [x] When ai.llm_enabled=1: /ai/chat accepts prompt without tool; uses call_llm with RAG context
- [x] Settings > AI Configuration: API key input, enable toggle, model selector
- [x] Chat panel: fetch /ai/config; prompt-only mode when LLM enabled; loading indicator

## Phase 122 (AI Natural Language Search)

- [x] nl_search(model, query) in registry: LLM converts NL to domain when enabled; fallback ilike on name/email/description
- [x] POST /ai/nl_search returns {domain, results}; used by AI Search button in list views

## Phase 123 (AI-Assisted Data Entry)

- [x] extract_fields(model, text) in registry: LLM extracts structured fields when enabled; fallback regex for email/phone
- [x] POST /ai/extract_fields returns {fields}; used by AI Fill button on lead/partner forms

## Phase 124 (AI Conversation Memory)

- [x] ai.conversation model: user_id, messages (JSON), model_context, active_id
- [x] /ai/chat: conversation_id, model_context, active_id; loads prior messages; injects view context into system prompt
- [x] Chat panel: maintains conversation_id; "New" button; window.chatContext from main.js

## Adding New Tools

1. Add tool function in `registry.py` (signature: `env, **kwargs`)
2. Register in `get_tools()` return list
3. Add handler in `execute_tool()` switch
4. Update access rights if new models used
5. Add audit logging for state-changing tools

## Phase 284-286 Module Rollout

- [x] `project_sms` loaded in `DEFAULT_SERVER_WIDE_MODULES` (**evidence:** `core/tools/config.py` — **Phase 1.245 F4**).
- [x] `project_todo`, `project_stock`, `project_purchase`, `project_hr_expense`, `project_sale_expense`, `project_timesheet_holidays` loaded in `DEFAULT_SERVER_WIDE_MODULES` (**evidence:** `core/tools/config.py` — **Phase 1.245 F4**).
- [ ] Run targeted regression: `python3.11 -m unittest tests.test_phase284_286 -v`

## Phase 287-288 Module Rollout

- [x] `hr_gamification`, `hr_fleet`, `hr_maintenance`, `hr_calendar`, `hr_homeworking`, `hr_recruitment_skills` loaded in `DEFAULT_SERVER_WIDE_MODULES` (**evidence:** `core/tools/config.py` — **Phase 1.245 F4**).
- [ ] Validate HR links: employee badges, vehicles, equipment, meetings, work location, applicant skills
- [ ] Run targeted regression: `python3.11 -m unittest tests.test_phase287_288 -v`

## Phases 289-295 (Cluster E) Module Rollout

- [x] Event/website bridges: `event_product`, `event_sms`, `event_crm`, `event_sale`, `website_crm`, `website_payment` in `DEFAULT_SERVER_WIDE_MODULES` (**evidence:** `core/tools/config.py` — **Phase 1.245 F4**).
- [x] Composite bridges: `account_fleet`, `stock_sms`, `stock_delivery`, `sale_expense_margin`, `sale_loyalty_delivery`, `purchase_requisition_stock`, `purchase_requisition_sale`, `product_margin`, `product_expiry`, `auth_password_policy`, `social_media`, `base_address_extended`, `base_geolocalize` (**evidence:** `core/tools/config.py` — **Phase 1.245 F4**).
- [ ] Run targeted regression: `python3.11 -m unittest tests.test_phase289_290 tests.test_phase291_295 -v`

## Phases 296-307 Module Rollout

- [x] **296–301** in `DEFAULT_SERVER_WIDE_MODULES`: `mrp_landed_costs`, `mrp_product_expiry`, `mrp_repair`, `mrp_subcontracting_account`, `mrp_subcontracting_purchase`, `mrp_subcontracting_repair`, `mrp_subcontracting_landed_costs`, `project_mrp`, `project_hr_skills`, `project_stock_account`, `project_purchase_stock`, `project_stock_landed_costs`, `project_mrp_account`, `project_mrp_sale`, `sale_project_stock_account`, `hr_work_entry_holidays`, `hr_holidays_attendance`, `hr_holidays_homeworking`, `hr_homeworking_calendar`, `hr_timesheet_attendance`, `hr_presence`, `hr_hourly_cost`, `hr_recruitment_sms` (**evidence:** `core/tools/config.py` — **Phase 1.245 F4**).
- [x] **302–307** in `DEFAULT_SERVER_WIDE_MODULES`: `sale_purchase_project`, `sale_project_stock`, `sale_mrp_margin`, `sale_stock_product_expiry`, `calendar_sms`, `resource_mail`, `survey_crm`, `event_crm_sale`, `mail_bot`, `auth_password_policy_portal`, `auth_password_policy_signup`, `auth_totp_mail`, `auth_totp_portal`, `stock_maintenance`, `stock_picking_batch`, `purchase_repair`, `stock_dropshipping`, `web_hierarchy`, `website_mail`, `website_sms`, `website_links`, `website_project`, `website_timesheet`, `hr_skills_event`, `hr_skills_survey`, `mail_bot_hr`, `hr_org_chart` (**evidence:** `core/tools/config.py` — **Phase 1.245 F4**).
- [x] Run: `python3.11 -m unittest tests.test_phase296_307 -v`
- [ ] After deploy: verify new relation tables and `stock.picking.batch` model load without import errors (requires live DB)
- [x] Compatibility fields aligned to regression contract (`sale_purchase_project_auto_count`, `sms_reminder_ids`, `portal_password_policy_level`, `maintenance_request_id`, `web_hierarchy_parent_field`)

## Phases 308-319 Module Rollout

- [x] **308-311** in `DEFAULT_SERVER_WIDE_MODULES`: `barcodes`, `barcodes_gs1_nomenclature`, `base_iban`, `base_vat`, `board`, `http_routing`, `html_editor`, `html_builder`, `product_matrix`, `product_email_template`, `sale_product_matrix`, `purchase_product_matrix`, `sale_pdf_quote_builder`, `delivery_stock_picking_batch`, `stock_fleet`, `mrp_subcontracting_dropshipping` (**evidence:** `core/tools/config.py` — **Phase 1.245 F4**).
- [x] **312-315** in `DEFAULT_SERVER_WIDE_MODULES`: `auth_ldap`, `auth_passkey`, `auth_passkey_portal`, `auth_timeout`, `mail_group`, `mail_plugin`, `snailmail`, `snailmail_account`, `event_booth`, `event_booth_sale`, `website_event`, `website_event_sale`, `website_event_crm`, `website_event_booth`, `website_event_booth_sale`, `project_mrp_stock_landed_costs` (**evidence:** `core/tools/config.py` — **Phase 1.245 F4**).
- [x] **316-319** in `DEFAULT_SERVER_WIDE_MODULES`: `website_sale_stock`, `website_sale_wishlist`, `website_sale_comparison`, `website_sale_comparison_wishlist`, `website_customer`, `website_partner`, `website_profile`, `website_hr_recruitment`, `iap_crm`, `crm_iap_enrich`, `crm_mail_plugin`, `marketing_card`, `sms_twilio`, `web_unsplash`, `base_sparse_field`, `base_import_module`, `base_install_request`, `partnership` (**evidence:** `core/tools/config.py` — **Phase 1.245 F4**).
- [x] Run: `python3.11 -m unittest tests.test_phase308_319 -v`

## Phases 320-329 Module Rollout

- [x] **320-322** in `DEFAULT_SERVER_WIDE_MODULES`: `account_edi`, `account_edi_proxy_client`, `account_edi_ubl_cii`, `account_add_gln`, `account_peppol`, `account_peppol_advanced_fields`, `account_qr_code_emv`, `account_qr_code_sepa`, `account_tax_python`, `account_update_tax_tags`, `sale_edi_ubl`, `purchase_edi_ubl_bis3` (**evidence:** `core/tools/config.py` — **Phase 1.245 F4**).
- [x] **323-326** in `DEFAULT_SERVER_WIDE_MODULES`: `website_event_track`, `website_event_track_quiz`, `website_event_track_live`, `website_event_track_live_quiz`, `website_event_exhibitor`, `website_event_booth_exhibitor`, `website_event_booth_sale_exhibitor`, `website_sale_loyalty`, `website_sale_mrp`, `website_sale_autocomplete`, `website_sale_stock_wishlist`, `website_sale_collect`, `website_sale_collect_wishlist`, `website_crm_sms`, `website_cf_turnstile` (**evidence:** `core/tools/config.py` — **Phase 1.245 F4**).
- [x] **327-329** in `DEFAULT_SERVER_WIDE_MODULES`: `website_crm_iap_reveal`, `website_crm_partner_assign`, `website_mail_group`, `crm_iap_mine`, `delivery_mondialrelay`, `website_sale_mondialrelay`, `sale_gelato`, `sale_gelato_stock`, `website_sale_gelato`, `hr_recruitment_survey`, `project_mail_plugin`, `attachment_indexation`, `certificate` (**evidence:** `core/tools/config.py` — **Phase 1.245 F4**).
- [x] Run: `python3.11 -m unittest tests.test_phase320_329 -v`

## Phases 330-341 Module Rollout

- [x] **330-333** in `DEFAULT_SERVER_WIDE_MODULES`: `mass_mailing`, `mass_mailing_crm`, `mass_mailing_event`, `mass_mailing_sale`, `mass_mailing_sms`, `mass_mailing_themes`, `im_livechat`, `crm_livechat`, `hr_livechat`, `website_livechat` (**evidence:** `core/tools/config.py` — **Phase 1.245 F4**).
- [x] **334-336** in `DEFAULT_SERVER_WIDE_MODULES`: `website_blog`, `website_forum`, `website_slides`, `hr_skills_slides` (**evidence:** `core/tools/config.py` — **Phase 1.245 F4**).
- [x] **337-341** in `DEFAULT_SERVER_WIDE_MODULES`: `pos_discount`, `pos_loyalty`, `pos_sale`, `pos_sale_loyalty`, `pos_sale_margin`, `pos_hr`, `pos_restaurant`, `pos_hr_restaurant`, `pos_restaurant_loyalty`, `pos_mrp`, `pos_event`, `pos_event_sale`, `pos_sms`, `pos_self_order`, `pos_online_payment`, `pos_account_tax_python` (**evidence:** `core/tools/config.py` — **Phase 1.245 F4**).
- [x] Run: `python3.11 -m unittest tests.test_phase330_341 -v`

## Phases 342-353 Module Rollout

- [x] **342-343** in `DEFAULT_SERVER_WIDE_MODULES`: `payment_stripe`, `payment_paypal`, `payment_adyen`, `payment_authorize`, `payment_mollie`, `payment_razorpay`, `payment_custom`, `payment_demo` (**evidence:** `core/tools/config.py` — **Phase 1.245 F4**).
- [x] **344-346** in `DEFAULT_SERVER_WIDE_MODULES`: `pos_adyen`, `pos_stripe`, `pos_restaurant_adyen`, `google_calendar`, `google_drive`, `microsoft_calendar`, `microsoft_outlook` (**evidence:** `core/tools/config.py` — **Phase 1.245 F4**).
- [x] **347-349** in `DEFAULT_SERVER_WIDE_MODULES`: `spreadsheet`, `spreadsheet_dashboard`, `spreadsheet_account`, `spreadsheet_dashboard_account`, `spreadsheet_crm`, `spreadsheet_dashboard_crm`, `cloud_storage`, `iot` (**evidence:** `core/tools/config.py` — **Phase 1.245 F4**).
- [x] **350-353** in `DEFAULT_SERVER_WIDE_MODULES`: `l10n_generic_coa`, `l10n_us`, `l10n_uk`, `l10n_de`, `l10n_fr` (**evidence:** `core/tools/config.py` — **Phase 1.245 F4**).
- [x] Run: `python3.11 -m unittest tests.test_phase342_353 -v`

## Phases 354-365 Rollout

- [x] **354-356** in `DEFAULT_SERVER_WIDE_MODULES`: `l10n_es`, `l10n_it`, `l10n_nl`, `l10n_be`, `l10n_ch`, `l10n_at`, `l10n_in`, `l10n_br`, `l10n_mx`, `l10n_au`, `l10n_ca`, `l10n_pl`, `l10n_se`, `l10n_no`, `l10n_dk` (**evidence:** `core/tools/config.py` — **Phase 1.245 F4**).
- [x] **357-359** in `DEFAULT_SERVER_WIDE_MODULES`: `theme_default`, `theme_starter_1`, `theme_starter_2`, `theme_starter_3`, `theme_starter_4` (**evidence:** `core/tools/config.py` — **Phase 1.245 F4**).
- [ ] **360-365** frontend artifacts present: design system docs, components, layout, renderers, widgets, UI/UX agent rules
- [ ] UI UX Pro Max workflow documented in `docs/QUICK_START_AGENTS.md`
- [x] Run: `python3.11 -m unittest tests.test_phase354_365 -v`

## Phases 366-377 Rollout

- [x] **366-368** widgets implemented in `addons/web/static/src/widgets`: `many2one_widget`, `many2many_widget`, `date_widget`, `monetary_widget`, `binary_widget`, `html_widget` (**evidence:** all 6 files present — **Phase 1.245 F4**).
- [x] **369-370** components implemented in `addons/web/static/src/components`: `button`, `card`, `badge`, `avatar`, `modal`, `toast` (**evidence:** all 6 files present — **Phase 1.245 F4**).
- [ ] **371-373** layout/renderers implemented in `addons/web/static/src/layout` and `addons/web/static/src/views`: `navbar`, `sidebar`, `action_layout`, `calendar_renderer`, `gantt_renderer`
- [x] **374-377** in `DEFAULT_SERVER_WIDE_MODULES`: `l10n_ar`, `l10n_cl`, `l10n_co`, `l10n_pe`, `l10n_ec`, `l10n_ae`, `l10n_sa`, `l10n_eg`, `l10n_za`, `l10n_ke`, `l10n_cn`, `l10n_kr`, `l10n_tw`, `l10n_sg_full`, `l10n_th`, `l10n_cz`, `l10n_hu`, `l10n_ro`, `l10n_bg`, `l10n_pt` (**evidence:** `core/tools/config.py` — **Phase 1.245 F4**).
- [x] Run: `python3.11 -m unittest tests.test_phase366_377 -v`

## Phases 378-389 Rollout

- [x] **378-381** extracted frontend core modules in `addons/web/static/src/core`: `router`, `view_manager`, `dashboard`, `settings`, `chatter`, `field_utils` (**evidence:** all 6 files present — **Phase 1.245 F4**).
- [ ] **382-385** backend stub methods enriched in `hr_presence`, `hr_holidays_homeworking`, `hr_work_entry_holidays`, `mail_template`, `res_lang`, `ir_model`, `mrp_product_expiry`, `base_geolocalize`
- [x] **386-389** in `DEFAULT_SERVER_WIDE_MODULES`: `l10n_bo`, `l10n_cr`, `l10n_uy`, `l10n_ve`, `l10n_ph`, `l10n_id`, `l10n_vn`, `l10n_pk`, `l10n_ng`, `l10n_ma`, `l10n_il`, `l10n_hr`, `l10n_rs`, `l10n_si`, `l10n_lu`, `l10n_lt`, `l10n_lv`, `l10n_ua`, `l10n_fi`, `l10n_gr` (**evidence:** `core/tools/config.py` — **Phase 1.245 F4**).
- [x] Run: `python3.11 -m unittest tests.test_phase378_389 -v`
