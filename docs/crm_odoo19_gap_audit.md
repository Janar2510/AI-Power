# CRM module: Odoo 19 CE vs ERP gap audit

**Reference:** `odoo-19.0/addons/crm/` (read-only). **ERP:** `erp-platform/addons/crm/`.

## ERP inventory

| Area | Files |
|------|--------|
| Leads / opportunities | `models/crm_lead.py` |
| Configuration | `models/crm_stage.py`, `models/crm_tag.py`, `models/crm_lost_reason.py` |
| Activities | `models/crm_activity.py` |

## Gap table (behavioural)

| Theme | Odoo-style expectation | ERP today | Direction |
|-------|------------------------|-----------|-----------|
| Pipeline / stages | Stage probability, fold, team | Stages + tags + lost reasons | Compare `crm.lead` state fields to upstream |
| Lead → opportunity | Type conversion, assignment | Subset in `crm_lead` | Test-driven extensions |
| Activities / mail | `mail.activity` integration | `crm_activity` + mail addon | Full mail thread parity deferred |
| PLM / marketing bridges | `crm_iap_*`, mass mailing | Bridge addons when installed | Inventory in `parity_matrix` |
| Web routes | `pipeline`, `leads`, `crm/activities` | `main.js` / `DATA_ROUTES_SLUGS` + menu actions | [odoo19-webclient-gap-table.md](odoo19-webclient-gap-table.md) |

## Related tests

- `tests/test_main_js_route_consistency_phase631.py`, CRM view/menu tests.

## Parity matrix

See CRM rows in [parity_matrix.md](parity_matrix.md).
