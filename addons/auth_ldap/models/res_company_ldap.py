"""LDAP configuration model (phase 312)."""

from core.orm import Model, fields


class ResCompanyLdap(Model):
    _name = "res.company.ldap"
    _description = "Company LDAP Configuration"

    company_id = fields.Many2one("res.company", string="Company", ondelete="cascade")
    ldap_server = fields.Char(string="LDAP Server", required=True)
    ldap_base = fields.Char(string="LDAP Base")
    ldap_filter = fields.Char(string="LDAP Filter", default="")
