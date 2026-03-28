# Sale module: Odoo 19 CE vs ERP gap audit

**Reference:** `odoo-19.0/addons/sale/` (read-only). **ERP:** `erp-platform/addons/sale/`.

## ERP inventory

| Area | Files |
|------|--------|
| Orders / lines | `models/sale_order.py`, `models/sale_order_line.py` |
| Product bridge | `models/product_template.py` |
| Reporting stub | `models/sale_report.py` |

## Gap table (behavioural)

| Theme | Odoo-style expectation | ERP today | Direction |
|-------|------------------------|-----------|-----------|
| Order lifecycle | Quotation → SO → delivery/invoice hooks; `action_confirm` chain with stock/account bridges | Confirm path implemented with bridge modules (`sale_stock`, `sale_purchase`, etc.) per phases | Extend with tests per slice; see `tests/` sale-* |
| Pricing / discounts | Pricelist rules, optional advanced pricing | Subset on `sale.order` / lines | Parity when product prioritises |
| Sales teams / UTM | `crm.team`, campaign medium/source | May live in `sales_team` / `utm` addons | Cross-addon audit |
| Portal / eCommerce | `website_sale` flows | Scaffold / separate addons | Deferred |
| Security | Record rules on orders / companies | `security/ir.model.access.csv` + rules in `sale` / `base` | Align with multi-company track |

## Related tests

- Search `tests/` for `sale_order`, `action_confirm`, `sale`.

## Parity matrix

See sale-related rows in [parity_matrix.md](parity_matrix.md).
