"""IoT box model (phase 349)."""

from core.orm import Model, fields


class IotBox(Model):
    _name = "iot.box"
    _description = "IoT Box"

    name = fields.Char(string="Name", default="")
    ip_address = fields.Char(string="IP Address")
    identifier = fields.Char(string="Identifier")
    device_ids = fields.One2many("iot.device", "box_id", string="Devices")
