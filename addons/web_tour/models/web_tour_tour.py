"""Web tour - guided tour definition."""

from core.orm import Model, fields


class WebTourTour(Model):
    _name = "web_tour.tour"
    _description = "Web Tour"

    name = fields.Char(string="Tour Name", required=True)
    user_ids = fields.Many2many(
        "res.users",
        relation="web_tour_tour_res_users_rel",
        column1="tour_id",
        column2="user_id",
        string="Completed By",
    )
