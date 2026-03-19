"""Digest - periodic KPI email (Phase 251)."""

from datetime import datetime, timedelta

from core.orm import Model, fields


class DigestDigest(Model):
    _name = "digest.digest"
    _description = "Digest"

    name = fields.Char(string="Name", required=True)
    periodicity = fields.Selection(
        [
            ("daily", "Daily"),
            ("weekly", "Weekly"),
            ("monthly", "Monthly"),
            ("quarterly", "Quarterly"),
        ],
        string="Periodicity",
        default="weekly",
    )
    next_run_date = fields.Date(string="Next Send Date")
    user_ids = fields.Many2many(
        "res.users",
        "digest_digest_res_users_rel",
        "digest_id",
        "user_id",
        string="Recipients",
    )
    company_id = fields.Many2one("res.company", string="Company")
    state = fields.Selection(
        [
            ("activated", "Activated"),
            ("deactivated", "Deactivated"),
        ],
        string="Status",
        default="activated",
    )

    def _action_send_digest(self):
        """Send digest emails to subscribed users. Called by cron."""
        env = getattr(self, "env", None)
        if not env:
            return
        MailMail = env.get("mail.mail")
        if not MailMail:
            return
        for digest in self:
            if digest.state != "activated":
                continue
            user_ids = digest.user_ids.ids if digest.user_ids else []
            if not user_ids:
                continue
            User = env.get("res.users")
            users = User.browse(user_ids)
            for user in users:
                email = user.read(["email"])[0].get("email") if user.ids else None
                if not email:
                    continue
                subject = f"Digest: {digest.name}"
                body = f"<p>Your periodic digest for {digest.name}.</p>"
                MailMail.create({
                    "email_from": "noreply@localhost",
                    "email_to": email,
                    "subject": subject,
                    "body_html": body,
                })
            if digest.next_run_date:
                next_date = self._compute_next_run_date(digest.periodicity, digest.next_run_date)
                digest.write({"next_run_date": next_date})

    @staticmethod
    def _compute_next_run_date(periodicity: str, from_date) -> str:
        """Compute next run date from periodicity."""
        if isinstance(from_date, str):
            from datetime import datetime as dt
            d = dt.strptime(from_date[:10], "%Y-%m-%d").date()
        else:
            d = from_date
        if periodicity == "daily":
            next_d = d + timedelta(days=1)
        elif periodicity == "weekly":
            next_d = d + timedelta(weeks=1)
        elif periodicity == "monthly":
            if d.month == 12:
                next_d = d.replace(year=d.year + 1, month=1)
            else:
                next_d = d.replace(month=d.month + 1)
        elif periodicity == "quarterly":
            next_d = d + timedelta(days=90)
        else:
            next_d = d + timedelta(weeks=1)
        return next_d.isoformat()
