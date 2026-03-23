"""Link employee to active contract (Phase 491)."""

from core.orm import Model, fields


class HrEmployeeContract(Model):
    _inherit = "hr.employee"

    contract_id = fields.Many2one(
        "hr.contract",
        string="Current Contract",
        ondelete="set null",
        readonly=True,
    )
