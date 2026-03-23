# AI workflow automation templates (Phase 509–512)

Use **`base.automation`** (server actions + domain triggers) for deterministic flows; pair with AI tools only after human confirmation.

## Suggested templates

1. **Vendor bill from OCR** — `ai_assistant` `process_document` tool creates draft `account.move`; automation notifies AP group.
2. **Email routing** — `fetchmail` / gateway module classifies subject keywords → creates `crm.lead` or `project.task` (rule-based first; LLM optional).
3. **Anomaly alerts** — `ai.anomaly` / `anomaly_detection` tool on schedule; `base.automation` emails managers when score &gt; threshold.

## Guardrails

- No privileged AI: tools run as the requesting user.
- State-changing automations require explicit approval in UI or signed server rules.
