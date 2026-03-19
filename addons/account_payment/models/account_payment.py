"""Account Payment - payments linked to journal entries."""

from core.orm import Model, fields


class AccountPayment(Model):
    _name = "account.payment"
    _description = "Payments"
    _order = "date desc, id desc"

    name = fields.Char(string="Number")
    date = fields.Date(required=True)
    move_id = fields.Many2one("account.move", string="Journal Entry", copy=False)
    journal_id = fields.Many2one("account.journal", string="Journal", required=True)
    company_id = fields.Many2one("res.company", string="Company", required=True)
    state = fields.Selection(
        selection=[
            ("draft", "Draft"),
            ("in_process", "In Process"),
            ("paid", "Paid"),
            ("canceled", "Canceled"),
            ("rejected", "Rejected"),
        ],
        default="draft",
        required=True,
    )
    amount = fields.Float(string="Amount")
    currency_id = fields.Many2one("res.currency", string="Currency")
    partner_id = fields.Many2one("res.partner", string="Customer/Vendor")
    payment_type = fields.Selection(
        selection=[("outbound", "Send"), ("inbound", "Receive")],
        default="inbound",
        required=True,
    )
    partner_type = fields.Selection(
        selection=[("customer", "Customer"), ("supplier", "Vendor")],
        default="customer",
        required=True,
    )
    memo = fields.Char(string="Memo")
    payment_reference = fields.Char(string="Payment Reference")
