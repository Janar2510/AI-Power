"""Event booth category model (phase 314)."""

from core.orm import Model, fields


class EventBoothCategory(Model):
    _name = "event.booth.category"
    _description = "Event Booth Category"

    name = fields.Char(string="Name", required=True)
    description = fields.Text(string="Description", default="")
    price = fields.Float(string="Price", default=0.0)
