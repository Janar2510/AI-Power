"""Extend project.project with profitability fields."""

from core.orm import Model, fields


class ProjectProjectAccount(Model):
    _inherit = "project.project"

    budget = fields.Float(string="Budget")
    total_invoiced = fields.Float(string="Total Invoiced", default=0)
    margin = fields.Float(string="Margin", default=0)
