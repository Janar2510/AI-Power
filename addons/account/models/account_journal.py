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
    currency_id = fields.Many2one(
        "res.currency",
        string="Currency",
        help="Phase 599: defaults from the journal's company currency on create when omitted.",
    )

    @classmethod
    def create(cls, vals):
        vals = dict(vals)
        if not vals.get("currency_id"):
            env = getattr(cls._registry, "_env", None) if cls._registry else None
            Company = env.get("res.company") if env else None
            if Company:
                comp_id = vals.get("company_id")
                if not comp_id:
                    first = Company.search([], limit=1)
                    comp_id = first.ids[0] if first.ids else None
                if comp_id:
                    row = Company.browse(comp_id).read(["currency_id"])[0]
                    cur = row.get("currency_id")
                    cur_id = cur[0] if isinstance(cur, (list, tuple)) and cur else cur
                    if cur_id:
                        vals["currency_id"] = cur_id
        return super().create(vals)
