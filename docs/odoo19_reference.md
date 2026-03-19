# Odoo 19.0 Reference for Gap Analysis

> **Source**: `/Users/janarkuusk/AI Power/odoo-19.0/` (local checkout, branch 19.0)
> **Version**: `(19, 0, 0, 'final', 0, '')` — see `odoo/release.py`
> **Python**: 3.10–3.13 required (we target 3.9+, needs attention)
> **PostgreSQL**: 13+ (matches ours)
> **License**: LGPL-3

---

## ORM Source Layout

The Odoo 19.0 ORM is split into multiple files under `odoo/orm/`:

| File | Contents |
|------|----------|
| `models.py` | `MetaModel`, `BaseModel`, `Model`, `AbstractModel`, `TransientModel` |
| `fields.py` | `Field` base class |
| `fields_binary.py` | `Binary`, `Image` |
| `fields_misc.py` | `Id`, `Many2oneReference`, `Reference`, `Properties`, `PropertiesDefinition`, `Html` |
| `fields_numeric.py` | `Integer`, `Float`, `Monetary` |
| `fields_properties.py` | Properties serialization helpers |
| `fields_reference.py` | `Reference` field logic |
| `fields_relational.py` | `Many2one`, `One2many`, `Many2many` |
| `fields_selection.py` | `Selection` |
| `fields_temporal.py` | `Date`, `Datetime` |
| `fields_textual.py` | `Char`, `Text`, `Json` |
| `decorators.py` | `@constrains`, `@depends`, `@onchange`, `@ondelete`, `@autovacuum`, `@model_create_multi`, `@model`, `@private`, `@readonly` |
| `environments.py` | `Environment`, `Environments` |
| `domains.py` | Domain tools, `any!` / `not any!` operators (new in 19) |
| `registry.py` | Module registry, model class merge |
| `commands.py` | `Command` class for O2M/M2M write commands |
| `identifiers.py` | `NewId`, `IdType` |
| `model_classes.py` | `AbstractModel`, `TransientModel` base classes |
| `table_objects.py` | SQL table helpers |
| `types.py` | Typed aliases (`BaseModel`, `ValuesType`, `DomainType`) |
| `utils.py` | ORM utilities |

### Key ORM Methods (BaseModel)

**Recordset operations** (all implemented in our Phase 234):
- `mapped(func)` — field path or callable → list or recordset
- `filtered(func)` — callable or domain
- `filtered_domain(domain)` — domain-only filter
- `grouped(key)` — group into dict by key
- `sorted(key, reverse)` — sort recordset
- `concat(*args)` — concatenate recordsets
- `union(*args)` — deduplicated union
- `ensure_one()` — assert exactly one record

**CRUD**:
- `search(domain, offset, limit, order)` → recordset
- `search_fetch(domain, field_names, offset, limit, order)` → recordset
- `search_count(domain, limit)` → int
- `create(vals_list)` → recordset
- `write(vals)` → bool
- `unlink()` → bool
- `read(fields)` → list[dict]
- `read_group(domain, fields, groupby, ...)` → list[dict]
- `_read_group(domain, groupby, aggregates, ...)` → rows (19.0 new style)
- `_read_grouping_sets(...)` → GROUPING SETS support (new in 19)
- `name_create(name)` → (id, display_name)
- `name_search(name, args, operator, limit)` → list
- `default_get(fields)` → dict
- `export_data(fields_to_export)` → dict
- `load(fields, data)` → dict

**Context/environment switching**:
- `with_env(env)`, `sudo(flag)`, `with_user(user)`, `with_company(company)`, `with_context(**kw)`, `with_prefetch(ids)`

**Cache/compute**:
- `flush_model(fnames)`, `flush_recordset(fnames)`, `invalidate_model(fnames)`, `invalidate_recordset(fnames)`, `modified(fnames)`

### New in Odoo 19 vs 18

| Change | Details |
|--------|---------|
| `any!` / `not any!` domain operators | New domain operators for relational fields |
| `_read_grouping_sets` | GROUPING SETS support in pivot views |
| `_read_group` unified | Single method replacing old read_group semantics |
| `search_fetch` | Combined search+read for performance |
| Dynamic dates in domains | Date expressions in domain literals |
| `record._cr`, `record._uid`, `record._context` deprecated | Use `self.env.cr`, `self.env.uid`, `self.env.context` |
| `odoo.osv` deprecated | Use `odoo.orm` |
| Python 3.10 minimum | Was 3.8/3.9 in older versions |
| ORM query optimization | Up to 40% fewer round-trips |
| `stock.valuation.layer` removed | Inventory valuation now on `stock.move` directly |

---

## Odoo 19.0 Addons — 611 Total

### Core (always-installed)
Located in `odoo/addons/`: `base`, `web`

### Odoo 19 addons by category

#### Accounting & Finance
`account`, `account_add_gln`, `account_check_printing`, `account_debit_note`, `account_edi`, `account_edi_proxy_client`, `account_edi_ubl_cii`, `account_fleet`, `account_payment`, `account_peppol`, `account_peppol_advanced_fields`, `account_qr_code_emv`, `account_qr_code_sepa`, `account_tax_python`, `account_update_tax_tags`, `analytic`, `snailmail_account`

#### Sales & CRM
`sale`, `sale_crm`, `sale_edi_ubl`, `sale_expense`, `sale_expense_margin`, `sale_loyalty`, `sale_loyalty_delivery`, `sale_management`, `sale_margin`, `sale_mrp`, `sale_mrp_margin`, `sale_pdf_quote_builder`, `sale_product_matrix`, `sale_project`, `sale_purchase`, `sale_purchase_project`, `sale_purchase_stock`, `sale_service`, `sale_sms`, `sale_stock`, `sale_stock_margin`, `sale_stock_product_expiry`, `sale_subscription` (via sale_service), `sale_timesheet`, `sale_timesheet_margin`, `sales_team`, `crm`, `crm_iap_enrich`, `crm_iap_mine`, `crm_livechat`, `crm_mail_plugin`, `crm_sms`

#### Inventory & Stock
`stock`, `stock_account`, `stock_delivery`, `stock_dropshipping`, `stock_fleet`, `stock_landed_costs`, `stock_maintenance`, `stock_picking_batch`, `stock_sms`

#### Purchase
`purchase`, `purchase_edi_ubl_bis3`, `purchase_mrp`, `purchase_product_matrix`, `purchase_repair`, `purchase_requisition`, `purchase_requisition_sale`, `purchase_requisition_stock`, `purchase_stock`

#### Manufacturing
`mrp`, `mrp_account`, `mrp_landed_costs`, `mrp_product_expiry`, `mrp_repair`, `mrp_subcontracting`, `mrp_subcontracting_account`, `mrp_subcontracting_dropshipping`, `mrp_subcontracting_landed_costs`, `mrp_subcontracting_purchase`, `mrp_subcontracting_repair`

#### HR & Payroll
`hr`, `hr_attendance`, `hr_calendar`, `hr_expense`, `hr_fleet`, `hr_gamification`, `hr_holidays`, `hr_holidays_attendance`, `hr_holidays_homeworking`, `hr_homeworking`, `hr_homeworking_calendar`, `hr_hourly_cost`, `hr_livechat`, `hr_maintenance`, `hr_org_chart`, `hr_presence`, `hr_recruitment`, `hr_recruitment_skills`, `hr_recruitment_sms`, `hr_recruitment_survey`, `hr_skills`, `hr_skills_event`, `hr_skills_slides`, `hr_skills_survey`, `hr_timesheet`, `hr_timesheet_attendance`, `hr_work_entry`, `hr_work_entry_holidays`

#### Project & Timesheets
`project`, `project_account`, `project_hr_expense`, `project_hr_skills`, `project_mail_plugin`, `project_mrp`, `project_mrp_account`, `project_mrp_sale`, `project_mrp_stock_landed_costs`, `project_purchase`, `project_purchase_stock`, `project_sale_expense`, `project_sms`, `project_stock`, `project_stock_account`, `project_stock_landed_costs`, `project_timesheet_holidays`, `project_todo`

#### Point of Sale
`point_of_sale`, `pos_account_tax_python`, `pos_adyen`, `pos_discount`, `pos_event`, `pos_event_sale`, `pos_hr`, `pos_hr_restaurant`, `pos_loyalty`, `pos_mrp`, `pos_online_payment`, `pos_restaurant`, `pos_restaurant_adyen`, `pos_restaurant_loyalty`, `pos_sale`, `pos_sale_loyalty`, `pos_sale_margin`, `pos_self_order`, `pos_sms`, `pos_stripe`

#### Payments
`payment`, `payment_adyen`, `payment_authorize`, `payment_custom`, `payment_demo`, `payment_mollie`, `payment_paypal`, `payment_razorpay`, `payment_stripe`, and 10+ more providers

#### Website & eCommerce
`website`, `website_blog`, `website_crm`, `website_event`, `website_event_sale`, `website_forum`, `website_links`, `website_livechat`, `website_mail`, `website_payment`, `website_sale`, `website_sale_loyalty`, `website_sale_stock`, `website_sale_wishlist`, `website_slides`, and 30+ more

#### Communication
`mail`, `mail_bot`, `mail_bot_hr`, `mail_group`, `mail_plugin`, `mass_mailing`, `mass_mailing_crm`, `mass_mailing_event`, `mass_mailing_sale`, `mass_mailing_sms`, `mass_mailing_themes`, `sms`, `sms_twilio`, `snailmail`, `im_livechat`

#### Events & Surveys
`event`, `event_booth`, `event_booth_sale`, `event_crm`, `event_sale`, `survey`, `survey_crm`

#### Other Business Modules
`calendar`, `contacts`, `delivery`, `digest`, `fleet`, `gamification`, `loyalty`, `lunch`, `maintenance`, `marketing_card`, `onboarding`, `portal`, `portal_rating`, `product`, `rating`, `repair`, `resource`, `resource_mail`, `uom`, `utm`

#### Infrastructure & Base
`analytic`, `auth_ldap`, `auth_oauth`, `auth_passkey`, `auth_password_policy`, `auth_signup`, `auth_timeout`, `auth_totp`, `auth_totp_mail`, `auth_totp_portal`, `barcodes`, `barcodes_gs1_nomenclature`, `base_automation`, `base_geolocalize`, `base_iban`, `base_import`, `base_import_module`, `base_install_request`, `base_setup`, `base_sparse_field`, `base_vat`, `board`, `bus`, `certificate`, `cloud_storage`, `data_recycle`, `iap`, `link_tracker`, `partner_autocomplete`, `phone_validation`, `privacy_lookup`, `rpc`, `web_hierarchy`, `web_tour`, `web_unsplash`

#### Localisations (l10n_*)
50+ country localisations (`l10n_ae`, `l10n_ar`, `l10n_be`, `l10n_de`, `l10n_fr`, `l10n_in`, `l10n_uk`, `l10n_us`, etc.)

---

## Gap Analysis: Our Platform vs Odoo 19.0

### Our ERP Platform (51 addons)
`account`, `ai_assistant`, `auth_totp`, `base`, `base_import`, `bus`, `calendar`, `contacts`, `crm`, `delivery`, `demo_module`, `event`, `fetchmail`, `fleet`, `helpdesk`, `hr`, `hr_attendance`, `hr_contract`, `hr_expense`, `hr_holidays`, `hr_payroll`, `hr_recruitment`, `hr_skills`, `hr_timesheet`, `knowledge`, `loyalty`, `mail`, `mailing`, `maintenance`, `mrp`, `mrp_account`, `my_module`, `payment`, `portal`, `pos`, `project`, `purchase`, `purchase_stock`, `quality`, `rating`, `repair`, `resource`, `sale`, `sale_stock`, `sale_subscription`, `stock`, `stock_account`, `stock_barcode`, `survey`, `uom`, `web`, `website`, `website_sale`

### High-Priority Gaps (Phase 246+ candidates)

| Gap | Odoo Module | Priority | Notes |
|-----|-------------|----------|-------|
| Product module standalone | `product` | HIGH | Currently embedded in `sale`; Odoo has `product` as its own module |
| Analytic accounting | `analytic` | HIGH | Needed for cost tracking across Sale/MRP/HR |
| Onboarding | `onboarding` | HIGH | Onboarding wizard infrastructure |
| Base automation (full) | `base_automation` | HIGH | Automated actions on model events |
| MRP subcontracting | `mrp_subcontracting` | MEDIUM | Purchase → MRP bridge |
| Project + sale bridge | `sale_project` | MEDIUM | Links SO lines to project tasks |
| Digest / KPI emails | `digest` | MEDIUM | Weekly KPI summary emails |
| HR Work Entries | `hr_work_entry` | MEDIUM | Work entry for payroll input |
| Portal rating | `portal_rating` | MEDIUM | Customer ratings on portal |
| Barcode GS1 | `barcodes_gs1_nomenclature` | LOW | Extended barcode format |
| Data recycle | `data_recycle` | LOW | Archive/delete old records |
| Privacy lookup | `privacy_lookup` | LOW | GDPR right to erasure |
| Cloud storage | `cloud_storage` | LOW | Azure/GCP file attachment backend |
| IAP | `iap` | LOW | In-App Purchase credits |
| Lunch | `lunch` | LOW | Employee lunch ordering |

### Python Version Gap
- **Odoo 19.0 requires**: Python 3.10–3.13
- **Our platform targets**: Python 3.9+
- **Action needed**: Bump `MIN_PY_VERSION` to `(3, 10)` in `core/release.py`, test compatibility

### New ORM Features to Implement
| Feature | Odoo 19 Source | Our Status |
|---------|---------------|------------|
| `any!` / `not any!` domain operators | `odoo/orm/domains.py` | todo |
| `_read_grouping_sets` (GROUPING SETS) | `odoo/orm/models.py:1600` | todo |
| `search_fetch` combined method | `odoo/orm/models.py:1383` | todo |
| Dynamic dates in domains | `odoo/orm/domains.py` | todo |
| `Command` class for O2M writes | `odoo/orm/commands.py` | todo |

---

## How to Explore Odoo 19.0 Source

From any agent, to look up how Odoo implements something:

```
Source root: /Users/janarkuusk/AI Power/odoo-19.0/

ORM:          odoo/orm/models.py          (7100+ lines)
Fields:       odoo/orm/fields*.py
Decorators:   odoo/orm/decorators.py
Domains:      odoo/orm/domains.py
Environment:  odoo/orm/environments.py
HTTP:         odoo/http.py
SQL:          odoo/sql_db.py
Config:       odoo/tools/config.py
Release:      odoo/release.py

Core addons:  addons/base/, addons/web/, addons/mail/
Business:     addons/sale/, addons/stock/, addons/account/ ...
```

To compare an Odoo feature with our implementation:
1. Read the Odoo source file
2. Read the matching file in `erp-platform/core/` or `erp-platform/addons/`
3. Note differences → these become phase tasks
