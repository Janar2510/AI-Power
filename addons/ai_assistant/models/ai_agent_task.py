"""Phase 214: AI agent task - tracks multi-step AI tasks."""

from core.orm import Model, fields


class AIAgentTask(Model):
    _name = "ai.agent.task"
    _description = "AI Agent Task"

    user_id = fields.Integer(string="User")
    goal = fields.Text(string="Goal")
    steps = fields.Text(string="Steps JSON")  # [{tool, args, result}, ...]
    status = fields.Selection(
        selection=[
            ("pending", "Pending"),
            ("running", "Running"),
            ("done", "Done"),
            ("failed", "Failed"),
            ("cancelled", "Cancelled"),
        ],
        string="Status",
        default="pending",
    )
    result = fields.Text(string="Result")
    create_date = fields.Datetime()
    write_date = fields.Datetime()
