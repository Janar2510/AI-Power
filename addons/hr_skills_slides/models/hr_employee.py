"""Slides fields on HR employee skills profile (phase 336)."""

from core.orm import Model, fields


class HrEmployee(Model):
    _inherit = "hr.employee"

    slide_channel_ids = fields.Many2many(
        "slide.channel",
        "hr_employee_slide_channel_rel",
        "employee_id",
        "channel_id",
        string="Slide Channels",
    )
