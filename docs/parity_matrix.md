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
