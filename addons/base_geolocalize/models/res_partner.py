"""Partner latitude and longitude."""

from core.orm import Model, fields


class ResPartnerGeolocalize(Model):
    _inherit = "res.partner"

    partner_latitude = fields.Float(string="Latitude")
    partner_longitude = fields.Float(string="Longitude")

    def geo_localize(self):
        """Stub for geolocalization parity."""
        return True
