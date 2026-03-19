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

## Phase 136 (Vector embeddings)

- [ ] pgvector extension; ai.document.chunk.embedding (vector 1536)
- [ ] index_record_for_rag: embeds via OpenAI text-embedding-3-small on write
- [ ] retrieve_chunks: cosine similarity when embeddings exist; ilike fallback

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

## Phase 124 (AI Conversation Memory)

- [ ] ai.conversation model: user_id, messages (JSON), model_context, active_id
- [ ] /ai/chat: conversation_id, model_context, active_id; loads prior messages; injects view context into system prompt
- [ ] Chat panel: maintains conversation_id; "New" button; window.chatContext from main.js

## Adding New Tools

1. Add tool function in `registry.py` (signature: `env, **kwargs`)
2. Register in `get_tools()` return list
3. Add handler in `execute_tool()` switch
4. Update access rights if new models used
5. Add audit logging for state-changing tools

## Phase 284-286 Module Rollout

- [ ] `project_sms` loaded in `DEFAULT_SERVER_WIDE_MODULES`
- [ ] `project_todo`, `project_stock`, `project_purchase`, `project_hr_expense`, `project_sale_expense`, `project_timesheet_holidays` loaded in `DEFAULT_SERVER_WIDE_MODULES`
- [ ] Run targeted regression: `python3.11 -m unittest tests.test_phase284_286 -v`

## Phase 287-288 Module Rollout

- [ ] `hr_gamification`, `hr_fleet`, `hr_maintenance`, `hr_calendar`, `hr_homeworking`, `hr_recruitment_skills` loaded in `DEFAULT_SERVER_WIDE_MODULES`
- [ ] Validate HR links: employee badges, vehicles, equipment, meetings, work location, applicant skills
- [ ] Run targeted regression: `python3.11 -m unittest tests.test_phase287_288 -v`

## Phases 289-295 (Cluster E) Module Rollout

- [ ] Event/website bridges: `event_product`, `event_sms`, `event_crm`, `event_sale`, `website_crm`, `website_payment` in `DEFAULT_SERVER_WIDE_MODULES`
- [ ] Composite bridges: `account_fleet`, `stock_sms`, `stock_delivery`, `sale_expense_margin`, `sale_loyalty_delivery`, `purchase_requisition_stock`, `purchase_requisition_sale`, `product_margin`, `product_expiry`, `auth_password_policy`, `social_media`, `base_address_extended`, `base_geolocalize`
- [ ] Run targeted regression: `python3.11 -m unittest tests.test_phase289_290 tests.test_phase291_295 -v`

## Phases 296-307 Module Rollout

- [ ] **296–301** in `DEFAULT_SERVER_WIDE_MODULES`: `mrp_landed_costs`, `mrp_product_expiry`, `mrp_repair`, `mrp_subcontracting_account`, `mrp_subcontracting_purchase`, `mrp_subcontracting_repair`, `mrp_subcontracting_landed_costs`, `project_mrp`, `project_hr_skills`, `project_stock_account`, `project_purchase_stock`, `project_stock_landed_costs`, `project_mrp_account`, `project_mrp_sale`, `sale_project_stock_account`, `hr_work_entry_holidays`, `hr_holidays_attendance`, `hr_holidays_homeworking`, `hr_homeworking_calendar`, `hr_timesheet_attendance`, `hr_presence`, `hr_hourly_cost`, `hr_recruitment_sms`
- [ ] **302–307** in `DEFAULT_SERVER_WIDE_MODULES`: `sale_purchase_project`, `sale_project_stock`, `sale_mrp_margin`, `sale_stock_product_expiry`, `calendar_sms`, `resource_mail`, `survey_crm`, `event_crm_sale`, `mail_bot`, `auth_password_policy_portal`, `auth_password_policy_signup`, `auth_totp_mail`, `auth_totp_portal`, `stock_maintenance`, `stock_picking_batch`, `purchase_repair`, `stock_dropshipping`, `web_hierarchy`, `website_mail`, `website_sms`, `website_links`, `website_project`, `website_timesheet`, `hr_skills_event`, `hr_skills_survey`, `mail_bot_hr`, `hr_org_chart`
- [x] Run: `python3.11 -m unittest tests.test_phase296_307 -v`
- [ ] After deploy: verify new relation tables and `stock.picking.batch` model load without import errors
- [x] Compatibility fields aligned to regression contract (`sale_purchase_project_auto_count`, `sms_reminder_ids`, `portal_password_policy_level`, `maintenance_request_id`, `web_hierarchy_parent_field`)
