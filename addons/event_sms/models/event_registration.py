"""Extend event registrations with SMS links."""

from core.orm import Model, api, fields


class EventRegistrationSms(Model):
    _inherit = "event.registration"

    sms_ids = fields.One2many(
        "sms.sms",
        "registration_id",
        string="SMS",
        readonly=True,
    )
    sms_count = fields.Integer(
        string="SMS Count",
        compute="_compute_sms_count",
    )

    @api.depends("sms_ids")
    def _compute_sms_count(self):
        for registration in self:
            registration.sms_count = len(registration.sms_ids) if registration.sms_ids else 0
