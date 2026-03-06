"""Partner (Contact) model."""

from core.orm import Model, fields


class ResPartner(Model):
    _name = "res.partner"
    _description = "Contact"

    name = fields.Char(required=True)
    is_company = fields.Boolean(default=False, string="Is a Company")
    type = fields.Selection(
        [("contact", "Contact"), ("address", "Address")],
        string="Address Type",
        default="contact",
    )
    email = fields.Char()
    phone = fields.Char()
    street = fields.Char()
    street2 = fields.Char(string="Street 2")
    city = fields.Char()
    zip = fields.Char(string="ZIP")
    country_id = fields.Many2one("res.country", string="Country")
    state_id = fields.Many2one("res.country.state", string="State")
    parent_id = fields.Many2one("res.partner", string="Parent")
    active = fields.Boolean(default=True)
    display_name = fields.Computed(compute="_compute_display_name", store=True, string="Display Name")

    def _compute_display_name(self):
        """Compute display name from name field."""
        rows = self.read(["name"])
        return [r.get("name") or "" for r in rows]
