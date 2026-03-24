# AI-Powered Modular ERP Platform

A parity-first, AI-powered modular ERP platform that mirrors Odoo 19.0 structure and behaviour. Clean-room reimplementation with optional AI assistant modules.

## Quick Start

**Shell tip (Phase 550):** Put comments on their **own line**. Inline `# ...` after a command is passed to `argparse` as extra arguments (e.g. `erp-bin db drop -d erp    # oops` fails with “unrecognized arguments”).

```bash
pip install -r requirements.txt
./erp-bin help
./erp-bin module list
./erp-bin db init -d erp
./erp-bin scaffold my_module addons/
python3 run_tests.py
./erp-bin server
# Optional e2e: pip install -r requirements-dev.txt && playwright install chromium
# python scripts/with_server.py --server "./erp-bin server" --port 8069 -- python -m pytest tests/e2e/ -v
# JS unit tests: open http://localhost:8069/web/static/tests/test_runner.html
```

Then open http://localhost:8069/ - you will be redirected to login. Use the admin user created during `db init` (login: admin, password: admin).

**Web client:** **Mod+K** (macOS **Cmd+K**) opens the command palette; **Escape** closes it (Phase 558).

**Database:** Requires PostgreSQL. Set `PGUSER`, `PGPASSWORD`, `PGDATABASE` if needed. Default db_user is current system user.

**PostgreSQL role:** If you see "role does not exist" or "database does not exist", run with `PGUSER=postgres` (or your PostgreSQL superuser):
```bash
PGUSER=postgres ./erp-bin db init -d erp
PGUSER=postgres ./erp-bin server
```

**Empty database / missing tables:** If you see `relation "res_users" does not exist`, the DB exists but was never initialized. Run `./erp-bin db init -d <name>` (same name as `PGDATABASE` / `--db_name=`, default `erp`), or restart `./erp-bin server` after upgrading — the server auto-inits when `res_users` is missing.

**pgvector (optional, Phase 550):** Semantic RAG uses the Postgres `vector` type when the **pgvector** extension is available. Homebrew `postgresql@15` does **not** ship `vector.control` until you install the **pgvector** formula for that major version and ensure `shared_preload_libraries` / extension path match your server (see [pgvector](https://github.com/pgvector/pgvector) and [DeploymentChecklist.md](DeploymentChecklist.md)). **Without** the extension, `db init` must still succeed: the platform uses a savepoint around `CREATE EXTENSION`, stores embeddings as **JSONB**, and RAG retrieval avoids `<=>` (see Phase 547). If an older build left the session in a failed transaction, drop the DB and re-run `db init`.

**Translation PO discovery (regression):** `tests/test_translate_discover_phase545.py` covers `discover_po_files` / `load_po_file` used during `load_default_data`.

**RAG embedding column (Phase 552):** After enabling pgvector, inspect type with `scripts/check_embedding_column.py` (read-only; run from repo root with `.venv` + DB config).

**DB tests (539–541):** Phase **540** creates minimal `account.account` rows (expense + current asset) inside the test when the chart has none, so `npm run test:phases-539-541-db` is less environment-dependent (Phase 545).

## Module Philosophy

- **Metadata-driven**: Models, views, actions, menus declared as data
- **Modular**: Addons are Python packages with `__manifest__.py`
- **Secure**: Access rights + record rules at every entrypoint
- **AI-ready**: Optional RAG + tool-using agents under same security

## Structure

```
erp-platform/
├── erp-bin           # CLI entrypoint
├── core/             # Platform core
├── addons/           # base, web, ai_assistant, ...
├── docs/             # Architecture, API, migrations
└── tests/
```

## Dev Workflow

1. Create module: `./erp-bin scaffold <name> addons/`
2. Implement models, views, security in module
3. Run tests: `./erp-bin test` (when implemented)
4. See [CONTRIBUTING.md](CONTRIBUTING.md) for workflow

## Assistant Skill Setup

This repo vendors the UI UX Pro Max skill at `.cursor/skills/ui-ux-pro-max`.

- Cursor uses the vendored `.cursor` setup directly.
- Codex uses `~/.codex/skills`, so this repo provides helper scripts for local-machine linking and verification.

See [docs/assistant-skill-setup.md](docs/assistant-skill-setup.md).

Common checks:

```bash
python3 --version
npm install -g uipro-cli
uipro --version
bash scripts/install_uipro_cli_local.sh   # fallback if npm global install hits EACCES
bash scripts/setup_ui_ux_pro_max_codex.sh
bash scripts/check_ui_ux_pro_max_setup.sh
```

## Parity Targets

- Odoo 19.0 structural and behavioural parity for platform kernel
- See [docs/parity_matrix.md](docs/parity_matrix.md) for status

## License

LGPL-3 (see LICENSE). Clean-room implementation; no Odoo code copied.
