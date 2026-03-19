"""Project profitability: manufacturing slice + production_cost (plan field)."""

from core.orm import Model, fields


class ProjectProject(Model):
    _inherit = "project.project"

    production_cost = fields.Float(string="Production Cost", default=0.0)

    def _get_profitability_labels(self):
        return {"manufacturing_order": "Manufacturing Orders"}

    def _get_profitability_sequence_per_invoice_type(self):
        return {"manufacturing_order": 12}

    def _get_profitability_aal_domain(self):
        return [("category", "!=", "manufacturing_order")]

    def _get_profitability_items(self, with_action=True):
        return {"costs": {"data": [], "total": {"billed": 0.0}}, "revenues": {"data": [], "total": {}}}
