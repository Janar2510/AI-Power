"""Restaurant floor and table models (phase 338)."""

from core.orm import Model, fields


class RestaurantFloor(Model):
    _name = "restaurant.floor"
    _description = "Restaurant Floor"

    name = fields.Char(string="Name", default="")
    pos_config_id = fields.Many2one("pos.config", string="POS Config", ondelete="cascade")
    background_color = fields.Char(string="Background Color", default="#FFFFFF")
    table_ids = fields.One2many("restaurant.table", "floor_id", string="Tables")


class RestaurantTable(Model):
    _name = "restaurant.table"
    _description = "Restaurant Table"

    name = fields.Char(string="Name", default="")
    floor_id = fields.Many2one("restaurant.floor", string="Floor", ondelete="cascade")
    seats = fields.Integer(string="Seats", default=2)
    position_h = fields.Integer(string="Position H", default=0)
    position_v = fields.Integer(string="Position V", default=0)
    shape = fields.Selection(
        selection=[("square", "Square"), ("round", "Round"), ("rectangle", "Rectangle")],
        string="Shape",
        default="square",
    )
