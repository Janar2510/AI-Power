"""Knowledge category for organizing articles."""

from core.orm import Model, fields


class KnowledgeCategory(Model):
    _name = "knowledge.category"
    _description = "Knowledge Category"

    name = fields.Char(required=True)
    parent_id = fields.Many2one("knowledge.category", string="Parent")
    sequence = fields.Integer(default=10)
