# Frontend View Contracts

## Phase 4 Target

Move the following ERP surfaces onto the modular frontend architecture:

- dashboard
- list
- form
- kanban

## Invariants

- server metadata remains authoritative
- actions, menus, and views still come from backend metadata
- no ORM or RPC redesign in the 1-5 phase wave

## Required Frontend Boundaries

- view registry
- field/widget registry
- action container ownership
- control panel/search ownership
- shell/view separation

## Styling Rules

- migrated views must use shared tokens and class-based styling
- high-visibility inline style rendering should be removed as those views move
- dark/light parity is required on every migrated surface
