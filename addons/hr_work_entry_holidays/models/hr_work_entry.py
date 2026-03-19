"""Work entries tied to time off (Odoo hr_work_entry_holidays parity)."""

from core.orm import Model, fields


class HrWorkEntry(Model):
    _inherit = "hr.work.entry"

    leave_id = fields.Many2one("hr.leave", string="Time Off", ondelete="set null")
    leave_state = fields.Related("leave_id.state", string="Leave State")

    def write(self, vals):
        return super().write(vals)

    def _reset_conflicting_state(self):
        pass

    def action_approve_leave(self):
        return True

    def action_refuse_leave(self):
        return True

    def _get_leaves_duration_between_two_dates(self, employee_id, date_from, date_to):
        return {}
