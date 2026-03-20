# AI Implementation Checklist

Verification checklist for AI assistant module deployment and feature additions.

## Missing apps parity (1.200)

- [ ] CRM app root is `CRM` with nested Sales/Leads/Reporting/Configuration menus (no flat single-menu CRM).
- [ ] Discuss has a top-level app menu (`menu_discuss_root`) and still routes to `#discuss`.
- [ ] HR sub-apps promoted to top-level: Expenses, Attendances, Recruitment, Time Off.
- [ ] Analytic root moved under Invoicing Configuration (not a standalone top-level app tile).
- [ ] App menu/routing matrix supports: `pipeline`, `crm/activities`, `expenses`, `attendances`, `recruitment`, `time_off`, `repair_orders`, `surveys`, `lunch_orders`, `livechat_channels`, `project_todos`, `recycle_models`, `skills`, `elearning`.
- [ ] Scaffold modules expose at least one root menu + list/form action view: repair, survey, lunch, im_livechat, project_todo, data_recycle, hr_skills, website_slides.
- [x] Regression check passes: `python3 -m unittest tests.test_missing_apps_parity_phase408`.

## Working menu + apps home launcher (1.199)

- [ ] `main.js` home route renders app launcher tiles from app-root menus (`getAppRoots`) instead of dashboard-only output.
- [ ] `main.js` keeps dashboard available on home below app launcher (no regression to KPI/activity widgets).
- [ ] `main.js` routing maps include: `taxes`, `payment_terms`, `pricelists`, `bank_statements`, `reordering_rules`, `analytic_accounts`, `analytic_plans`.
- [ ] Sidebar app context remains route-driven (`getAppIdForRoute`) and current app label appears in navbar.
- [ ] Menu XML hierarchy is corrected in `stock_views.xml` and `account_views.xml` so app roots are not fragmented.

## Frontend/Backend roadmap scaffold (1.198)

- [ ] `web.assets_web` includes new service layer files: `hotkey.js`, `command_palette.js`, `debug_menu.js`, `pwa.js`.
- [ ] `main.js` initializes command palette hotkey and PWA registration without breaking existing routes.
- [ ] New component contracts are loaded: `form_field`, `statusbar`, `one2many`, `many2many_tags`, `breadcrumbs`, `confirm_dialog`, `select_create_dialog`, `search_panel`.
- [ ] ORM registry hooks are called (`_register_hook`, `_unregister_hook`) when env is attached/cleared.
- [ ] `_log_access` writes `create_uid/create_date/write_uid/write_date` on create/write where available.
- [ ] Schema manager creates audit columns for `_log_access` models and supports SQL views via `_table_query`.
- [ ] Tooling helpers are available from `core.tools`: `safe_eval`, `date_utils`, `float_utils`, `image`, `misc`, `mail`.

## Web client / dashboard (1.178)

- [ ] Home dashboard loads via `AppCore.Dashboard.render` + `design-system/specs/dashboard-home.md` tokens (no inline dashboard HTML in `main.js`)
- [ ] `web.assets_web` includes `kpi_card`, `activity_feed`, `shortcuts_bar`, `recent_items`, `core/dashboard.js` before `main.js`

## Deployment

- [ ] `ai_assistant` in `DEFAULT_SERVER_WIDE_MODULES` (core/tools/config.py)
- [ ] `./erp-bin db init -d <db>` creates `ai_audit_log`, `ai_tool_definition`, `ai_prompt_template` tables
- [ ] Routes: `GET /ai/tools`, `POST /ai/chat`, `GET /ai/config`, `POST /ai/nl_search`, `POST /ai/extract_fields` registered (core/http/application.py)
- [ ] Runtime sanity after deploy: no 500s from `/web/dataset/call_kw` while dashboard/AI panel are open
- [ ] Runtime sanity after deploy: `/ai/chat` and bus polling remain healthy after browser hard refresh

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

## Phases 308-319 Module Rollout

- [ ] **308-311** in `DEFAULT_SERVER_WIDE_MODULES`: `barcodes`, `barcodes_gs1_nomenclature`, `base_iban`, `base_vat`, `board`, `http_routing`, `html_editor`, `html_builder`, `product_matrix`, `product_email_template`, `sale_product_matrix`, `purchase_product_matrix`, `sale_pdf_quote_builder`, `delivery_stock_picking_batch`, `stock_fleet`, `mrp_subcontracting_dropshipping`
- [ ] **312-315** in `DEFAULT_SERVER_WIDE_MODULES`: `auth_ldap`, `auth_passkey`, `auth_passkey_portal`, `auth_timeout`, `mail_group`, `mail_plugin`, `snailmail`, `snailmail_account`, `event_booth`, `event_booth_sale`, `website_event`, `website_event_sale`, `website_event_crm`, `website_event_booth`, `website_event_booth_sale`, `project_mrp_stock_landed_costs`
- [ ] **316-319** in `DEFAULT_SERVER_WIDE_MODULES`: `website_sale_stock`, `website_sale_wishlist`, `website_sale_comparison`, `website_sale_comparison_wishlist`, `website_customer`, `website_partner`, `website_profile`, `website_hr_recruitment`, `iap_crm`, `crm_iap_enrich`, `crm_mail_plugin`, `marketing_card`, `sms_twilio`, `web_unsplash`, `base_sparse_field`, `base_import_module`, `base_install_request`, `partnership`
- [x] Run: `python3.11 -m unittest tests.test_phase308_319 -v`

## Phases 320-329 Module Rollout

- [ ] **320-322** in `DEFAULT_SERVER_WIDE_MODULES`: `account_edi`, `account_edi_proxy_client`, `account_edi_ubl_cii`, `account_add_gln`, `account_peppol`, `account_peppol_advanced_fields`, `account_qr_code_emv`, `account_qr_code_sepa`, `account_tax_python`, `account_update_tax_tags`, `sale_edi_ubl`, `purchase_edi_ubl_bis3`
- [ ] **323-326** in `DEFAULT_SERVER_WIDE_MODULES`: `website_event_track`, `website_event_track_quiz`, `website_event_track_live`, `website_event_track_live_quiz`, `website_event_exhibitor`, `website_event_booth_exhibitor`, `website_event_booth_sale_exhibitor`, `website_sale_loyalty`, `website_sale_mrp`, `website_sale_autocomplete`, `website_sale_stock_wishlist`, `website_sale_collect`, `website_sale_collect_wishlist`, `website_crm_sms`, `website_cf_turnstile`
- [ ] **327-329** in `DEFAULT_SERVER_WIDE_MODULES`: `website_crm_iap_reveal`, `website_crm_partner_assign`, `website_mail_group`, `crm_iap_mine`, `delivery_mondialrelay`, `website_sale_mondialrelay`, `sale_gelato`, `sale_gelato_stock`, `website_sale_gelato`, `hr_recruitment_survey`, `project_mail_plugin`, `attachment_indexation`, `certificate`
- [x] Run: `python3.11 -m unittest tests.test_phase320_329 -v`

## Phases 330-341 Module Rollout

- [ ] **330-333** in `DEFAULT_SERVER_WIDE_MODULES`: `mass_mailing`, `mass_mailing_crm`, `mass_mailing_event`, `mass_mailing_sale`, `mass_mailing_sms`, `mass_mailing_themes`, `im_livechat`, `crm_livechat`, `hr_livechat`, `website_livechat`
- [ ] **334-336** in `DEFAULT_SERVER_WIDE_MODULES`: `website_blog`, `website_forum`, `website_slides`, `hr_skills_slides`
- [ ] **337-341** in `DEFAULT_SERVER_WIDE_MODULES`: `pos_discount`, `pos_loyalty`, `pos_sale`, `pos_sale_loyalty`, `pos_sale_margin`, `pos_hr`, `pos_restaurant`, `pos_hr_restaurant`, `pos_restaurant_loyalty`, `pos_mrp`, `pos_event`, `pos_event_sale`, `pos_sms`, `pos_self_order`, `pos_online_payment`, `pos_account_tax_python`
- [x] Run: `python3.11 -m unittest tests.test_phase330_341 -v`

## Phases 342-353 Module Rollout

- [ ] **342-343** in `DEFAULT_SERVER_WIDE_MODULES`: `payment_stripe`, `payment_paypal`, `payment_adyen`, `payment_authorize`, `payment_mollie`, `payment_razorpay`, `payment_custom`, `payment_demo`
- [ ] **344-346** in `DEFAULT_SERVER_WIDE_MODULES`: `pos_adyen`, `pos_stripe`, `pos_restaurant_adyen`, `google_calendar`, `google_drive`, `microsoft_calendar`, `microsoft_outlook`
- [ ] **347-349** in `DEFAULT_SERVER_WIDE_MODULES`: `spreadsheet`, `spreadsheet_dashboard`, `spreadsheet_account`, `spreadsheet_dashboard_account`, `spreadsheet_crm`, `spreadsheet_dashboard_crm`, `cloud_storage`, `iot`
- [ ] **350-353** in `DEFAULT_SERVER_WIDE_MODULES`: `l10n_generic_coa`, `l10n_us`, `l10n_uk`, `l10n_de`, `l10n_fr`
- [x] Run: `python3.11 -m unittest tests.test_phase342_353 -v`

## Phases 354-365 Rollout

- [ ] **354-356** in `DEFAULT_SERVER_WIDE_MODULES`: `l10n_es`, `l10n_it`, `l10n_nl`, `l10n_be`, `l10n_ch`, `l10n_at`, `l10n_in`, `l10n_br`, `l10n_mx`, `l10n_au`, `l10n_ca`, `l10n_pl`, `l10n_se`, `l10n_no`, `l10n_dk`
- [ ] **357-359** in `DEFAULT_SERVER_WIDE_MODULES`: `theme_default`, `theme_starter_1`, `theme_starter_2`, `theme_starter_3`, `theme_starter_4`
- [ ] **360-365** frontend artifacts present: design system docs, components, layout, renderers, widgets, UI/UX agent rules
- [ ] UI UX Pro Max workflow documented in `docs/QUICK_START_AGENTS.md`
- [x] Run: `python3.11 -m unittest tests.test_phase354_365 -v`

## Phases 366-377 Rollout

- [ ] **366-368** widgets implemented in `addons/web/static/src/widgets`: `many2one_widget`, `many2many_widget`, `date_widget`, `monetary_widget`, `binary_widget`, `html_widget`
- [ ] **369-370** components implemented in `addons/web/static/src/components`: `button`, `card`, `badge`, `avatar`, `modal`, `toast`
- [ ] **371-373** layout/renderers implemented in `addons/web/static/src/layout` and `addons/web/static/src/views`: `navbar`, `sidebar`, `action_layout`, `calendar_renderer`, `gantt_renderer`
- [ ] **374-377** in `DEFAULT_SERVER_WIDE_MODULES`: `l10n_ar`, `l10n_cl`, `l10n_co`, `l10n_pe`, `l10n_ec`, `l10n_ae`, `l10n_sa`, `l10n_eg`, `l10n_za`, `l10n_ke`, `l10n_cn`, `l10n_kr`, `l10n_tw`, `l10n_sg_full`, `l10n_th`, `l10n_cz`, `l10n_hu`, `l10n_ro`, `l10n_bg`, `l10n_pt`
- [x] Run: `python3.11 -m unittest tests.test_phase366_377 -v`

## Phases 378-389 Rollout

- [ ] **378-381** extracted frontend core modules in `addons/web/static/src/core`: `router`, `view_manager`, `dashboard`, `settings`, `chatter`, `field_utils`
- [ ] **382-385** backend stub methods enriched in `hr_presence`, `hr_holidays_homeworking`, `hr_work_entry_holidays`, `mail_template`, `res_lang`, `ir_model`, `mrp_product_expiry`, `base_geolocalize`
- [ ] **386-389** in `DEFAULT_SERVER_WIDE_MODULES`: `l10n_bo`, `l10n_cr`, `l10n_uy`, `l10n_ve`, `l10n_ph`, `l10n_id`, `l10n_vn`, `l10n_pk`, `l10n_ng`, `l10n_ma`, `l10n_il`, `l10n_hr`, `l10n_rs`, `l10n_si`, `l10n_lu`, `l10n_lt`, `l10n_lv`, `l10n_ua`, `l10n_fi`, `l10n_gr`
- [x] Run: `python3.11 -m unittest tests.test_phase378_389 -v`
