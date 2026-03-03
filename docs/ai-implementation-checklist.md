# AI Implementation Checklist

Verification checklist for AI assistant module deployment and feature additions.

## Deployment

- [ ] `ai_assistant` in `DEFAULT_SERVER_WIDE_MODULES` (core/tools/config.py)
- [ ] `./erp-bin db init -d <db>` creates `ai_audit_log`, `ai_tool_definition`, `ai_prompt_template` tables
- [ ] Routes: `GET /ai/tools`, `POST /ai/chat` registered (core/http/application.py)

## Security

- [ ] `/ai/tools` returns 401 when not authenticated
- [ ] `/ai/chat` requires session; tools execute under user context (no sudo)
- [ ] `ai.audit.log` records prompt_hash, tool_calls, user_id, outcome per invocation

## Tool Registry

- [ ] `addons/ai_assistant/tools/registry.py`: get_tools(), execute_tool(), log_audit()
- [ ] Tools use ORM (search_read, read) under env with user uid
- [ ] Available tools: search_records, summarise_recordset (extend as needed)

## RAG Retrieval

- [ ] ai.document.chunk model indexed (manual or on-write)
- [ ] GET /ai/retrieve?q=query&limit=10 returns chunks (record rules applied)
- [ ] /ai/chat with retrieve=true passes retrieved_doc_ids to audit

## Adding New Tools

1. Add tool function in `registry.py` (signature: `env, **kwargs`)
2. Register in `get_tools()` return list
3. Add handler in `execute_tool()` switch
4. Update access rights if new models used
5. Add audit logging for state-changing tools
