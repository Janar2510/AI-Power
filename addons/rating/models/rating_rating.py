"""rating.rating - Feedback on any record (Phase 239)."""

from core.orm import Model, fields


class RatingRating(Model):
    _name = "rating.rating"
    _description = "Rating"

    res_model = fields.Char(string="Related Model", required=True)
    res_id = fields.Integer(string="Related ID", required=True)
    rated_partner_id = fields.Many2one("res.partner", string="Rated by")
    rating = fields.Float(string="Rating", default=0)
    feedback = fields.Text(string="Feedback")
