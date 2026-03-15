"""bus.bus - Real-time notification channel (Phase 92)."""

import json
from datetime import datetime
from typing import Any, Dict, List, Type, TypeVar

from core.orm import Model, fields

T = TypeVar("T", bound="Model")


class BusBus(Model):
    _name = "bus.bus"
    _description = "Bus Message"

    channel = fields.Char(required=True, string="Channel")
    message = fields.Text(string="Message")
    create_date = fields.Datetime(string="Created")

    @classmethod
    def create(cls: Type[T], vals: Dict[str, Any]) -> T:
        vals = dict(vals)
        if "create_date" not in vals:
            vals["create_date"] = datetime.utcnow().isoformat()
        return super().create(vals)

    @classmethod
    def sendone(cls, channel: str, message: Any) -> "BusBus":
        """Create a bus record. message can be dict (JSON-serialized)."""
        env = getattr(cls, "_registry", None) and getattr(cls._registry, "_env")
        if not env:
            return cls.browse([])
        msg_str = json.dumps(message) if isinstance(message, (dict, list)) else str(message)
        return cls.create({"channel": channel, "message": msg_str})

    @classmethod
    def sendmany(cls, notifications: List[Dict[str, Any]]) -> None:
        """Batch create bus records. notifications: [{channel, message}, ...]."""
        env = getattr(cls, "_registry", None) and getattr(cls._registry, "_env")
        if not env:
            return
        for n in notifications or []:
            channel = n.get("channel")
            message = n.get("message")
            if channel:
                msg_str = json.dumps(message) if isinstance(message, (dict, list)) else str(message)
                cls.create({"channel": channel, "message": msg_str})
