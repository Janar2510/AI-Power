from core.orm import Model, fields


class SaleOrder(Model):
    _inherit = "sale.order"

    website_session_id = fields.Char(string="Website Session")
    is_website_order = fields.Boolean(string="Website Order", default=False)

    @classmethod
    def create_from_website(cls, vals, env=None):
        vals = dict(vals or {})
        vals.setdefault("is_website_order", True)
        return cls.create(vals)
