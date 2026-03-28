# AI workflow automation templates (Phase 509–512)

Use **`base.automation`** (server actions + domain triggers) for deterministic flows; pair with AI tools only after human confirmation.

## Suggested templates

1. **Vendor bill from OCR** — `ai_assistant` `process_document` tool creates draft `account.move`; automation notifies AP group.
2. **Email routing** — `fetchmail` / gateway module classifies subject keywords → creates `crm.lead` or `project.task` (rule-based first; LLM optional).
3. **Anomaly alerts** — `ai.anomaly` / `anomaly_detection` tool on schedule; `base.automation` emails managers when score &gt; threshold.

## Guardrails

- No privileged AI: tools run as the requesting user.
- State-changing automations require explicit approval in UI or signed server rules.

## Phase C2 (2026-03) — automation × AI boundary

- **`base.automation`** continues to run server actions / webhooks / field updates via `core.orm.automation` (`run_on_time` cron).
- **Direct LLM tool invocation from automation** remains a product-scoped follow-up: add an `ir.actions.server` code path or explicit `action_type` only after audit + confirmation UX is defined.
- **`/ai/chat/stream`**: reserved endpoint returns **501** until streaming is implemented (see `ai_controller.ai_chat_stream`).
