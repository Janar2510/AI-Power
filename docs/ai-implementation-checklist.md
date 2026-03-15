# AI Implementation Checklist

Verification checklist for AI assistant module deployment and feature additions.

## Deployment

- [ ] `ai_assistant` in `DEFAULT_SERVER_WIDE_MODULES` (core/tools/config.py)
- [ ] `./erp-bin db init -d <db>` creates `ai_audit_log`, `ai_tool_definition`, `ai_prompt_template` tables
- [ ] Routes: `GET /ai/tools`, `POST /ai/chat`, `GET /ai/config`, `POST /ai/nl_search`, `POST /ai/extract_fields` registered (core/http/application.py)

## Security

- [ ] `/ai/tools` returns 401 when not authenticated
- [ ] `/ai/chat` requires session; tools execute under user context (no sudo)
- [ ] `ai.audit.log` records prompt_hash, tool_calls, user_id, outcome per invocation

## Tool Registry

- [ ] `addons/ai_assistant/tools/registry.py`: get_tools(), execute_tool(), log_audit()
- [ ] Tools use ORM (search_read, read) under env with user uid
- [ ] Available tools: search_records, summarise_recordset, nl_search (extend as needed)

## RAG Retrieval

- [ ] ai.document.chunk model indexed (manual or on-write)
- [ ] GET /ai/retrieve?q=query&limit=10 returns chunks (record rules applied)
- [ ] /ai/chat with retrieve=true passes retrieved_doc_ids to audit

## LLM Integration (Phase 88)

- [ ] addons/ai_assistant/llm.py: call_llm() with OpenAI function-calling; tool_calls loop
- [ ] ir.config_parameter: ai.openai_api_key, ai.llm_enabled, ai.llm_model
- [ ] When ai.llm_enabled=1: /ai/chat accepts prompt without tool; uses call_llm with RAG context
- [ ] Settings > AI Configuration: API key input, enable toggle, model selector
- [ ] Chat panel: fetch /ai/config; prompt-only mode when LLM enabled; loading indicator

## Phase 122 (AI Natural Language Search)

- [ ] nl_search(model, query) in registry: LLM converts NL to domain when enabled; fallback ilike on name/email/description
- [ ] POST /ai/nl_search returns {domain, results}; used by AI Search button in list views

## Phase 123 (AI-Assisted Data Entry)

- [ ] extract_fields(model, text) in registry: LLM extracts structured fields when enabled; fallback regex for email/phone
- [ ] POST /ai/extract_fields returns {fields}; used by AI Fill button on lead/partner forms

## Adding New Tools

1. Add tool function in `registry.py` (signature: `env, **kwargs`)
2. Register in `get_tools()` return list
3. Add handler in `execute_tool()` switch
4. Update access rights if new models used
5. Add audit logging for state-changing tools
