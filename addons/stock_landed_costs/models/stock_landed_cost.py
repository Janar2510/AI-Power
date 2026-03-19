"""Stock landed costs."""

from core.orm import Model, fields


class StockLandedCost(Model):
    _name = "stock.landed.cost"
    _description = "Stock Landed Cost"

    name = fields.Char(string="Name", required=True, default="New")
    date = fields.Date(string="Date")
    target_model = fields.Selection(
        selection=[("picking", "Transfers")],
        string="Apply On",
        default="picking",
    )
    picking_ids = fields.Many2many("stock.picking", string="Transfers")
    cost_lines = fields.One2many("stock.landed.cost.line", "cost_id", string="Cost Lines")
    valuation_adjustment_lines = fields.Text(string="Valuation Adjustments")
    state = fields.Selection(
        selection=[("draft", "Draft"), ("done", "Posted"), ("cancel", "Cancelled")],
        default="draft",
    )
    account_journal_id = fields.Many2one("account.journal", string="Account Journal")

    def action_validate(self):
        self.write({"state": "done"})
        return True
