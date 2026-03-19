"""Link Tracker Code - short code for URL."""

import random
import string

from core.orm import Model, fields


def _generate_code():
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=6))


class LinkTrackerCode(Model):
    _name = "link.tracker.code"
    _description = "Link Tracker Code"

    code = fields.Char(string="Short URL Code", required=True, default=_generate_code)
    link_id = fields.Many2one("link.tracker", string="Link", required=True, ondelete="cascade")
