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

## Addon import inventory (`core/tools/*`) — 2026-04

Grep of `addons/**/*.py` for `core.tools` usage (evidence-based; extend when new imports appear):

| ERP module | Imports |
|------------|---------|
| `addons/base/models/ir_actions_server.py` | `core.tools.safe_eval.safe_exec` |
| `addons/base/models/ir_attachment.py`, `ir_module_module.py`, `db_backup.py` | `core.tools.config` |
| `addons/mailing/models/mailing_mailing.py` | `core.tools.config.get_config` (lazy) |
| `core/data/data_loader.py` | `core.tools.safe_eval.safe_eval` |
| `core/db/init_data.py` | `core.tools.translate.*` |

Other `core/tools` consumers live under `core/http`, `core/cli`, `tests/`, and `scripts/` — not duplicated here. Odoo parity for additional helpers: port only when an addon import requires it.

## Prefetch / N+1 measurement + client cache (Phase 808)

| Topic | ERP | Note |
|-------|-----|------|
| Many2one display batch | `core/orm/models.py` **`_prefetch_many2one_display`** | **Phase 804:** distinct M2O ids per read batch (order-preserving list + **`set`** dedupe). |
| Client **`readRecord` cache** | `addons/web/static/src/model/relational_model.js` | **Phase 806:** **`Services.orm`** **`create` / `write` / `unlink`** (in **`services/orm.js`**) invalidate **`invalidateReadRecordCache`** so cached reads are not stale after RPC mutations. |
| Next ORM prefetch work | — | Add **only** after measuring hot **`search_read`** paths (SQL log, repeated comodel **`read`** counts, or integration test evidence). Avoid speculative prefetch branches. |
| **Post–1.250.4 evidence** | — | No new ORM **`_prefetch_*`** branch in this train. Legacy form **`read`** / **`default_get`** now use the same **25s client deadline** pattern as list **`loadRecords`** (**`legacy_main_form_views.js`**); server-side prefetch unchanged — extend **808** only when a concrete N+1 or **`call_kw`** hotspot is measured. |
| **Post–1.250.6 evidence** | — | No new **`_prefetch_*`** or RPC hotspot measurement in this train. **815** removes duplicate **`ir.rule`** generic load noise during **`db init`** (**`data_loader._SKIP_MODELS`**) — unrelated to ORM prefetch but keeps init logs usable for future profiling. |

## Next steps (when prioritising core parity)

1. Re-grep `addons/` for `core.tools` when adding modules; update the table above.
2. Add targeted rows to [parity_matrix.md](parity_matrix.md) for any new gaps discovered during module work.
3. Re-run this table after major ORM or HTTP refactors.

## Related docs

- [odoo19_reference_map.md](odoo19_reference_map.md)
- [parity_matrix.md](parity_matrix.md)
- [architecture.md](architecture.md)
