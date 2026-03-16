"""HR Job model."""

from core.orm import Model, fields


class HrJob(Model):
    _name = "hr.job"
    _description = "Job Position"

    name = fields.Char(required=True)
