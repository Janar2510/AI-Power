# Parity Matrix

Tracks Odoo 19.0 feature parity with our implementation. Status: `planned` | `in_progress` | `done` | `deferred`.

## Repo Path to Implementation

| Odoo Feature | Odoo Reference Path(s) | Our Implementation | Status | Tests |
|--------------|------------------------|--------------------|--------|-------|
| CLI entrypoint | `odoo-bin`, `odoo/cli/main` | `erp-bin`, `core/cli/command.py` | done | - |
| Config (addons-path, ports, flags) | `odoo/tools/config.py` | `core/tools/config.py` | done | test_config.py |
| Init sequence (version gates, GC) | `odoo/init.py` | `core/__init__.py`, `core/release.py` | done | - |
| HTTP + jsonrpc dispatcher | `odoo/http.py` | `core/http/` | done | test_http.py |
| ORM (models, fields, registry) | `odoo/orm/*` | `core/orm/` | done | test_orm.py |
| Computed fields (store/non-store, depends) | `odoo/orm/fields.py` | `core/orm/fields.py` Computed | done | test_computed_fields.py |
| Model inheritance (_inherit, _inherits) | `odoo/models.py` | `core/orm/registry.py` merge_model | done | test_model_inheritance.py |
| Module loader + registry | `odoo/modules/*` | `core/modules/` | done | test_modules.py |
| Base module (users, groups, meta) | `odoo/addons/base/` | `addons/base/` | done | - |
| Web client (assets, services, views) | `addons/web/` | `addons/web/` | done | test_http, test_assets |
| Business modules (CRM, etc.) | `addons/*` | `addons/crm/` | done | test_views_registry |
| Test harness (Python + JS) | `odoo/tests/`, `addons/*/tests` | `tests/`, `tests/e2e/`, `addons/web/static/tests/` | done | run_tests.py, pytest e2e, test_runner.html |
| Upgrade scripts | `odoo/upgrade_code/`, `*/upgrades` | `core/upgrade/` | done | - |

## Behavioural Parity

| Invariant | Odoo Reference | Our Implementation | Status |
|-----------|----------------|--------------------|--------|
| Module lifecycle (install/upgrade order) | `odoo/modules/loading.py` | `core/modules/` | done |
| Access rights (ir.model.access) | `base/security/ir.model.access.csv` | `addons/base/security/` | done |
| Record rules (default-allow) | `odoo/service/security.py` | `core/orm/security.py` | done |
| Prefetch/cache heuristics | `odoo/orm/` | `core/orm/` _prefetch_many2one_display | done |
| jsonrpc dispatch | `odoo/http.py` | `core/http/rpc.py` | done |
| Asset bundling (include/remove/after) | `addons/web/__manifest__.py` | `core/modules/assets.py` | done |

## Interface Parity

| API Surface | Odoo Contract | Our Implementation | Status |
|-------------|---------------|--------------------|--------|
| Internal RPC (web client) | Session-aware, record-rule protected | `core/http/rpc.py`, `/web/dataset/call_kw` | done |
| External JSON-2 | Token/key-based, multi-db headers | `core/http/json2.py` | done |
| Extension controllers | `@route`, auth modes | `core/http/controller.py` | done |
| Report actions (ir.actions.report) | Metadata-driven, Jinja2 | `core/http/report.py`, `addons/base/models/ir_actions.py` | done |
| Search view (filters, group_by) | `<search>` in view XML | `core/data/xml_loader.py`, `views_registry.py`, main.js filter chips | done |
| Action domain/context | ir.actions.act_window | load_views returns domain/context; loadRecords applies | done |
| Binary field + file upload | `ir.attachment` datas, `/web/binary/upload` | `core/orm/fields.py` Binary, `core/http/routes.py` | done |
| TransientModel (wizards) | `odoo/models.py` TransientModel | `core/orm/models_transient.py` | done |
| LLM tool parity | OpenAI function-calling schemas | `addons/ai_assistant/llm.py` _TOOL_SCHEMAS sync with TOOL_REGISTRY | done |
| ORM sudo/context | `recordset.sudo()`, `with_context()`, `with_user()`, `_order` | `core/orm/environment.py`, `core/orm/models.py`, `core/orm/security.py` | done |
| base.automation | `base.automation` (on_create, on_write, on_unlink, on_time) | `addons/base/models/base_automation.py`, `core/orm/automation.py` | done |
| Point of Sale | `pos.config`, `pos.session`, `pos.order` | `addons/pos/` | done |
| Barcode scanning | `stock_barcode`, product barcode | `addons/stock_barcode/` | done |
| Quality control | `quality.point`, `quality.check`, `quality.alert` | `addons/quality/` | done |
| AI anomaly detection | `ai.anomaly`, detect_anomalies, explain_anomaly | `addons/ai_assistant/` | done |
| Maintenance | `maintenance.equipment`, `maintenance.request` | `addons/maintenance/` | done |
| Event management | `event.event`, `event.registration` | `addons/event/` | done |
| ORM recordset ops | `mapped`, `filtered`, `grouped`, `concat`, `union`, `name_create` | `core/orm/models.py` Phase 234 | done |
| API decorators | `@api.onchange`, `@api.ondelete`, `@api.autovacuum` | `core/orm/decorators.py`, `base.autovacuum` Phase 235 | done |
| Field types | `Reference`, `Json`, `Properties`, `Many2oneReference` | `core/orm/fields.py` Phase 236 | done |
| Standalone product module | `addons/product/` | `addons/product/` Phase 247 | done |
| Analytic accounting | `addons/analytic/` | `addons/analytic/` Phase 248 | done |
| Onboarding toolbox | `addons/onboarding/` | `addons/onboarding/` Phase 249 | done |
| HR work entries | `addons/hr_work_entry/` | `addons/hr_work_entry/` Phase 250 | done |
| KPI Digest | `addons/digest/` | `addons/digest/` Phase 251 | done |
| base_automation standalone | `addons/base_automation/` | `addons/base_automation/` Phase 252 | done |
| MRP Subcontracting | `addons/mrp_subcontracting/` | `addons/mrp_subcontracting/` Phase 253 | done |
| Command class | `odoo/orm/commands.py` | `core/orm/commands.py` Phase 254 | done |
| Domain operators any!/not any! | `odoo/orm/domains.py` | `core/orm/domains.py` Phase 254 | done |
| search_fetch | `odoo/orm/models.py` | `core/orm/models.py` Phase 254 | done |
| base_setup | `addons/base_setup/` | `addons/base_setup/` Phase 255 | done |
| auth_signup | `addons/auth_signup/` | `addons/auth_signup/` Phase 256 | done |
| auth_oauth | `addons/auth_oauth/` | `addons/auth_oauth/` Phase 257 | done |
| IAP | `addons/iap/` | `addons/iap/` Phase 258 | done |
| portal_rating | `addons/portal_rating/` | `addons/portal_rating/` Phase 259 | done |
| lunch | `addons/lunch/` | `addons/lunch/` Phase 260 | done |
| data_recycle | `addons/data_recycle/` | `addons/data_recycle/` Phase 261 | done |
| utm | `addons/utm/` | `addons/utm/` Phase 262 | done |
| phone_validation | `addons/phone_validation/` | `addons/phone_validation/` Phase 262 | done |
| iap_mail | `addons/iap_mail/` | `addons/iap_mail/` Phase 262 | done |
| sales_team | `addons/sales_team/` | `addons/sales_team/` Phase 263 | done |
| link_tracker | `addons/link_tracker/` | `addons/link_tracker/` Phase 263 | done |
| partner_autocomplete | `addons/partner_autocomplete/` | `addons/partner_autocomplete/` Phase 263 | done |
| account_payment | `addons/account_payment/` | `addons/account_payment/` Phase 264 | done |
| account_check_printing | `addons/account_check_printing/` | `addons/account_check_printing/` Phase 264 | done |
| sale_management | `addons/sale_management/` | `addons/sale_management/` Phase 265 | done |
| project_account | `addons/project_account/` | `addons/project_account/` Phase 265 | done |
| sale_service | `addons/sale_service/` | `addons/sale_service/` Phase 265 | done |
| sale_project | `addons/sale_project/` | `addons/sale_project/` Phase 265 | done |
| sms | `addons/sms/` | `addons/sms/` Phase 266 | done |
| privacy_lookup | `addons/privacy_lookup/` | `addons/privacy_lookup/` Phase 266 | done |
| web_tour | `addons/web_tour/` | `addons/web_tour/` Phase 266 | done |
| _read_group / _read_grouping_sets | `odoo/orm/models.py` | `core/orm/models.py` Phase 267 | done |
| sale_crm | `addons/sale_crm/` | `addons/sale_crm/` Phase 268 | done |
| sale_purchase | `addons/sale_purchase/` | `addons/sale_purchase/` Phase 269 | done |
| sale_timesheet | `addons/sale_timesheet/` | `addons/sale_timesheet/` Phase 270 | done |
| sale_margin | `addons/sale_margin/` | `addons/sale_margin/` Phase 271 | done |
| sale_sms | `addons/sale_sms/` | `addons/sale_sms/` Phase 272 | done |
| sale_expense | `addons/sale_expense/` | `addons/sale_expense/` Phase 273 | done |
| account_debit_note | `addons/account_debit_note/` | `addons/account_debit_note/` Phase 274 | done |
| crm_sms | `addons/crm_sms/` | `addons/crm_sms/` Phase 275 | done |
| gamification | `addons/gamification/` | `addons/gamification/` Phase 276 | done |
| sale_loyalty | `addons/sale_loyalty/` | `addons/sale_loyalty/` Phase 277 | done |
| gamification_sale_crm | `addons/gamification_sale_crm/` | `addons/gamification_sale_crm/` Phase 278 | done |
| purchase_requisition | `addons/purchase_requisition/` | `addons/purchase_requisition/` Phase 279 | done |
| stock_landed_costs | `addons/stock_landed_costs/` | `addons/stock_landed_costs/` Phase 280 | done |
| sale_mrp | `addons/sale_mrp/` | `addons/sale_mrp/` Phase 281 | done |
| purchase_mrp | `addons/purchase_mrp/` | `addons/purchase_mrp/` Phase 282 | done |
| sale_purchase_stock | `addons/sale_purchase_stock/` | `addons/sale_purchase_stock/` Phase 283 | done |
| sale_stock_margin | `addons/sale_stock_margin/` | `addons/sale_stock_margin/` Phase 283 | done |
| sale_timesheet_margin | `addons/sale_timesheet_margin/` | `addons/sale_timesheet_margin/` Phase 283 | done |
| event_product / event_sms / event_crm | `addons/event_*` | `addons/event_product`, `event_sms`, `event_crm` Phase 289 | done | test_phase289_290 |
| event_sale / website_crm / website_payment | `addons/event_sale`, `website_crm`, `website_payment` | Phase 290 | done | test_phase289_290 |
| account_fleet / stock_sms / stock_delivery | `addons/account_fleet`, `stock_sms`, `stock_delivery` | Phase 291 | done | test_phase291_295 |
| sale_expense_margin / sale_loyalty_delivery | `addons/sale_expense_margin`, `sale_loyalty_delivery` | Phase 292 | done | test_phase291_295 |
| purchase_requisition_stock / purchase_requisition_sale | `addons/purchase_requisition_stock`, `purchase_requisition_sale` | Phase 293 | done | test_phase291_295 |
| product_margin / product_expiry | `addons/product_margin`, `product_expiry` | Phase 294 | done | test_phase291_295 |
| auth_password_policy / social_media / base_* | `addons/auth_password_policy`, `social_media`, `base_address_extended`, `base_geolocalize` | Phase 295 | done | test_phase291_295 |
| Phases 296–301 (MRP/project/HR bridges, plan fields) | `mrp_landed_costs`, `mrp_product_expiry`, `mrp_repair`, `mrp_subcontracting_*`, `project_*`, `sale_project_stock_account`, `hr_*` bridges | `addons/*` Phase 296–301 | done | test_phase296_307 |
| Phases 302–307 (sale/auth/stock/website/HR cluster) | `sale_purchase_project`, `sale_project_stock`, `sale_mrp_margin`, `sale_stock_product_expiry`, `calendar_sms`, `resource_mail`, `survey_crm`, `event_crm_sale`, `mail_bot`, `auth_password_policy_portal`, `auth_password_policy_signup`, `auth_totp_mail`, `auth_totp_portal`, `stock_maintenance`, `stock_picking_batch`, `purchase_repair`, `stock_dropshipping`, `web_hierarchy`, `website_mail`, `website_sms`, `website_links`, `website_project`, `website_timesheet`, `hr_skills_event`, `hr_skills_survey`, `mail_bot_hr`, `hr_org_chart` | `addons/*` Phase 302–307 (bridge naming aligned to regression contract) | done | test_phase296_307 |
| Phases 308–319 (infrastructure, commerce, auth/mail, event, CRM/misc) | `barcodes`, `barcodes_gs1_nomenclature`, `base_iban`, `base_vat`, `board`, `http_routing`, `html_editor`, `html_builder`, `product_matrix`, `product_email_template`, `sale_product_matrix`, `purchase_product_matrix`, `sale_pdf_quote_builder`, `delivery_stock_picking_batch`, `stock_fleet`, `mrp_subcontracting_dropshipping`, `auth_ldap`, `auth_passkey`, `auth_passkey_portal`, `auth_timeout`, `mail_group`, `mail_plugin`, `snailmail`, `snailmail_account`, `event_booth`, `event_booth_sale`, `website_event`, `website_event_sale`, `website_event_crm`, `website_event_booth`, `website_event_booth_sale`, `project_mrp_stock_landed_costs`, `website_sale_stock`, `website_sale_wishlist`, `website_sale_comparison`, `website_sale_comparison_wishlist`, `website_customer`, `website_partner`, `website_profile`, `website_hr_recruitment`, `iap_crm`, `crm_iap_enrich`, `crm_mail_plugin`, `marketing_card`, `sms_twilio`, `web_unsplash`, `base_sparse_field`, `base_import_module`, `base_install_request`, `partnership` | `addons/*` Phase 308–319 | done | test_phase308_319 |
| Phases 320–329 (final parity stretch) | `account_edi`, `account_edi_proxy_client`, `account_edi_ubl_cii`, `account_add_gln`, `account_peppol`, `account_peppol_advanced_fields`, `account_qr_code_emv`, `account_qr_code_sepa`, `account_tax_python`, `account_update_tax_tags`, `sale_edi_ubl`, `purchase_edi_ubl_bis3`, `website_event_track`, `website_event_track_quiz`, `website_event_track_live`, `website_event_track_live_quiz`, `website_event_exhibitor`, `website_event_booth_exhibitor`, `website_event_booth_sale_exhibitor`, `website_sale_loyalty`, `website_sale_mrp`, `website_sale_autocomplete`, `website_sale_stock_wishlist`, `website_sale_collect`, `website_sale_collect_wishlist`, `website_crm_sms`, `website_cf_turnstile`, `website_crm_iap_reveal`, `website_crm_partner_assign`, `website_mail_group`, `crm_iap_mine`, `delivery_mondialrelay`, `website_sale_mondialrelay`, `sale_gelato`, `sale_gelato_stock`, `website_sale_gelato`, `hr_recruitment_survey`, `project_mail_plugin`, `attachment_indexation`, `certificate` | `addons/*` Phase 320–329 | done | test_phase320_329 |
| Phases 330–341 (deferred wave 1) | `mass_mailing`, `mass_mailing_crm`, `mass_mailing_event`, `mass_mailing_sale`, `mass_mailing_sms`, `mass_mailing_themes`, `im_livechat`, `crm_livechat`, `hr_livechat`, `website_livechat`, `website_blog`, `website_forum`, `website_slides`, `hr_skills_slides`, `pos_discount`, `pos_loyalty`, `pos_sale`, `pos_sale_loyalty`, `pos_sale_margin`, `pos_hr`, `pos_restaurant`, `pos_hr_restaurant`, `pos_restaurant_loyalty`, `pos_mrp`, `pos_event`, `pos_event_sale`, `pos_sms`, `pos_self_order`, `pos_online_payment`, `pos_account_tax_python` | `addons/*` Phase 330–341 | done | test_phase330_341 |
| Phases 342–353 (deferred wave 2) | `payment_stripe`, `payment_paypal`, `payment_adyen`, `payment_authorize`, `payment_mollie`, `payment_razorpay`, `payment_custom`, `payment_demo`, `pos_adyen`, `pos_stripe`, `pos_restaurant_adyen`, `google_calendar`, `google_drive`, `microsoft_calendar`, `microsoft_outlook`, `spreadsheet`, `spreadsheet_dashboard`, `spreadsheet_account`, `spreadsheet_dashboard_account`, `spreadsheet_crm`, `spreadsheet_dashboard_crm`, `cloud_storage`, `iot`, `l10n_generic_coa`, `l10n_us`, `l10n_uk`, `l10n_de`, `l10n_fr` | `addons/*` Phase 342–353 | done | test_phase342_353 |
| Phases 354–365 (deferred wave 3 + UI/UX track) | `l10n_es`, `l10n_it`, `l10n_nl`, `l10n_be`, `l10n_ch`, `l10n_at`, `l10n_in`, `l10n_br`, `l10n_mx`, `l10n_au`, `l10n_ca`, `l10n_pl`, `l10n_se`, `l10n_no`, `l10n_dk`, `theme_default`, `theme_starter_1`, `theme_starter_2`, `theme_starter_3`, `theme_starter_4`; UI/UX artifacts under `addons/web/static/src/{components,layout,views,widgets}` + `design-system/MASTER.md` + agent rules | `addons/*`, `addons/web/static/src/*`, `.cursor/rules/agents/*` | done | test_phase354_365 |
| Phases 366–377 (frontend implementation + l10n wave 4) | Frontend implementations for widgets/components/layout/renderers under `addons/web/static/src/{widgets,components,layout,views}`; `l10n_ar`, `l10n_cl`, `l10n_co`, `l10n_pe`, `l10n_ec`, `l10n_ae`, `l10n_sa`, `l10n_eg`, `l10n_za`, `l10n_ke`, `l10n_cn`, `l10n_kr`, `l10n_tw`, `l10n_sg_full`, `l10n_th`, `l10n_cz`, `l10n_hu`, `l10n_ro`, `l10n_bg`, `l10n_pt` | `addons/web/static/src/*`, `addons/l10n_*` Phase 366–377 | done | test_phase366_377 |
| Phases 378–389 (modularization + backend enrichment + l10n wave 5) | Frontend extraction modules under `addons/web/static/src/core/*`; backend stub enrichment in HR/mail/base/MRP/geolocalize; `l10n_bo`, `l10n_cr`, `l10n_uy`, `l10n_ve`, `l10n_ph`, `l10n_id`, `l10n_vn`, `l10n_pk`, `l10n_ng`, `l10n_ma`, `l10n_il`, `l10n_hr`, `l10n_rs`, `l10n_si`, `l10n_lu`, `l10n_lt`, `l10n_lv`, `l10n_ua`, `l10n_fi`, `l10n_gr` | `addons/web/static/src/core/*`, `addons/*`, `addons/l10n_*` Phase 378–389 | done | test_phase378_389 |
| Phases 391–407 roadmap scaffold | Form/navbar/report/discuss/import AppCore delegation hooks; command palette/hotkey/debug/PWA services; ORM hooks + `_log_access`/`_table_query` plumbing; tools expansion; fetchmail model | `addons/web/static/src/{core,components,services}`, `core/orm/*`, `core/db/schema.py`, `core/tools/*`, `addons/mail/*`, `addons/bus/*` | done | - |
| Sidebar Odoo 19 parity | `ir.ui.menu` web_icon/web_icon_data/active, app_id, recursive menus, navbar.xml SectionMenu | `ir_ui_menu.py`, `views_registry.py`, `main.js`, `webclient.css`, `views.js` v1.181.0 | done | - |
| Missing apps parity (CRM/Discuss/HR app promotion) | Odoo 19 app roots + CRM hierarchy + Discuss app root + HR sub-apps as top-level apps | `addons/crm/views/crm_views.xml`, `addons/mail/views/mail_template_views.xml`, `addons/hr_*`, `addons/web/static/src/main.js`, `tests/test_missing_apps_parity_phase408.py` | done | test_missing_apps_parity_phase408 |
| Phases 409–410 (generic data + demo) | `ir.model.data`, `core/data/data_loader.py`, `noupdate`, `--demo`, manifest `demo` XML | `addons/base/models/ir_model_data.py`, `core/data/data_loader.py`, `core/db/init_data.py`, `core/cli/db.py` | done | - |
| Phase 411 (FormView API) | `window.__erpForm` + `AppCore.FormView` wrappers | `addons/web/static/src/core/form_view.js`, `main.js` | done | - |
| Phase 412 (Select/Create dialog) | Modal `name_search` + `name_create` | `select_create_dialog.js` | done | - |
| Phase 413 (Discuss UI) | RPC channel list + `message_post` | `core/discuss.js` | done | - |
| Phase 414 (Fetchmail) | IMAP in `addons/fetchmail` (existing) | `addons/fetchmail/models/fetchmail_server.py` | done | test_fetchmail_phase130 |
| Phases 415–416 (views + command palette) | `setImpl` bridges; fuzzy palette | `core/{graph,pivot,calendar,gantt,activity}_view.js`, `command_palette.js`, `main.js` | done | - |
| Phase 417 (Import pipeline helpers) | CSV parse + `import_data` batch | `core/import.js` | done | - |
| Phase 418 (i18n PO) | `translate.load_module_po_translations` + sample `.po` | `core/tools/translate.py`, `addons/base/i18n/en_US.po` | done | - |
| Phase 419 (ir.model reflection) | `sync_registry`, `ir.model.fields` model | `addons/base/models/ir_model.py`, `ir_model_fields.py` | done | - |
| Phase 420 (utilities) | `partner_autocomplete`, Nominatim geolocalize, Pillow `image_process`, kanban any model | `partner_autocomplete`, `base_geolocalize`, `core/tools/image.py`, `main.js` | done | - |
| Phase 421 (prefetch) | `Environment._prefetch_cache`, `prefetch_read`, read short-circuit | `core/orm/environment.py`, `core/orm/models.py` | done | - |
| Phase 422 (SQL debug) | `sql_debug.explain_analyze` | `core/tools/sql_debug.py` | done | - |
| Phase 525 (stock picking lifecycle — behavioural) | `stock.picking` assign/validate, quants on incoming/outgoing | `addons/stock/models/stock_picking.py`; `stock_account` extends `action_validate` for `valuation_state` | done | `tests.test_stock_picking_phase525` (DB optional) |
| Phase 526 (MRP BOM operations — behavioural) | `mrp.bom.operation`; one `mrp.workorder` per operation on MO confirm; `mrp_account.cost_estimate` heuristic | `addons/mrp/models/mrp_bom_operation.py`, `mrp_production.py`, `mrp_account/models/mrp_production.py` | done | `tests.test_mrp_bom_operations_phase526` (DB optional) |
| Phase 527 (web concat guard + JSON access log) | No ESM in `web.assets_web`; optional `ERP_JSON_ACCESS_LOG` / `--json-access-log` | `scripts/check_concat_bundle.py`, `core/http/application.py`, `core/tools/config.py` | done | CI `npm run check:assets-concat`; manual hit with access log flag |
| Phase 528 (RAG chunk embed on write) | `ai.document.chunk` refreshes `embedding` when `text` changes (API key optional) | `addons/ai_assistant/models/ai_document_chunk_embed.py`, `tools/registry.index_record_for_rag` | done | `tests.test_ai_chunk_embed_phase528` (DB optional) |
| Phase 529 (readiness / health docs) | `/health` liveness vs `/readiness` (503) documented for ops | `core/http/routes.py` | done | curl checks in DeploymentChecklist |
| Phase 530 (stock partial reservation) | `stock.move.quantity_reserved` + `partial` state; assign reserves up to available qty; validate ships reserved amount | `addons/stock/models/stock_move.py`, `stock_picking.py` | done | `tests.test_stock_partial_reserve_phase530` (DB optional) |
| Phase 531 (MRP cost draft move stub) | On MO done, idempotent draft `account.move` (`entry`, `invoice_origin=MFG:…`) when `cost_estimate` > 0 | `addons/mrp_account/models/mrp_production.py` | done | optional DB + `account`/`account.journal` |
| Phase 532 (RAG reindex + retrieval test) | Cron reindex includes `knowledge.article`; `retrieve_chunks` ilike test | `addons/ai_assistant/models/rag_reindex.py`, `tools/registry.py` | done | `tests.test_ai_retrieve_chunks_phase532` |
| Phase 533 (sale_stock picking count) | `picking_count` uses `stock.picking` `sale_id` OR `origin` (aligns with purchase_stock) | `addons/sale_stock/models/sale_order.py` | done | manual / integration |
| Phase 534 (dual-codebase planning rule) | Agents must analyze `odoo-19.0` + ERP before changes; Cursor rule | `docs/ai-rules.md`, `.cursor/rules/dual-codebase-analysis.mdc` | done | review |
| Phase 535 (account posting — behavioural) | `action_post` only from **draft**; balanced lines; every line has **account_id** (Odoo-style invariants) | `addons/account/models/account_move.py` | done | `tests.test_account_post_phase467`, `tests.test_account_post_phase535` |
| Phase 536 (account tax subset) | Single **percent** tax with **price_include**: `compute_all` treats subtotal as tax-included | `addons/account/models/account_tax.py` | done | `tests.test_account_tax_compute_phase536` |
| Phase 537 (bank reconcile journey) | `account.bank.statement.action_reconcile` opens wizard for unreconciled lines; wizard + `_auto_reconcile` covered | `account_bank_statement.py`, `account_reconcile*.py` | done | `tests.test_bank_statement_phase193`, `tests.test_reconcile_wizard_phase195`, `tests.test_bank_statement_action_reconcile_phase537` |
| Phase 538 (account reports) | Full Odoo `account` / `account_reports` stack **deferred**; ERP keeps SQL TB / P&amp;L / BS helpers only | `addons/account/models/account_report.py` | deferred | optional DB / product scope |
| Deferred product backlog | l10n, mass mailing, livechat, spreadsheets — behavioural TBD | `docs/deferred_product_backlog.md` | backlog | product priority only |
