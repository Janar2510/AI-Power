"""Sales Team Member - membership of user in team."""

from core.orm import Model, fields


class CrmTeamMember(Model):
    _name = "crm.team.member"
    _description = "Sales Team Member"
    _rec_name = "user_id"
    _order = "id"

    crm_team_id = fields.Many2one(
        "crm.team",
        string="Sales Team",
        required=True,
        ondelete="cascade",
    )
    user_id = fields.Many2one(
        "res.users",
        string="Salesperson",
        required=True,
        ondelete="cascade",
    )
    active = fields.Boolean(string="Active", default=True)
