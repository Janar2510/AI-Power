# AI Assistant Module - Threat Model and Verification

## Design Principles

- **No privileged AI**: AI operates through the same ORM + security system as users
- **User context**: All tool calls execute as the requesting user (no sudo unless documented)
- **Audit trail**: Every retrieval and tool invocation is logged to `ai.audit.log`
- **Record rules**: Enforced before retrieval and before tool execution

## Threat Model

| Threat | Mitigation |
|--------|------------|
| Data leak via retrieval | Record rules applied before retrieval; only allowed documents indexed |
| Unauthorized tool execution | Tools call ORM methods; access rights + record rules apply |
| Prompt injection | Input sanitization; tool calls require user confirmation for state-changing actions |
| Audit log tampering | Default deny for non-admin; write access restricted |

## Tool Registry

Tools (search_records, summarise_recordset, draft_message, create_activity, propose_workflow_step) must:

1. Be registered in `ai.tool.definition`
2. Call ORM methods under user context
3. Log invocation to `ai.audit.log`

## Verification

- Unit tests: tool-call permission tests
- RAG boundary tests: verify record rules applied before retrieval
- Integration: verify audit log entries created for each invocation
