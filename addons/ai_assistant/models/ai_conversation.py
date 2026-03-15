"""AI conversation - stateful chat history per user."""

from datetime import datetime, timezone

from core.orm import Model, fields


class AIConversation(Model):
    _name = "ai.conversation"
    _description = "AI Conversation"

    user_id = fields.Integer()
    messages = fields.Text()  # JSON array of {role, content}
    model_context = fields.Char()  # e.g. "crm.lead"
    active_id = fields.Integer()  # record id in context
    create_date = fields.Datetime()
    write_date = fields.Datetime()
