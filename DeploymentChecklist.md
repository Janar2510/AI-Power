# Deployment Checklist

## Pre-deployment

- [ ] Follow docs/ai-rules.md for development and deployment decisions
- [ ] Use odoo-parity skill when implementing parity features (see .agents/skills/odoo-parity)
- [ ] Run tests: `python3 run_tests.py`
- [ ] Optional: run e2e tour: `pip install -r requirements-dev.txt && playwright install chromium && python scripts/with_server.py --server "./erp-bin server" --port 8069 -- python -m pytest tests/e2e/ -v`
- [ ] Install passlib: `pip install "passlib[bcrypt]>=1.7"`
- [ ] Verify addons path: `./erp-bin module list`
- [ ] Initialize database: `./erp-bin db init -d <dbname>` (re-run when adding modules like crm, ai_assistant)
- [ ] Optional: install module: `./erp-bin module install -d <db> -m <module>`
- [ ] Check config: `./erp-bin help server`

## Configuration

- [ ] Set `--addons-path` to include base, web, and custom addons
- [ ] Use `--debug=assets` for development (individual files); omit for production (bundled)
- [ ] Set `--http-port` (default 8069)
- [ ] Enable `--proxy-mode` only when behind trusted reverse proxy
- [ ] Set `--db-filter` for multi-tenant deployments

## Security

- [ ] Do not run as root
- [ ] Use `--no-database-list` when hosting multiple databases
- [ ] Restrict DB manager access in production

## Post-deployment

- [ ] Verify web client loads at /
- [ ] Verify jsonrpc responds at /jsonrpc (object service requires session)
- [ ] Verify static assets serve from /<module>/static/
- [ ] Verify Contacts list loads (login, click Contacts)
- [ ] Verify Leads list loads (login, click Leads)
- [ ] Verify AI tools: `GET /ai/tools` returns 401 when not authenticated; returns tool list when session present

## AI Module (Phase 9)

- [ ] ai_assistant in server_wide_modules (core/tools/config.py)
- [ ] /ai/tools and /ai/chat routes registered
- [ ] ai.audit.log table created (db init)
