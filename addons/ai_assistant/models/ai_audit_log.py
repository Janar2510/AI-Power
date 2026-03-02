"""AI audit log - captures prompt hash, doc IDs, tool calls, user, timestamps."""

# from core.orm import Model, fields
#
#
# class AIAuditLog(Model):
#     _name = "ai.audit.log"
#     _description = "AI Audit Log"
#
#     prompt_hash = fields.Char()
#     retrieved_doc_ids = fields.Text()  # JSON list of doc IDs
#     tool_calls = fields.Text()  # JSON list of tool invocations
#     user_id = fields.Integer()
#     create_date = fields.Datetime()
#     outcome = fields.Text()
