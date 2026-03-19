"""IoT device model (phase 349)."""

from core.orm import Model, fields


class IotDevice(Model):
    _name = "iot.device"
    _description = "IoT Device"

    name = fields.Char(string="Name", default="")
    identifier = fields.Char(string="Identifier")
    type = fields.Char(string="Type")
    ip_address = fields.Char(string="IP Address")
    state = fields.Selection([("offline", "Offline"), ("online", "Online")], string="State", default="offline")
    last_seen = fields.Datetime(string="Last Seen")
    box_id = fields.Many2one("iot.box", string="IoT Box", ondelete="set null")
