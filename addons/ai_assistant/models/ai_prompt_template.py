"""AI prompt template - reusable prompt templates."""

from core.orm import Model, fields


class AIPromptTemplate(Model):
    _name = "ai.prompt.template"
    _description = "AI Prompt Template"

    name = fields.Char(required=True)
    template = fields.Text()
    model = fields.Char()
