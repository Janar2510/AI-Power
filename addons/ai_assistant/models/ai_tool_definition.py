"""AI tool definition - registry of available tools."""

from core.orm import Model, fields


class AIToolDefinition(Model):
    _name = "ai.tool.definition"
    _description = "AI Tool Definition"

    name = fields.Char(required=True)
    model = fields.Char()
    method = fields.Char()
    description = fields.Text()
