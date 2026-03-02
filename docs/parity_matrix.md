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
| Module loader + registry | `odoo/modules/*` | `core/modules/` | done | test_modules.py |
| Base module (users, groups, meta) | `odoo/addons/base/` | `addons/base/` | done | - |
| Web client (assets, services, views) | `addons/web/` | `addons/web/` | in_progress | - |
| Business modules (CRM, etc.) | `addons/*` | `addons/<module>/` | deferred | - |
| Test harness (Python + JS) | `odoo/tests/`, `addons/*/tests` | `tests/`, `tests/e2e/`, `addons/web/static/tests/` | in_progress | run_tests.py, pytest e2e, test_runner.html |
| Upgrade scripts | `odoo/upgrade_code/`, `*/upgrades` | `core/upgrade/` | done | - |

## Behavioural Parity

| Invariant | Odoo Reference | Our Implementation | Status |
|-----------|----------------|--------------------|--------|
| Module lifecycle (install/upgrade order) | `odoo/modules/loading.py` | `core/modules/` | done |
| Access rights (ir.model.access) | `base/security/ir.model.access.csv` | `addons/base/security/` | done |
| Record rules (default-allow) | `odoo/service/security.py` | `core/orm/security.py` | done |
| Prefetch/cache heuristics | `odoo/orm/` | `core/orm/` | in_progress |
| jsonrpc dispatch | `odoo/http.py` | `core/http/rpc.py` | done |
| Asset bundling (include/remove/after) | `addons/web/__manifest__.py` | `core/modules/assets.py` | done |

## Interface Parity

| API Surface | Odoo Contract | Our Implementation | Status |
|-------------|---------------|--------------------|--------|
| Internal RPC (web client) | Session-aware, record-rule protected | `core/http/rpc.py`, `/web/dataset/call_kw` | done |
| External JSON-2 | Token/key-based, multi-db headers | `core/http/json2.py` | deferred |
| Extension controllers | `@route`, auth modes | `core/http/controller.py` | done |
