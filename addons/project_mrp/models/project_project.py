"""Project manufacturing stats (plan: production_count computed)."""

from core.orm import Model, api, fields


class ProjectProject(Model):
    _inherit = "project.project"

    is_template = fields.Boolean(string="Template", default=False)
    bom_count = fields.Integer(string="BoM Count", default=0)
    production_count = fields.Computed(
        compute="_compute_production_count",
        store=False,
        string="MO Count",
    )

    @api.depends()
    def _compute_production_count(self):
        Mrp = self.env.get("mrp.production")
        if not Mrp or not self.ids:
            return [0] * len(self._ids)
        out = []
        for pid in self._ids:
            out.append(len(Mrp.search([("project_id", "=", pid)]).ids))
        return out

    def action_view_mrp_bom(self):
        return {"type": "ir.actions.act_window", "res_model": "mrp.bom"}

    def action_view_mrp_production(self):
        return {"type": "ir.actions.act_window", "res_model": "mrp.production"}
