"""CRM Lead model."""

from typing import Any, Dict

from addons.mail.models.mail_activity import MailActivityMixin
from addons.mail.models.mail_thread import MailThreadMixin
from core.orm import Model, api, fields


class CrmLead(MailActivityMixin, MailThreadMixin, Model):
    _name = "crm.lead"
    _audit = True  # Phase 205
    _description = "Lead/Opportunity"

    name = fields.Char(required=True)
    company_id = fields.Many2one("res.company", string="Company")
    type = fields.Selection(
        selection=[("lead", "Lead"), ("opportunity", "Opportunity")],
        string="Type",
        default="lead",
    )
    partner_id = fields.Many2one("res.partner", string="Contact", tracking=True)
    email_from = fields.Char(string="Email")
    phone = fields.Char(string="Phone")
    partner_name = fields.Computed(compute="_compute_partner_name", store=True, string="Partner Name")

    @classmethod
    def _onchange_partner_id(cls, vals):
        """Fill email_from, phone from partner (Phase 165)."""
        pid = vals.get("partner_id")
        if not pid:
            return {}
        if isinstance(pid, (list, tuple)) and pid:
            pid = pid[0]
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        if not env:
            return {}
        Partner = env.get("res.partner")
        if not Partner:
            return {}
        try:
            rows = Partner.browse([pid]).read(["email", "phone"])
            if not rows:
                return {}
            r = rows[0]
            return {"email_from": r.get("email") or "", "phone": r.get("phone") or ""}
        except Exception:
            return {}

    @api.depends("partner_id.name")
    def _compute_partner_name(self):
        if not self:
            return []
        rows = self.read(["partner_id"])
        partner_ids = list({r.get("partner_id") for r in rows if r.get("partner_id")})
        if not partner_ids:
            return [None] * len(self)
        env = getattr(self, "env", None)
        Partner = env.get("res.partner") if env else None
        if not Partner:
            return [None] * len(self)
        names = {r["id"]: r.get("name") for r in Partner.browse(partner_ids).read(["id", "name"])}
        return [names.get(r.get("partner_id")) if r.get("partner_id") else None for r in rows]

    @api.depends("expected_revenue", "priority", "ai_score", "type")
    def _compute_ai_win_probability(self):
        """Heuristic win probability for pipeline forecasting (Phase 497 predictive track)."""
        if not self:
            return []
        rows = self.read(["expected_revenue", "priority", "ai_score", "type"])
        out = []
        for r in rows:
            base = float(r.get("ai_score") or 40.0)
            rev = float(r.get("expected_revenue") or 0.0)
            base += min(35.0, rev / 1000.0)
            pr = r.get("priority") or "1"
            if pr == "3":
                base += 10.0
            if r.get("type") == "opportunity":
                base += 5.0
            out.append(min(99.0, max(1.0, base)))
        return out

    stage_id = fields.Many2one("crm.stage", string="Stage", tracking=True)
    user_id = fields.Many2one("res.users", string="Salesperson")  # Phase 220: for assign_lead
    ai_score = fields.Float(string="AI Score", readonly=True)  # Phase 220: 0-100
    ai_score_label = fields.Selection(
        selection=[("hot", "Hot"), ("warm", "Warm"), ("cold", "Cold")],
        string="AI Score",
        readonly=True,
    )  # Phase 220
    ai_win_probability = fields.Float(
        string="AI Win probability %",
        compute="_compute_ai_win_probability",
        store=False,
    )
    priority = fields.Selection(
        selection=[("0", "Low"), ("1", "Normal"), ("2", "High"), ("3", "Urgent")],
        string="Priority",
        default="1",
    )
    date_deadline = fields.Date(string="Deadline")
    currency_id = fields.Many2one("res.currency", string="Currency")
    expected_revenue = fields.Monetary(currency_field="currency_id", string="Expected Revenue", tracking=True)
    description = fields.Text()
    note_html = fields.Html(string="Notes")
    tag_ids = fields.Many2many("crm.tag", string="Tags")

    def write(self, vals: Dict[str, Any]) -> bool:
        """Override to notify bus when stage_id changes (Phase 92)."""
        res = super().write(vals)
        if res and "stage_id" in vals:
            try:
                env = getattr(self, "env", None)
                if env:
                    BusBus = env.get("bus.bus")
                    if BusBus:
                        uid = getattr(env, "uid", None)
                        payload = {"type": "stage_change", "res_model": "crm.lead", "stage_id": vals["stage_id"]}
                        for rid in (self.ids if hasattr(self, "ids") else [self.id] if hasattr(self, "id") else []):
                            if rid:
                                p = dict(payload, res_id=rid)
                                BusBus.sendone(f"mail.message_crm.lead_{rid}", p)
                                if uid:
                                    BusBus.sendone(f"res.partner_{uid}", p)
            except Exception:
                pass
        return res

    def action_mark_won(self):
        """Set stage to Won (Phase 76)."""
        env = getattr(self, "env", None)
        if not env:
            return
        Stage = env.get("crm.stage")
        if not Stage:
            return
        won_stages = Stage.search([("is_won", "=", True)], limit=1)
        if won_stages and won_stages.ids:
            self.write({"stage_id": won_stages.ids[0]})
