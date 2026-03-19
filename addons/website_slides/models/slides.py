"""Website slides models (phase 336)."""

from core.orm import Model, fields


class SlideChannel(Model):
    _name = "slide.channel"
    _description = "Slide Channel"

    name = fields.Char(string="Name", default="")
    website_published = fields.Boolean(string="Website Published", default=False)
    enroll = fields.Selection(
        selection=[("public", "Public"), ("invite", "Invite"), ("payment", "Payment")],
        string="Enroll",
        default="public",
    )
    enroll_group_ids = fields.Many2many(
        "res.groups",
        "slide_channel_group_rel",
        "channel_id",
        "group_id",
        string="Enroll Groups",
    )
    total_slides = fields.Integer(string="Total Slides", default=0)
    total_time = fields.Float(string="Total Time", default=0.0)


class SlideSlide(Model):
    _name = "slide.slide"
    _description = "Slide"

    name = fields.Char(string="Title", default="")
    channel_id = fields.Many2one("slide.channel", string="Channel", ondelete="cascade")
    slide_type = fields.Selection(
        selection=[("document", "Document"), ("video", "Video"), ("article", "Article")],
        string="Slide Type",
        default="document",
    )
    url = fields.Char(string="URL", default="")
    document_id = fields.Many2one("ir.attachment", string="Document", ondelete="set null")
    sequence = fields.Integer(string="Sequence", default=10)
    total_views = fields.Integer(string="Total Views", default=0)
    likes = fields.Integer(string="Likes", default=0)
    dislikes = fields.Integer(string="Dislikes", default=0)
    website_published = fields.Boolean(string="Website Published", default=False)


class SlideChannelPartner(Model):
    _name = "slide.channel.partner"
    _description = "Slide Channel Partner"

    channel_id = fields.Many2one("slide.channel", string="Channel", ondelete="cascade")
    partner_id = fields.Many2one("res.partner", string="Partner", ondelete="cascade")
    completion = fields.Float(string="Completion", default=0.0)
    completed = fields.Boolean(string="Completed", default=False)
