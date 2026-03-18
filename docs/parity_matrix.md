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
