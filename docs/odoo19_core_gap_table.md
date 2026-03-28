# Odoo 19.0 core framework vs ERP `core/` gap table

**Reference:** Read-only `odoo-19.0/odoo/` vs `erp-platform/core/`. Clean-room implementation per [ai-rules.md](ai-rules.md).

**Planning format:** trigger / concern → Odoo path (read-only) → ERP path → test / verification.

## Layout mapping

| Area | Odoo 19 CE | ERP platform | Notes |
|------|------------|--------------|-------|
| ORM entry | `odoo/orm/` (`models.py`, `registry.py`, `environments.py`, field modules) | `core/orm/` (`models.py`, `registry.py`, `environment.py`, `fields.py`) | ERP consolidates field types; Odoo splits `fields_*.py` |
| HTTP | `odoo/http.py` (monolith) | `core/http/` (`application.py`, `routes.py`, `rpc.py`, `request.py`, `session.py`, …) | ERP modular split; same responsibilities |
| Modules | `odoo/modules/` (`loading.py`, `module.py`, `registry/`, `migration.py`) | `core/modules/` (`loader.py`, `module.py`, `registry.py`, `assets.py`) | ERP `upgrade/` separate from `modules/migration.py` |
| Data / XML | `odoo/tools/convert.py`, registry hooks | `core/data/` (`xml_loader.py`, `data_loader.py`, `views_registry.py`) | Parity target: load order + inheritance |
| SQL | `odoo/sql_db.py` | `core/sql_db.py` | Connection / cursor semantics |
| Tools | `odoo/tools/*` (broad) | `core/tools/*` (subset) | See tools gap rows below |
| Services | `odoo/service/` (`server.py`, `db.py`, `model.py`, `security.py`) | `core/service/` (`cron_scheduler.py`), HTTP in `core/http/` | No full Odoo gevent stack mirror in `core/service/` |
| CLI | `odoo/cli/*` | `core/cli/*` | Scaffold / server / db / shell aligned |

## Behavioural gap table

| Trigger / concern | Odoo reference (paths only) | ERP implementation | Status | Test / scenario |
|-------------------|----------------------------|--------------------|--------|-----------------|
| Model registry build | `odoo/orm/registry.py` | `core/orm/registry.py` | Met (core) | `test_orm.py`, `test_modules.py` |
| Record rules + ACL | `odoo/service/security.py`, `odoo/orm/models.py` | `core/orm/security.py`, `core/http/security.py` | Met (core) | RPC + ORM tests |
| Prefetch / cache | `odoo/orm/models.py` | `core/orm/models.py` `_prefetch_*` | Partial depth | N+1 list views; extend per module |
| Domain `any!` / `not any!` | `odoo/orm/domains.py` | `core/orm/domains.py` | Met | Phase 254 tests |
| `search_fetch` | `odoo/orm/models.py` | `core/orm/models.py` | Met | Phase 254 |
| Upgrade code transforms | `odoo/upgrade_code/*.py` | `core/upgrade/runner.py` | Partial | Odoo has many versioned transforms; ERP module `migrate()` |
| Full `tools` surface | `odoo/tools/query.py`, `profiler.py`, `js_transpiler.py`, … | `core/tools/` partial | Gap | Checklist: `safe_eval`, `date_utils`, `float_utils`, `image`, `misc`, `mail` — implement as needed |
| WSGI server / workers | `odoo/service/server.py` | External (`erp-bin`, optional gunicorn) | Different | Deployment topology in `architecture.md` |
| Monkeypatches | `odoo/_monkeypatches/*` | None by default | Non-goal | Avoid unless compatibility requires |
| Test addons in `odoo/addons/` | `test_*` modules | `tests/` Python + `addons/web/static/tests/` | Met pattern | Different layout, same intent |

## ORM / API surface (selected)

| Contract | Odoo | ERP | Status |
|----------|------|-----|--------|
| `call_kw` dispatch | `http` + `service.model` | `core/http/rpc.py` | done |
| `@api.model`, `@api.depends`, constraints | `odoo/orm/decorators.py` | `core/orm/decorators.py` | done |
| Computed fields store/invalidate | `odoo/orm/fields.py` | `core/orm/fields.py` | done |
| Transient models | `odoo/orm/models_transient.py` | `core/orm/models_transient.py` | done |
| Multi-company domain append | company + record rules | `core/orm/company_context.py`, rules | partial UX (shell switcher incremental) |

## Next steps (when prioritising core parity)

1. Inventory missing `core/tools/*` vs Odoo for features used by addons (no guessing — grep imports in `addons/`).
2. Add targeted rows to [parity_matrix.md](parity_matrix.md) for any new gaps discovered during module work.
3. Re-run this table after major ORM or HTTP refactors.

## Related docs

- [odoo19_reference_map.md](odoo19_reference_map.md)
- [parity_matrix.md](parity_matrix.md)
- [architecture.md](architecture.md)
