"""Phase 217: Job applicant model."""

from core.orm import Model, fields


class HrApplicant(Model):
    _name = "hr.applicant"
    _description = "Applicant"

    name = fields.Char(string="Subject", required=True)
    email = fields.Char(string="Email")
    phone = fields.Char(string="Phone")
    job_id = fields.Many2one("hr.job", string="Job")
    stage_id = fields.Many2one("hr.recruitment.stage", string="Stage")
    partner_id = fields.Many2one("res.partner", string="Contact")
    kanban_state = fields.Selection(
        selection=[
            ("normal", "In Progress"),
            ("done", "Ready"),
            ("blocked", "Blocked"),
        ],
        default="normal",
        string="Kanban State",
    )
