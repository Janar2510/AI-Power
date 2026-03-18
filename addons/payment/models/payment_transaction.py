"""Payment transaction (Phase 156)."""

from core.orm import Model, fields


class PaymentTransaction(Model):
    _name = "payment.transaction"
    _description = "Payment Transaction"

    provider_id = fields.Many2one("payment.provider", string="Provider", required=True)
    amount = fields.Float(required=True)
    currency_id = fields.Many2one("res.currency", string="Currency")
    partner_id = fields.Many2one("res.partner", string="Customer")
    sale_order_id = fields.Many2one("sale.order", string="Sale Order")
    account_move_id = fields.Many2one("account.move", string="Invoice")  # Phase 199
    state = fields.Selection(
        selection=[
            ("draft", "Draft"),
            ("pending", "Pending"),
            ("done", "Done"),
            ("cancel", "Cancelled"),
            ("error", "Error"),
        ],
        default="draft",
    )
    reference = fields.Char(string="Reference")
