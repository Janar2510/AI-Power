# Test Plan

## Unit Tests (Python)

- **Framework**: unittest-style; discovery from `tests/`
- **Fixtures**: Deterministic DB state, mock RPC
- **Scope**: Module loader, ORM, security, config

## JS Unit Tests

- **Framework**: QUnit-style or similar
- **Mock server**: Deterministic RPC responses
- **Scope**: Services, view renderers, modifier evaluator

## Integration Tours

- **Tool**: Playwright
- **Scenarios**: Login, list view render, form create
- **Scope**: Cross-layer behaviour

## Parity Verification

| Invariant | Test Type | Description |
|-----------|-----------|-------------|
| Module lifecycle | Unit | Install/upgrade order obeys depends |
| Access rights | Unit | CRUD enforced per ir.model.access |
| Record rules | Unit | Default-allow semantics |
| ORM prefetch | Unit | No N+1 in common flows |
| jsonrpc dispatch | Unit | Exception handling, error model |
| Asset bundling | JS | Bundle rules applied |
| E2E flow | Tour | Login + list view |

## Acceptance Criteria

- All parity invariants have at least one test
- Smoke test: server starts, base+web load, minimal RPC works
