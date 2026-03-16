"""Mail Activity Type - activity categories (Call, Meeting, Email)."""

from typing import Any, Dict, Type, TypeVar

from core.orm import Model, fields

T = TypeVar("T", bound="Model")


class MailActivityType(Model):
    _name = "mail.activity.type"
    _description = "Activity Type"

    name = fields.Char(required=True, string="Name")
    sequence = fields.Integer(default=10, string="Sequence")
