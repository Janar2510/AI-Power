# Upgrade Scripts and Migrations

## Contract

- Upgrade scripts are Python files with `migrate(cr, version)` function
- `cr`: Database cursor
- `version`: Target version string (e.g. `"19.0.0"`)
- Can use SQL and ORM access

## Phases

- **Pre**: Before module load
- **Post**: After module load
- **End**: Finalisation

## Patterns

- Version-specific files: `upgrade_code/19.0-00-description.py`
- Per-module: `upgrades/` or `migrations/` in module directory

## Parity Targets

- `migrate(cr, version)` signature
- Invocation during module update

## Non-Goals

- Odoo-specific upgrade_code layout
- Full migration graph in MVP
