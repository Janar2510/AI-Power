"""MO analytic account visibility (Odoo project_mrp_account parity)."""

from core.orm import Model, fields


class MrpProduction(Model):
    _inherit = "mrp.production"

    has_analytic_account = fields.Boolean(string="Has Analytic Account", default=False)

    def action_view_analytic_accounts(self):
        return {"type": "ir.actions.act_window", "res_model": "analytic.account"}
