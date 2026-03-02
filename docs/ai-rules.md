# AI Agent Rules for ERP Platform Development

This document codifies rules from the AI-Powered ERP Build Plan and [deep-research-report-2.md](../deep-research-report-2.md). AI agents must follow these rules when modifying this codebase.

## Non-Negotiable Constraints

- **Clean-room reimplementation**: No verbatim copy of Odoo code. If reusing upstream code, comply with LGPLv3 and document it.
- **Metadata-driven UI + modular server**: Models, views, actions, menus, and security are declared as *data* and *Python packages*; the client renders UI from those declarations.
- **Multi-database tenancy**: Support `--db-filter` for DB selection; `--no-database-list` when hosting multiple databases.
- **Strict security layering**: Access rights (`ir.model.access`) plus record rules (default-allow semantics) are enforced at every API surface, including AI features.

## Security Rules

- Enforce security at **every data entrypoint**: ORM reads/writes, controllers, RPC, AI tooling, imports, background jobs.
- No privileged AI: AI operates through the same ORM + security system as users.
- All AI tool calls execute as the requesting user (no sudo unless documented).
- Record rules apply *before* retrieval and *before* tool execution to prevent data leaks.

## Backend Rules

- **Module manifest**: Support `__manifest__.py` keys: name, version, depends, data, demo, assets, license, application, auto_install.
- **Dependency resolution**: Acyclic, stable order; data load order respects manifest `data` declaration.
- **ORM**: Recordset semantics (iteration, batching, caching); prefetch heuristics for N+1 avoidance.
- **API tiers**: Internal RPC (session-aware), External JSON-2 (token-based), Extension controllers (same security model).
- **Upgrades**: `migrate(cr, version)` contract for per-module scripts.

## Frontend Rules

- **Action-first navigation**: Treat actions as first-class (window, client, URL).
- **View architecture**: XML → AST → render pipeline; accept canonical view architecture representation.
- **Service container**: rpc, action, session, i18n, user injected into components.
- **Component model**: Declarative; registries for view types, field widgets, services.
- **State rules**: Separate server-state (authoritative) from UI-state (ephemeral, serialisable).

## AI Module Rules

- **Tool registry**: search_records, summarise_recordset, draft_message, etc. — all via ORM under user context.
- **Audit log**: Every retrieval and tool invocation logged to `ai.audit.log` (prompt hash, doc IDs, tool calls, user, timestamps).
- **User confirmation**: Require confirmation for state-changing actions unless workflow explicitly delegates.

## Workflow Rules

- **One feature or fix per response**; avoid large refactors without approval.
- **Prefer minimal, surgical diffs**; never break public APIs without explicit instruction.
- **Do not invent** data models or endpoints; follow existing architecture.
- **Read** docs/architecture.md and docs/api-contracts.md before coding.
- **Update** changelog.md and DeploymentChecklist.md when adding or changing important deployment-relevant code.

## Parity Targets

- Module lifecycle, security invariants, ORM prefetch semantics
- jsonrpc dispatch, controller routing, static serving
- Asset bundling (include/remove/after), debug=assets mode

## Non-Goals

- Full Odoo parity across hundreds of addons (defer business modules)
- Logo or brand reuse; avoid Odoo branding
