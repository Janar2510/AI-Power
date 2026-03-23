from core.orm import Model, fields


class ResPartner(Model):
    _inherit = "res.partner"

    website_last_seen = fields.Datetime(string="Website Last Seen")
    website_page_views = fields.Integer(string="Website Page Views", default=0)

    @classmethod
    def track_page_view(cls, partner_id, env=None):
        rec = cls.browse(int(partner_id))
        if not rec or not rec.id:
            return False
        rows = rec.read(["website_page_views"])
        current = (rows[0] or {}).get("website_page_views") if rows else 0
        rec.write({"website_page_views": int(current or 0) + 1})
        return True
