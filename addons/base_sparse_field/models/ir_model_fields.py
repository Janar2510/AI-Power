"""Sparse field marker on model fields (phase 319)."""

from core.orm import Model, fields


class IrModelFields(Model):
    _inherit = "ir.model.fields"

    is_sparse = fields.Boolean(string="Is Sparse", default=False)
