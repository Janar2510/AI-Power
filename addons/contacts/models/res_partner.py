from core.orm import Model, fields


class ResPartner(Model):
    _inherit = "res.partner"

    contact_rank = fields.Integer(string="Contact Rank", default=0)

    @classmethod
    def create(cls, vals):
        vals = dict(vals or {})
        vals["contact_rank"] = int(vals.get("contact_rank") or 0) + 1
        return cls._create_res_partner_record(vals)
