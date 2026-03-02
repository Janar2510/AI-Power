# Architecture Decision Records

## ADR-001: Project Naming

- **Decision**: Use `erp-platform` as project root; `core` for platform code (not `odoo`)
- **Rationale**: Clean-room reimplementation; avoid Odoo branding
- **Status**: Accepted

## ADR-002: Entrypoint Name

- **Decision**: `erp-bin` as primary; document `odoo-bin` alias for parity
- **Rationale**: Distinct identity; compatibility note for Odoo users
- **Status**: Accepted

## ADR-003: Tech Stack

- **Decision**: Python 3.10+, PostgreSQL 13+, Jinja2 for templates, Werkzeug for HTTP
- **Rationale**: Match Odoo 19 requirements; minimal dependencies
- **Status**: Accepted

## ADR-004: Frontend Framework

- **Decision**: Start with vanilla JS + minimal framework; consider React/Vue later for view renderers
- **Rationale**: Parity report allows modernisation; avoid Owl complexity in MVP
- **Status**: Accepted

## ADR-005: AI Module Scope

- **Decision**: AI as optional `addons/ai_assistant`; RAG + tool registry; all tools via ORM
- **Rationale**: Security; auditability; no privileged AI
- **Status**: Accepted
