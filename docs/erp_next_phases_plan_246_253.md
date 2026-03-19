# ERP Platform — Next Phases Plan: 246–253

> **Produced by**: System Architect  
> **Date**: 2026-03-18  
> **Current state**: v1.89.0, Phase 245 complete (51 addons, 103+ tests)  
> **Odoo 19.0 source**: `/Users/janarkuusk/AI Power/odoo-19.0/`  
> **Methodology**: Each gap identified by comparing our `addons/` against `odoo-19.0/addons/` and `odoo-19.0/odoo/orm/`

---

## Strategic Goals for Phases 246–253

1. **Close ORM parity gaps** — implement what Odoo 19 added to the ORM that we haven't yet
2. **Extract `product` as a standalone module** — currently embedded in `sale`; every other module depends on it
3. **Add `analytic` accounting** — foundation for cost tracking across Sale, MRP, HR, Account
4. **Add `onboarding` toolbox** — setup wizard infrastructure used by many modules
5. **Add `hr_work_entry`** — payroll input foundation
6. **Add `digest` / KPI emails** — weekly KPI system used by `base_automation`
7. **Enhance `base_automation`** — extract to standalone module, wire with `digest`
8. **Add `mrp_subcontracting`** — Purchase → MRP subcontracting bridge

**Dependency order** (must be implemented in this sequence):

```
246 (ORM) → 247 (product standalone) → 248 (analytic)
                                      ↘
249 (onboarding) → 251 (digest) → 252 (base_automation)
250 (hr_work_entry) ─────────────────────────────────────→ 253 (mrp_subcontracting)
```

---

## Phase 246: ORM Parity — Odoo 19 New Features

**Goal**: Implement the ORM features that Odoo 19.0 introduced that we are currently missing.

**Odoo 19 source files to study**:
- `/Users/janarkuusk/AI Power/odoo-19.0/odoo/orm/commands.py`
- `/Users/janarkuusk/AI Power/odoo-19.0/odoo/orm/domains.py` (lines 83–155, `any!` / `not any!`)
- `/Users/janarkuusk/AI Power/odoo-19.0/odoo/orm/models.py` (lines 1383–1425, `search_fetch`)
- `/Users/janarkuusk/AI Power/odoo-19.0/odoo/release.py` (MIN_PY_VERSION = (3,10))

### 246-A: `Command` class for O2M/M2M writes

**What**: A typed `IntEnum` for constructing One2many/Many2many command tuples, replacing magic `(0,0,vals)` patterns.  
**Odoo contract** (`odoo/orm/commands.py`):
```python
class Command(IntEnum):
    CREATE = 0   # (0, 0, vals)
    UPDATE = 1   # (1, id, vals)
    DELETE = 2   # (2, id, 0)
    UNLINK = 3   # (3, id, 0)
    LINK   = 4   # (4, id, 0)
    CLEAR  = 5   # (5, 0, 0)
    SET    = 6   # (6, 0, [ids])
```

**Files to create/modify**:
- **CREATE**: `core/orm/commands.py` — `Command(IntEnum)` with class methods `create()`, `update()`, `delete()`, `unlink()`, `link()`, `clear()`, `set()`
- **MODIFY**: `core/orm/__init__.py` — export `Command`
- **CREATE**: `tests/test_orm_commands_phase246.py`

**Test DB**: `./erp-bin db init -d _test_orm_commands_246`

---

### 246-B: `any!` / `not any!` domain operators

**What**: Internal domain operators that bypass record rules on comodels. Used by Odoo's own ORM internals for security-checked queries.  
**Odoo contract** (`odoo/orm/domains.py:83`):
```python
INTERNAL_CONDITION_OPERATORS = frozenset(('any!', 'not any!'))
# 'any!' works like 'any' but bypasses record rules on the comodel
```

**Files to create/modify**:
- **MODIFY**: `core/orm/domains.py` (or `core/orm/expression.py`) — add `any!` / `not any!` to operator constants; implement bypass-access path in domain evaluation
- **MODIFY**: `tests/test_orm_domains_phase246.py`

**Security note**: `any!` / `not any!` must only be usable internally (not via RPC). Security Reviewer must approve.

---

### 246-C: `search_fetch` combined method

**What**: Single call that does `search` + `read` in one round trip.  
**Odoo contract** (`odoo/orm/models.py:1383`):
```python
def search_fetch(self, domain, field_names, offset=0, limit=None, order=None) -> Self:
    """search() + read() in one call; returns recordset with fields pre-fetched"""
```

**Files to create/modify**:
- **MODIFY**: `core/orm/models.py` — add `search_fetch(domain, field_names, offset, limit, order)` method to `Recordset`
- **MODIFY**: `tests/test_orm_commands_phase246.py` — add `search_fetch` tests

---

### 246-D: Python version bump

**What**: Update `MIN_PY_VERSION` to `(3, 10)` to match Odoo 19.0.  
**Odoo contract**: `odoo/release.py: MIN_PY_VERSION = (3, 10)`

**Files to modify**:
- **MODIFY**: `core/release.py` — `MIN_PY_VERSION = (3, 10)` (was `(3, 9)`)
- **MODIFY**: `pyproject.toml` — `python_requires = ">=3.10"`

**Risk**: Run existing tests to confirm no 3.9-only syntax is in use.

---

## Phase 247: `product` — Standalone Module

**Goal**: Extract product management from `sale` into a proper standalone `product` module matching Odoo 19's `addons/product/`.

**Odoo 19 source**: `/Users/janarkuusk/AI Power/odoo-19.0/addons/product/`  
**Odoo models**: `product.template`, `product.product`, `product.category`, `product.pricelist`, `product.pricelist.item`, `product.attribute`, `product.attribute.value`, `product.supplierinfo`, `product.tag`  
**Depends**: `base`, `mail`, `uom`

**Why now**: `analytic`, `mrp_subcontracting`, `purchase`, and many bridge modules import `product.template` / `product.product`. Currently those live in `sale`, which creates a wrong dependency direction. This is the most structurally important gap.

### Files to create

```
addons/product/
├── __manifest__.py     depends: [base, mail, uom]
├── __init__.py
├── models/
│   ├── __init__.py
│   ├── product_template.py     _name="product.template"
│   ├── product_product.py      _name="product.product"  (variant)
│   ├── product_category.py     _name="product.category"
│   ├── product_pricelist.py    _name="product.pricelist"
│   ├── product_attribute.py    _name="product.attribute"
│   └── product_supplierinfo.py _name="product.supplierinfo"
└── security/
    └── ir.model.access.csv
```

### Files to modify

- **MODIFY**: `addons/sale/__manifest__.py` — add `product` to depends; remove product model definitions from `addons/sale/models/product_template.py` (or make it a `_inherit` extension)
- **MODIFY**: `addons/sale/models/product_template.py` — change from full definition to `_inherit = "product.template"` extension (add only sale-specific fields)
- **MODIFY**: `core/tools/config.py` — add `product` to `DEFAULT_SERVER_WIDE_MODULES`
- **MODIFY**: `core/db/init_data.py` — move product seeding to use the new module's models

### Key models (MVP scope — full details in Odoo source)

| Model | Fields (MVP) |
|-------|-------------|
| `product.template` | name, type, list_price, standard_price, categ_id, uom_id, description, active, image_1920 |
| `product.product` | product_tmpl_id (M2o), default_code, barcode, active |
| `product.category` | name, parent_id, property_account_income_categ_id |
| `product.pricelist` | name, currency_id, item_ids |
| `product.attribute` | name, value_ids |
| `product.supplierinfo` | partner_id, product_tmpl_id, price, min_qty |

### Test DB
`./erp-bin db init -d _test_product_247`  
**Test file**: `tests/test_product_phase247.py`

---

## Phase 248: `analytic` — Analytic Accounting

**Goal**: Implement analytic accounts, plans, and lines matching Odoo 19's `addons/analytic/`.

**Odoo 19 source**: `/Users/janarkuusk/AI Power/odoo-19.0/addons/analytic/`  
**Depends**: `base`, `mail`, `uom`  
**Odoo models**:
- `account.analytic.account` — cost center / project bucket
- `account.analytic.line` — individual cost entry
- `account.analytic.plan` — plan hierarchy (new in Odoo 16+)
- `account.analytic.applicability` — rules for which plans apply to which documents
- `analytic.mixin` — abstract mixin for adding `analytic_distribution` to any model

### Files to create

```
addons/analytic/
├── __manifest__.py     depends: [base, mail, uom]
├── __init__.py
├── models/
│   ├── __init__.py
│   ├── analytic_account.py          _name="account.analytic.account"
│   ├── analytic_line.py             _name="account.analytic.line"
│   ├── analytic_plan.py             _name="account.analytic.plan"
│   ├── analytic_distribution_model.py  _name="account.analytic.distribution.model"
│   └── analytic_mixin.py            _name="analytic.mixin" (AbstractModel)
└── security/
    └── ir.model.access.csv
```

### Key fields (MVP)

| Model | Fields |
|-------|--------|
| `account.analytic.account` | name, plan_id, code, partner_id, active, balance (computed) |
| `account.analytic.line` | name, account_id, date, amount, unit_amount, product_id, employee_id |
| `account.analytic.plan` | name, parent_id, color, applicability_ids |

### Files to modify
- **MODIFY**: `core/tools/config.py` — add `analytic` to `DEFAULT_SERVER_WIDE_MODULES`

### Test DB
`./erp-bin db init -d _test_analytic_248`  
**Test file**: `tests/test_analytic_phase248.py`

---

## Phase 249: `onboarding` — Setup Wizard Toolbox

**Goal**: Implement the onboarding progress tracking system used by Sale, Account, Website, and many other modules for their setup wizards.

**Odoo 19 source**: `/Users/janarkuusk/AI Power/odoo-19.0/addons/onboarding/`  
**Depends**: `web` only  
**Odoo models**:
- `onboarding.onboarding` — a named setup flow
- `onboarding.onboarding.step` — a single step in a flow
- `onboarding.progress` — user/company progress record
- `onboarding.progress.step` — step completion status

### Files to create

```
addons/onboarding/
├── __manifest__.py     depends: [web]
├── __init__.py
├── models/
│   ├── __init__.py
│   ├── onboarding_onboarding.py     _name="onboarding.onboarding"
│   ├── onboarding_step.py           _name="onboarding.onboarding.step"
│   ├── onboarding_progress.py       _name="onboarding.progress"
│   └── onboarding_progress_step.py  _name="onboarding.progress.step"
└── security/
    └── ir.model.access.csv
```

### Key fields

| Model | Fields |
|-------|--------|
| `onboarding.onboarding` | name, route_name, sequence, step_ids, is_per_company |
| `onboarding.onboarding.step` | title, description, done_icon, panel_step_open_action_name, onboarding_id |
| `onboarding.progress` | onboarding_id, company_id, is_onboarding_closed, progress_step_ids |
| `onboarding.progress.step` | step_id, progress_id, state (not_started/in_progress/done) |

### Files to modify
- **MODIFY**: `core/tools/config.py` — add `onboarding` to `DEFAULT_SERVER_WIDE_MODULES`

### Test DB
`./erp-bin db init -d _test_onboarding_249`  
**Test file**: `tests/test_onboarding_phase249.py`

---

## Phase 250: `hr_work_entry` — HR Work Entries

**Goal**: Implement work entry tracking as foundation for payroll input computation.

**Odoo 19 source**: `/Users/janarkuusk/AI Power/odoo-19.0/addons/hr_work_entry/`  
**Depends**: `hr`  
**Odoo models**:
- `hr.work.entry` — a timed work entry for an employee
- `hr.work.entry.type` — type classification (attendance, sick leave, overtime, etc.)

### Files to create

```
addons/hr_work_entry/
├── __manifest__.py     depends: [hr]
├── __init__.py
├── models/
│   ├── __init__.py
│   ├── hr_work_entry.py      _name="hr.work.entry"
│   ├── hr_work_entry_type.py _name="hr.work.entry.type"
│   └── hr_employee.py        _inherit="hr.employee" (add work_entry_source)
└── security/
    └── ir.model.access.csv
```

### Key fields

| Model | Fields |
|-------|--------|
| `hr.work.entry.type` | name, code, color, leave_id, is_leave, is_unforeseen, active |
| `hr.work.entry` | name, employee_id, work_entry_type_id, date_start, date_stop, duration, state (draft/validated/conflict/cancelled) |

### Files to modify
- **MODIFY**: `core/tools/config.py` — add `hr_work_entry` to `DEFAULT_SERVER_WIDE_MODULES`
- **MODIFY**: `addons/hr_holidays/__manifest__.py` — add dependency on `hr_work_entry`

### Test DB
`./erp-bin db init -d _test_hr_work_entry_250`  
**Test file**: `tests/test_hr_work_entry_phase250.py`

---

## Phase 251: `digest` — KPI Email Digests

**Goal**: Implement the weekly KPI email digest system.

**Odoo 19 source**: `/Users/janarkuusk/AI Power/odoo-19.0/addons/digest/`  
**Depends**: `mail`, `portal`, `resource`  
**Odoo models**:
- `digest.digest` — a periodic KPI digest configuration
- `digest.tip` — helpful tips sent with digests

### Files to create

```
addons/digest/
├── __manifest__.py     depends: [mail, portal, resource]
├── __init__.py
├── models/
│   ├── __init__.py
│   ├── digest.py        _name="digest.digest"
│   ├── digest_tip.py    _name="digest.tip"
│   └── res_users.py     _inherit="res.users" (add digest_ids)
└── security/
    └── ir.model.access.csv
```

### Key fields

| Model | Fields |
|-------|--------|
| `digest.digest` | name, periodicity (daily/weekly/monthly), next_run_date, user_ids, kpi_* (computed fields), company_id |
| `digest.tip` | name, tip_description, group_id |

### Cron
- Daily cron in `core/db/init_data.py` or via data file: call `digest.digest._action_send_digest()`

### Files to modify
- **MODIFY**: `core/tools/config.py` — add `digest` to `DEFAULT_SERVER_WIDE_MODULES`

### Test DB
`./erp-bin db init -d _test_digest_251`  
**Test file**: `tests/test_digest_phase251.py`

---

## Phase 252: `base_automation` — Extract and Enhance

**Goal**: Extract our existing `base.automation` from `addons/base/models/base_automation.py` into a proper standalone `base_automation` module, matching Odoo 19's `addons/base_automation/`. Add `digest` integration.

**Odoo 19 source**: `/Users/janarkuusk/AI Power/odoo-19.0/addons/base_automation/`  
**Depends**: `base`, `digest`, `resource`, `mail`, `sms`  
**Current state**: We have `base.automation` model in `addons/base/models/base_automation.py`

### Migration approach
1. Create new `addons/base_automation/` addon
2. Move `base.automation` model there (change from `_name` in `base` to standalone)
3. Add `digest.data.xml` integration for automation statistics
4. Remove from `addons/base/models/base_automation.py` (make it import from new location)

### Files to create

```
addons/base_automation/
├── __manifest__.py     depends: [base, digest, resource, mail]
├── __init__.py
├── models/
│   ├── __init__.py
│   └── base_automation.py   _name="base.automation" (moved from addons/base/)
└── security/
    └── ir.model.access.csv
```

### Files to modify
- **MODIFY**: `addons/base/models/base_automation.py` — remove model definition (or keep as backward-compat import)
- **MODIFY**: `addons/base/__manifest__.py` — remove base_automation from data, depends now on base_automation module
- **MODIFY**: `core/tools/config.py` — add `base_automation` to `DEFAULT_SERVER_WIDE_MODULES`

### Test DB
`./erp-bin db init -d _test_base_automation_252`  
**Test file**: `tests/test_base_automation_phase252.py`

---

## Phase 253: `mrp_subcontracting` — MRP Subcontracting Bridge

**Goal**: Add subcontracting support — purchase orders can trigger manufacturing at a vendor location.

**Odoo 19 source**: `/Users/janarkuusk/AI Power/odoo-19.0/addons/mrp_subcontracting/`  
**Depends**: `mrp` (and implicitly `purchase_stock`)  
**Odoo models** (all `_inherit`):
- `mrp.bom` — add `type = 'subcontracting'`, `subcontractor_ids`
- `mrp.production` — add `subcontracting_type`, `picking_ids`
- `stock.move` — add `is_subcontract` flag
- `stock.picking` — add subcontracting display fields
- `stock.quant` — subcontracting location handling
- `stock.warehouse` — add `subcontracting_location_id`
- `res.partner` — add `property_stock_subcontractor`

### Files to create

```
addons/mrp_subcontracting/
├── __manifest__.py     depends: [mrp]
├── __init__.py
├── models/
│   ├── __init__.py
│   ├── mrp_bom.py           _inherit="mrp.bom"  (add subcontracting type)
│   ├── mrp_production.py    _inherit="mrp.production"
│   ├── stock_move.py        _inherit="stock.move" (is_subcontract flag)
│   ├── stock_warehouse.py   _inherit="stock.warehouse" (subcontracting_location_id)
│   └── res_partner.py       _inherit="res.partner" (subcontractor location property)
└── security/
    └── ir.model.access.csv
```

### Key logic
- When a PO line has a product with BOM type `subcontracting`, a manufacturing order is automatically created at the vendor's location
- `stock.move` with `is_subcontract=True` triggers MO completion on receipt

### Files to modify
- **MODIFY**: `core/tools/config.py` — add `mrp_subcontracting` to `DEFAULT_SERVER_WIDE_MODULES`
- **MODIFY**: `addons/mrp_account/__manifest__.py` — add optional dependency on `mrp_subcontracting`

### Test DB
`./erp-bin db init -d _test_mrp_subcontracting_253`  
**Test file**: `tests/test_mrp_subcontracting_phase253.py`

---

## Summary Table

| Phase | Module | Depends on | Priority | Estimated effort |
|-------|--------|-----------|----------|-----------------|
| 246-A | ORM: `Command` class | core | HIGH | Small |
| 246-B | ORM: `any!`/`not any!` | core | HIGH | Medium (security review required) |
| 246-C | ORM: `search_fetch` | core | MEDIUM | Small |
| 246-D | Python 3.10 min version | core | MEDIUM | Trivial |
| 247 | `product` standalone | uom, mail | HIGH | Large (refactor from sale) |
| 248 | `analytic` | base, mail, uom | HIGH | Medium |
| 249 | `onboarding` | web | MEDIUM | Small |
| 250 | `hr_work_entry` | hr | HIGH | Medium |
| 251 | `digest` | mail, portal, resource | MEDIUM | Medium |
| 252 | `base_automation` standalone | base, digest, resource | MEDIUM | Medium (migration) |
| 253 | `mrp_subcontracting` | mrp | MEDIUM | Large |

## Parity Matrix Updates After These Phases

After completion, add to `docs/parity_matrix.md`:

| Feature | Odoo Reference | Our Implementation | Status |
|---------|---------------|-------------------|--------|
| Command class | `odoo/orm/commands.py` | `core/orm/commands.py` | done |
| `any!`/`not any!` operators | `odoo/orm/domains.py` | `core/orm/domains.py` | done |
| `search_fetch` | `odoo/orm/models.py:1383` | `core/orm/models.py` | done |
| Standalone product module | `addons/product/` | `addons/product/` | done |
| Analytic accounting | `addons/analytic/` | `addons/analytic/` | done |
| Onboarding toolbox | `addons/onboarding/` | `addons/onboarding/` | done |
| HR Work Entries | `addons/hr_work_entry/` | `addons/hr_work_entry/` | done |
| KPI Digest | `addons/digest/` | `addons/digest/` | done |
| base_automation standalone | `addons/base_automation/` | `addons/base_automation/` | done |
| MRP Subcontracting | `addons/mrp_subcontracting/` | `addons/mrp_subcontracting/` | done |

## Version Target

Upon completing all 8 phases:
- Bump `core/release.py` to `version_info = (1, 90, 0, "final", 0, "")`
- Total addons: ~60 (from 51)
- Parity coverage: significantly improved on business modules and ORM

## Notes for Feature Developer

1. **Phase 247 is the riskiest** — moving `product.template` out of `sale` will break imports. Do it incrementally: create `addons/product/` first, then change `sale` to `_inherit`.
2. **Phase 246-B requires Security Reviewer** before merging — `any!` bypasses record rules.
3. **Phase 252** involves moving existing code — run the full test suite before and after.
4. Always reference the Odoo 19.0 source at `/Users/janarkuusk/AI Power/odoo-19.0/addons/<name>/` before implementing each phase.
