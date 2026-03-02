# API Contracts

## Internal RPC (Web Client ↔ Server)

- **Transport**: JSON-RPC over POST
- **Session**: Cookie or session store; session-aware
- **Protection**: Record rules applied; access rights enforced
- **Error model**: HTTP 200 with JSON error payload for application errors

## External JSON-2 (Deferred)

- Odoo 19 positions JSON-2 as replacement for legacy XML-RPC/JSON-RPC
- Token/key-based auth
- Multi-db selection via headers
- Legacy endpoints removed in Odoo 20

## Extension Controllers

- `@route` decorator: path, methods, auth
- Auth modes: `user`, `public`, `none`
- Same security model as RPC

## Parity Targets

- jsonrpc request/response format
- Session handling
- Error propagation

## Non-Goals

- Legacy XML-RPC/JSON-RPC
- Full External JSON-2 in MVP
