# Backend Design and Build Rules

## Core Runtime

### Version Gates

- Python >= 3.10 (match Odoo 19)
- PostgreSQL >= 13

### Init Sequence

- Early patching (monkeypatches, GC thresholds)
- Deterministic boot stages

### Configuration

- `--addons-path`: Module discovery
- `--http-port`: 8069 default
- `--gevent-port`: 8072 default
- `--proxy-mode`, `--db-filter`, `--test-enable`

## Module Architecture

### Manifest

- `__manifest__.py` dict: name, version, depends, data, demo, assets, license, application, auto_install
- Data load order by dependency

### Dependency Resolution

- Acyclic; stable ordering
- Install/upgrade respects manifest `data` order

### Scaffolding

- CLI `scaffold` command; Jinja2 templates
- Default template: controllers, models, demo, access CSV, views

## ORM

### Recordset Semantics

- First-class recordsets; iteration, batching, caching
- Prefetch heuristics for N+1 avoidance

### Computed Fields

- Compute dependencies performance-critical
- Store vs compute trade-offs

### Monetary / Multi-Currency

- Monetary field + currency Many2one; `currency_field` default `currency_id`

## Controllers and APIs

### Web Controllers

- Route typing, exception dispatching, jsonrpc semantics
- `@route` decorator, auth modes

### API Tiers

1. **Internal RPC**: Session-aware, record-rule protected
2. **External JSON-2**: Token/key-based (deferred)
3. **Extension controllers**: Module HTTP endpoints, same security

## Security

### Access Rights

- `ir.model.access` from CSV
- Enforced at every data entrypoint

### Record Rules

- Evaluated record-by-record after access rights
- Default-allow if access grants and no rule applies

### Pitfalls

- No unsafe public methods; avoid security drift

## Cron / Jobs / Upgrades

- Cron: Use trigger method, not direct call
- Multi-processing: Workers + cron workers; gevent for realtime
- Upgrades: `migrate(cr, version)` in Python files

## Parity Targets

- ORM contracts, security invariants
- Controller behaviour, upgrade script contract

## Non-Goals

- Full Odoo service layer
- All Odoo tools (babel, zeep, etc.)
