"""ir.rule - Record rules (Odoo 19 parity, persistent)."""

from core.orm import Model, fields


class IrRule(Model):
    _name = "ir.rule"
    _description = "Record Rule"

    xml_id = fields.Char(string="XML ID")  # e.g. base.res_users_apikeys_own_keys
    name = fields.Char(string="Name")
    model = fields.Char(string="Model", required=True)  # e.g. res.users.apikeys
    domain_force = fields.Text(string="Domain")
    groups_ref = fields.Char(string="Groups")  # comma-separated xml_ids; empty = applies to all
    active = fields.Boolean(default=True, string="Active")
    perm_read = fields.Boolean(default=True, string="Read")
    perm_write = fields.Boolean(default=True, string="Write")
    perm_create = fields.Boolean(default=True, string="Create")
    perm_unlink = fields.Boolean(default=True, string="Delete")
