"""ir.attachment - File attachments linked to records (res_model, res_id)."""

from core.orm import Model, fields


class IrAttachment(Model):
    _name = "ir.attachment"
    _description = "Attachment"

    name = fields.Char(required=True, string="File name")
    res_model = fields.Char(string="Related Model")
    res_id = fields.Integer(string="Related Record ID")
    datas = fields.Binary(string="File content")
