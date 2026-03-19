"""Snailmail letter model (phase 313)."""

from core.orm import Model, fields


class SnailmailLetter(Model):
    _name = "snailmail.letter"
    _description = "Snailmail Letter"

    partner_id = fields.Many2one("res.partner", string="Recipient", ondelete="set null")
    body_html = fields.Text(string="Body HTML", default="")
    state = fields.Selection(
        selection=[("draft", "Draft"), ("sent", "Sent"), ("error", "Error")],
        string="State",
        default="draft",
    )
    error_code = fields.Char(string="Error Code", default="")
