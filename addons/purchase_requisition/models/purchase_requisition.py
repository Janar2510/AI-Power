"""Purchase requisition model."""

from core.orm import Model, fields


class PurchaseRequisition(Model):
    _name = "purchase.requisition"
    _description = "Purchase Requisition"

    name = fields.Char(string="Agreement", required=True, default="New")
    active = fields.Boolean(default=True)
    reference = fields.Char(string="Reference")
    requisition_type = fields.Selection(
        selection=[("blanket_order", "Blanket Order"), ("purchase_template", "Purchase Template")],
        string="Agreement Type",
        default="blanket_order",
    )
    state = fields.Selection(
        selection=[("draft", "Draft"), ("confirmed", "Confirmed"), ("done", "Closed"), ("cancel", "Cancelled")],
        default="draft",
    )
    vendor_id = fields.Many2one("res.partner", string="Vendor")
    date_start = fields.Date(string="Start Date")
    date_end = fields.Date(string="End Date")
    user_id = fields.Many2one("res.users", string="Purchase Representative")
    line_ids = fields.One2many("purchase.requisition.line", "requisition_id", string="Lines")
    purchase_ids = fields.One2many("purchase.order", "requisition_id", string="Purchase Orders")

    def action_confirm(self):
        self.write({"state": "confirmed"})
        return True

    def action_done(self):
        self.write({"state": "done"})
        return True

    def action_cancel(self):
        self.write({"state": "cancel"})
        return True
