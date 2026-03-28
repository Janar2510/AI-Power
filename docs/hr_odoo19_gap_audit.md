# HR module: Odoo 19 CE vs ERP gap audit

**Reference:** `odoo-19.0/addons/hr/` and related HR apps (read-only). **ERP:** `erp-platform/addons/hr/` + promoted app menus (Expenses, Attendance, etc.).

## ERP inventory (`addons/hr`)

| Area | Files |
|------|--------|
| Master data | `models/hr_employee.py`, `models/hr_department.py`, `models/hr_job.py` |
| Leave | `models/hr_leave.py`, `models/hr_leave_type.py`, `models/hr_leave_allocation.py` |
| Contract | `models/hr_contract.py` |

## Gap table (behavioural)

| Theme | Odoo-style expectation | ERP today | Direction |
|-------|------------------------|-----------|-----------|
| Employee / contract | Contracts, departments, managers | Core models present | Field-level diff vs Odoo when needed |
| Leave workflow | Draft → confirm → validate; accruals | Leave + allocation models | UTC / calendar edge cases (see recent attendance fixes) |
| Attendance / kiosk | `hr_attendance` separate app | `hr_attendance` addon + routes | Menu/routing parity with [missing apps tests](ai-implementation-checklist.md) |
| Payroll hooks | Often separate / l10n | Not in scope for this audit | Deferred |
| Skills / recruitment | `hr_skills`, `hr_recruitment` | Scaffold modules | Phases 284+ checklist |

## Related tests

- `tests/test_missing_apps_parity_phase408.py`, HR-related unit tests.

## Parity matrix

See HR phases in [parity_matrix.md](parity_matrix.md).
