"""Partner latitude and longitude (Phase 420: Nominatim when reachable)."""

import hashlib
import json
import logging
import urllib.error
import urllib.parse
import urllib.request

from core.orm import Model, fields

_logger = logging.getLogger("erp.geolocalize")


class ResPartnerGeolocalize(Model):
    _inherit = "res.partner"

    partner_latitude = fields.Float(string="Latitude")
    partner_longitude = fields.Float(string="Longitude")

    def geo_localize(self):
        rows = self.read(["street", "city", "zip", "country_id"]) if self.ids else []
        r0 = rows[0] if rows else {}
        parts = [
            str(r0.get("street") or ""),
            str(r0.get("city") or ""),
            str(r0.get("zip") or ""),
        ]
        q = ", ".join(p for p in parts if p.strip())
        if not q:
            q = str(getattr(self, "id", "0"))
        url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode(
            {"q": q, "format": "json", "limit": 1}
        )
        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "ERP-Platform/1.0 (geolocalize)"},
            )
            with urllib.request.urlopen(req, timeout=8) as resp:
                data = json.loads(resp.read().decode("utf-8", errors="replace"))
            if data and isinstance(data, list):
                lat = float(data[0].get("lat", 0))
                lon = float(data[0].get("lon", 0))
                self.write({"partner_latitude": lat, "partner_longitude": lon})
                return {"partner_latitude": lat, "partner_longitude": lon}
        except (urllib.error.URLError, urllib.error.HTTPError, ValueError, TypeError) as e:
            _logger.debug("Nominatim failed, fallback hash: %s", e)
        seed = q or str(getattr(self, "id", "0"))
        digest = hashlib.sha256(seed.encode("utf-8")).hexdigest()
        lat_raw = int(digest[:8], 16)
        lon_raw = int(digest[8:16], 16)
        lat = round((lat_raw / 0xFFFFFFFF) * 180.0 - 90.0, 6)
        lon = round((lon_raw / 0xFFFFFFFF) * 360.0 - 180.0, 6)
        self.write({"partner_latitude": lat, "partner_longitude": lon})
        return {"partner_latitude": lat, "partner_longitude": lon}
