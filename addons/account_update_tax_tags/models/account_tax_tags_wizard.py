"""Tax tag update wizard (phase 322)."""

from core.orm import Model, fields


class AccountTaxTagsWizard(Model):
    _name = "account.tax.tags.wizard"
    _description = "Account Tax Tags Wizard"

    tag_ids = fields.Many2many(
        "account.account.tag",
        "account_tax_tags_wizard_tag_rel",
        "wizard_id",
        "tag_id",
        string="Source Tags",
    )
    target_tag_ids = fields.Many2many(
        "account.account.tag",
        "account_tax_tags_wizard_target_tag_rel",
        "wizard_id",
        "tag_id",
        string="Target Tags",
    )
