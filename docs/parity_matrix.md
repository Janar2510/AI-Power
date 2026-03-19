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
