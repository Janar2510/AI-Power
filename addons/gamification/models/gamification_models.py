"""Core gamification models."""

from core.orm import Model, fields


class GamificationBadge(Model):
    _name = "gamification.badge"
    _description = "Gamification Badge"

    name = fields.Char(string="Badge", required=True)
    active = fields.Boolean(default=True)
    description = fields.Html(string="Description")
    level = fields.Selection(
        selection=[("bronze", "Bronze"), ("silver", "Silver"), ("gold", "Gold")],
        default="bronze",
        string="Level",
    )
    rule_auth = fields.Selection(
        selection=[
            ("everyone", "Everyone"),
            ("users", "A selected list of users"),
            ("having", "People having some badges"),
            ("nobody", "No one"),
        ],
        default="everyone",
        string="Allowance to Grant",
    )


class GamificationBadgeUser(Model):
    _name = "gamification.badge.user"
    _description = "Gamification Badge User"

    badge_id = fields.Many2one("gamification.badge", string="Badge", required=True, ondelete="cascade")
    user_id = fields.Many2one("res.users", string="User", required=True)
    employee_id = fields.Many2one("hr.employee", string="Employee")
    comment = fields.Text(string="Comment")
    granted_date = fields.Date(string="Granted Date")


class GamificationChallenge(Model):
    _name = "gamification.challenge"
    _description = "Gamification Challenge"

    name = fields.Char(required=True)
    state = fields.Selection(
        selection=[("draft", "Draft"), ("inprogress", "In Progress"), ("done", "Done"), ("cancel", "Cancelled")],
        default="draft",
    )
    period = fields.Selection(
        selection=[("once", "Once"), ("daily", "Daily"), ("weekly", "Weekly"), ("monthly", "Monthly")],
        default="once",
    )
    line_ids = fields.One2many("gamification.challenge.line", "challenge_id", string="Goals")
    user_ids = fields.Many2many("res.users", string="Users")
    reward_id = fields.Many2one("gamification.badge", string="Reward Badge")


class GamificationChallengeLine(Model):
    _name = "gamification.challenge.line"
    _description = "Gamification Challenge Line"

    challenge_id = fields.Many2one("gamification.challenge", string="Challenge", required=True, ondelete="cascade")
    definition_id = fields.Many2one("gamification.goal.definition", string="Goal Definition", required=True)
    target_goal = fields.Float(string="Target", default=1.0)
    sequence = fields.Integer(string="Sequence", default=10)


class GamificationGoal(Model):
    _name = "gamification.goal"
    _description = "Gamification Goal"

    definition_id = fields.Many2one("gamification.goal.definition", string="Definition", required=True)
    user_id = fields.Many2one("res.users", string="User", required=True)
    challenge_id = fields.Many2one("gamification.challenge", string="Challenge", ondelete="cascade")
    current = fields.Float(string="Current", default=0.0)
    target_goal = fields.Float(string="Target", default=1.0)
    state = fields.Selection(
        selection=[("draft", "Draft"), ("reached", "Reached"), ("failed", "Failed")],
        default="draft",
    )


class GamificationGoalDefinition(Model):
    _name = "gamification.goal.definition"
    _description = "Gamification Goal Definition"

    name = fields.Char(required=True)
    field_id = fields.Many2one("ir.model.fields", string="Field")
    model_id = fields.Many2one("ir.model", string="Model")
    computation_mode = fields.Selection(
        selection=[("count", "Count"), ("sum", "Sum"), ("python", "Python")],
        default="count",
    )
    condition = fields.Char(string="Condition")
    domain = fields.Text(string="Domain")


class GamificationKarmaRank(Model):
    _name = "gamification.karma.rank"
    _description = "Gamification Karma Rank"

    name = fields.Char(string="Rank", required=True)
    karma_min = fields.Integer(string="Minimum Karma", default=0)
    description_motivational = fields.Text(string="Motivational Description")


class GamificationKarmaTracking(Model):
    _name = "gamification.karma.tracking"
    _description = "Gamification Karma Tracking"

    user_id = fields.Many2one("res.users", string="User", required=True)
    old_value = fields.Integer(string="Old Value", default=0)
    new_value = fields.Integer(string="New Value", default=0)
    reason = fields.Char(string="Reason")
