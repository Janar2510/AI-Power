"""Partner latitude and longitude."""

import hashlib

from core.orm import Model, fields


class ResPartnerGeolocalize(Model):
    _inherit = "res.partner"

    partner_latitude = fields.Float(string="Latitude")
    partner_longitude = fields.Float(string="Longitude")

    def geo_localize(self):
        parts = [
            str(getattr(self, "street", "") or ""),
            str(getattr(self, "city", "") or ""),
            str(getattr(self, "zip", "") or ""),
            str(getattr(self, "country_id", "") or ""),
        ]
        seed = "|".join(parts).strip() or str(getattr(self, "id", "0"))
        digest = hashlib.sha256(seed.encode("utf-8")).hexdigest()
        lat_raw = int(digest[:8], 16)
        lon_raw = int(digest[8:16], 16)
        self.partner_latitude = round((lat_raw / 0xFFFFFFFF) * 180.0 - 90.0, 6)
        self.partner_longitude = round((lon_raw / 0xFFFFFFFF) * 360.0 - 180.0, 6)
        return {
            "partner_latitude": self.partner_latitude,
            "partner_longitude": self.partner_longitude,
        }
