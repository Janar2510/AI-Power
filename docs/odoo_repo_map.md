# Odoo 19.0 Repository Map

This document maps the Odoo 19.0 upstream repository structure to our parity platform implementation. It serves as a reference for structural and behavioural parity.

## Tree Summary

### Root Level

| Path | Purpose |
|------|---------|
| `odoo-bin` | CLI entrypoint; calls `odoo.cli.main()` |
| `odoo/` | Core platform (Python packages) |
| `addons/` | Business and framework modules |
| `setup.py`, `requirements.txt` | Package metadata and dependencies |
| `COPYRIGHT`, `LICENSE` | LGPL-3 licensing |

### odoo/ (Core)

| Path | Responsibility |
|------|----------------|
| `odoo/__init__.py` | Exposes shortcuts (SUPERUSER_ID, _, Command) |
| `odoo/init.py` | Early boot: version gates, GC thresholds, monkeypatches |
| `odoo/release.py` | version_info, MIN_PY_VERSION, MIN_PG_VERSION, product_name |
| `odoo/http.py` | WSGI app, Request, Controller, route, dispatcher, static serving |
| `odoo/exceptions.py` | Platform exceptions |
| `odoo/sql_db.py` | Database connection management |
| `odoo/netsvc.py` | Legacy service layer |
| `odoo/cli/` | Built-in CLI commands |
| `odoo/tools/` | Config, i18n, XML, SQL, safe_eval, etc. |
| `odoo/modules/` | Module loader, registry, migration, db |
| `odoo/orm/` | Models, fields, environments, registry |
| `odoo/service/` | Server, model, security, db services |
| `odoo/upgrade_code/` | Version-specific upgrade scripts |
| `odoo/addons/base/` | Base module (required) |
| `odoo/addons/test_*` | Test modules |
| `odoo/tests/` | Test framework, case, loader, suite |

### odoo/cli/ (Commands)

| Command | File | Purpose |
|---------|------|---------|
| server | `cli/server.py` | Start HTTP server |
| shell | `cli/shell.py` | Interactive Python shell with env |
| scaffold | `cli/scaffold.py` | Generate module from template |
| upgrade_code | `cli/upgrade_code.py` | Run upgrade scripts |
| module | `cli/module.py` | Install/upgrade/uninstall modules |
| db | `cli/db.py` | Database management |
| deploy | `cli/deploy.py` | Deployment helpers |
| i18n | `cli/i18n.py` | Translation export/import |
| help | `cli/help.py` | Help command |
| populate | `cli/populate.py` | Demo data population |
| cloc | `cli/cloc.py` | Lines of code |
| neutralize | `cli/neutralize.py` | Neutralize DB for demo |
| obfuscate | `cli/obfuscate.py` | Obfuscate data |
| start | `cli/start.py` | Start server (alias) |

### odoo/cli/templates/

| Template | Purpose |
|----------|---------|
| `default/` | Standard module: models, controllers, views, demo, security |
| `theme/` | Website theme module |
| `l10n_payroll/` | Localization payroll module |

### addons/ (Top-Level)

| Module | Purpose |
|--------|---------|
| `web` | Web client kernel: assets, services, views, session |
| `base` | In `odoo/addons/base` — required server-wide |
| `rpc` | RPC module (default server-wide) |
| `auth_*`, `mail`, `website`, etc. | Business and integration modules |

### Key Entrypoints

1. **odoo-bin** → `odoo.cli.main()` → parses args, finds command, runs it
2. **odoo.init** → version check, GC tuning, `_monkeypatches.patch_init()`
3. **odoo.http.Application** → WSGI callable; routes to `_serve_static`, `_serve_nodb`, or `_serve_db`
4. **odoo.modules.registry.Registry** → Per-database model registry
5. **odoo.service.server.Server** → Multi-worker server (when `--workers` > 0)

### Server-Wide Modules

- **Required**: `base`, `web`
- **Default server-wide**: `base`, `rpc`, `web` (from `odoo/tools/config.py`)

### Module Discovery

- `--addons-path` defines comma-separated directories
- Modules are Python packages with `__manifest__.py`
- Addon commands: `*/cli/<command>.py` loaded dynamically

## Parity Targets

- Mirror high-level layout: `erp-bin`, `core/`, `addons/`
- Implement equivalent CLI command dispatch
- Match config flags: addons-path, http-port, gevent-port, proxy-mode, db-filter, test-enable

## Non-Goals

- Exact file-by-file mirroring
- All Odoo addons (hundreds); focus on base + web + minimal demo

## Next Phases (Odoo Clone Roadmap)

See [next-phase-plan.md](next-phase-plan.md) for Phases 25–32:

- **Phase 25:** ORM fields (Selection, One2many, Many2many)
- **Phase 26:** ir.sequence, ir.attachment, ir.model stub
- **Phase 27:** res.company, res.groups
- **Phase 28:** View switcher (list/kanban/form)
- **Phase 29:** CLI shell, module install
- **Phase 30:** ir.config_parameter
- **Phase 31:** Transient models (wizards)
- **Phase 32:** res.country, res.currency, res.lang
