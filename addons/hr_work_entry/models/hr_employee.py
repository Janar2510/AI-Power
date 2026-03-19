"""Extend hr.employee with work_entry_source (Phase 250)."""

from core.orm import Model, fields


class HrEmployee(Model):
    _inherit = "hr.employee"

    work_entry_source = fields.Selection(
        [
            ("calendar", "Working Schedule"),
            ("manual", "Manual"),
        ],
        string="Work Entry Source",
        default="calendar",
    )
