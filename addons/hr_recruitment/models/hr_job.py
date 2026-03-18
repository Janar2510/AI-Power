"""Phase 217: Extend hr.job with department_id, no_of_recruitment, state."""

from core.orm import Model, fields


class HrJobExtension(Model):
    _inherit = "hr.job"

    department_id = fields.Many2one("hr.department", string="Department")
    no_of_recruitment = fields.Integer(string="No. of Recruitment", default=1)
    state = fields.Selection(
        selection=[
            ("recruit", "Recruiting"),
            ("open", "Open"),
            ("closed", "Closed"),
        ],
        string="Status",
        default="recruit",
    )
