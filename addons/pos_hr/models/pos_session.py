"""POS session HR field (phase 338)."""

from core.orm import Model, fields


class PosSession(Model):
    _inherit = "pos.session"

    employee_id = fields.Many2one("hr.employee", string="Employee", ondelete="set null")
