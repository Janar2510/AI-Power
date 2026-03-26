"""Inter-company SO -> PO bridge (Phase 432)."""

from core.orm import Model, fields


class InterCompanyRule(Model):
    _name = "inter.company.rule"
    _description = "Inter-Company Rule"

    name = fields.Char(required=True, string="Name")
    source_company_id = fields.Many2one("res.company", string="Source Company")
    target_company_id = fields.Many2one("res.company", string="Target Company")
    auto_create_po = fields.Boolean(string="Auto Create PO", default=True)
    active = fields.Boolean(string="Active", default=True)


class SaleOrderInterCompany(Model):
    _inherit = "sale.order"

    @classmethod
    def create(cls, vals):
        # Phase 478 / 674: registry merge replaces create on sale.order; use
        # _create_sale_order_record (not super().create) for merge-safe stacking.
        rec = cls._create_sale_order_record(vals)
        try:
            env = rec.env
            Partner = env.get("res.partner")
            Purchase = env.get("purchase.order")
            Rule = env.get("inter.company.rule")
            if not (Partner and Purchase and Rule):
                return rec
            partner_id = vals.get("partner_id")
            if not partner_id:
                return rec
            prow = Partner.read_ids([partner_id], ["company_id"])
            partner_company_id = prow[0].get("company_id") if prow else None
            if not partner_company_id:
                return rec
            # Rule lookup (source current company -> target partner company)
            current_company_id = None
            user = env.get("res.users")
            if user and getattr(env, "uid", None):
                ur = user.read_ids([env.uid], ["company_id"])
                current_company_id = ur[0].get("company_id") if ur else None
            rules = Rule.search_read(
                [
                    ("active", "=", True),
                    ("source_company_id", "=", current_company_id),
                    ("target_company_id", "=", partner_company_id),
                    ("auto_create_po", "=", True),
                ],
                ["id"],
                limit=1,
            )
            if not rules:
                return rec
            Purchase.create(
                {
                    "name": f"PO/{vals.get('name') or rec.id}",
                    "partner_id": partner_id,
                    "origin": vals.get("name") or rec.id,
                    "state": "draft",
                }
            )
        except Exception:
            pass
        return rec
