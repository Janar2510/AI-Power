# AI-Powered Modular ERP Platform

A parity-first, AI-powered modular ERP platform that mirrors Odoo 19.0 structure and behaviour. Clean-room reimplementation with optional AI assistant modules.

## Quick Start

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

**Database:** Requires PostgreSQL. Set `PGUSER`, `PGPASSWORD`, `PGDATABASE` if needed. Default db_user is current system user.

**PostgreSQL role:** If you see "role does not exist" or "database does not exist", run with `PGUSER=postgres` (or your PostgreSQL superuser):
```bash
PGUSER=postgres ./erp-bin db init -d erp
PGUSER=postgres ./erp-bin server
```

**Empty database / missing tables:** If you see `relation "res_users" does not exist`, the DB exists but was never initialized. Run `./erp-bin db init -d <name>` (same name as `PGDATABASE` / `--db_name=`, default `erp`), or restart `./erp-bin server` after upgrading — the server auto-inits when `res_users` is missing.

**pgvector (optional):** Semantic RAG embeddings use the Postgres `vector` type when the **pgvector** extension is installed. Without it, `db init` still completes: embeddings are stored as **JSONB** and retrieval falls back to text search. To enable vectors on Homebrew PostgreSQL, install/build pgvector for your server version and run `CREATE EXTENSION vector` (see [pgvector](https://github.com/pgvector/pgvector)). If a previous `db init` failed halfway, drop the database and re-run `db init`.

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
