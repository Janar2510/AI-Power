# Security & compliance (Phase 521–524)

## OWASP-aligned review

| Area | Status / action |
|------|-----------------|
| Injection | ORM-only data access; parameterized SQL in core. |
| Broken auth | Session cookies; TOTP path; rate limits on `/web/login` (see `core/http/security.py`). |
| Sensitive data | TLS at reverse proxy; secrets in env not repo. |
| XSS | Escape user HTML in views; sanitize rich text server-side. |
| CSRF | Token validation on mutating requests (`security.py` exemptions documented). |
| SSRF | Restrict outbound URLs in integrations; no raw user URLs in server fetch. |
| Misconfig | `db_filter`, `no_database_list` for multi-tenant. |

## API keys & sessions

- Rotate LLM/API keys via `ir.config_parameter` or env.
- Enforce idle timeout at reverse proxy where possible; session invalidation on password change (policy).

## GDPR

- Enable **privacy** / **privacy_lookup** modules for erasure/export where deployed.
- Document lawful basis and retention in operator runbook (outside this repo).

## Penetration test handoff

- Provide staging with anonymized data; include `/health` and `/readiness` for scope limits.
