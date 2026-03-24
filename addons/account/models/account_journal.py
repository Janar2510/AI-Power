"""Journal (Phase 118)."""

from core.orm import Model, fields


class AccountJournal(Model):
    _name = "account.journal"
    _description = "Journal"

    name = fields.Char(string="Name", required=True)
    code = fields.Char(string="Code", required=True)
    type = fields.Selection(
        selection=[
            ("sale", "Sales"),
            ("purchase", "Purchase"),
            ("bank", "Bank"),
            ("general", "General"),
        ],
        string="Type",
        default="general",
    )
    company_id = fields.Many2one(
        "res.company",
        string="Company",
        help="Phase 560: journal belongs to this company; moves default company_id from journal when omitted.",
    )
