"""Payment provider (Phase 156)."""

from core.orm import Model, fields


class PaymentProvider(Model):
    _name = "payment.provider"
    _description = "Payment Provider"

    name = fields.Char(required=True)
    code = fields.Selection(
        selection=[
            ("manual", "Manual Transfer"),
            ("demo", "Demo (Instant)"),
            ("stripe", "Stripe"),
        ],
        string="Provider",
        required=True,
    )
    state = fields.Selection(
        selection=[
            ("disabled", "Disabled"),
            ("enabled", "Enabled"),
            ("test", "Test"),
        ],
        default="enabled",
    )
    company_id = fields.Many2one("res.company", string="Company")
