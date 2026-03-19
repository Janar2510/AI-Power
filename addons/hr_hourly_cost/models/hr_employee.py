"""Hourly cost on employee (plan: Float hourly_cost)."""

from core.orm import Model, fields


class HrEmployee(Model):
    _inherit = "hr.employee"

    hourly_cost = fields.Float(string="Hourly Cost", default=0.0)
