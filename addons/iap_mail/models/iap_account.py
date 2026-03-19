"""Extend iap.account with alert fields for low-credit notifications."""

from core.orm import Model, fields


class IapAccountMail(Model):
    _name = "iap.account"
    _inherit = "iap.account"

    company_ids = fields.Many2many(
        "res.company",
        relation="iap_account_res_company_rel",
        column1="account_id",
        column2="company_id",
        string="Companies",
    )
    warning_threshold = fields.Float(string="Email Alert Threshold")
    warning_user_ids = fields.Many2many(
        "res.users",
        relation="iap_account_res_users_rel",
        column1="account_id",
        column2="user_id",
        string="Email Alert Recipients",
    )

    @classmethod
    def _send_success_notification(cls, env, message, title=None):
        cls._send_status_notification(env, message, "success", title=title)

    @classmethod
    def _send_error_notification(cls, env, message, title=None):
        cls._send_status_notification(env, message, "danger", title=title)

    @classmethod
    def _send_status_notification(cls, env, message, status, title=None):
        """Send notification via bus. Stub."""
        BusBus = env.get("bus.bus")
        if BusBus and hasattr(env, "uid"):
            params = {"message": message, "type": status}
            if title is not None:
                params["title"] = title
            user = env.get("res.users").browse([env.uid])
            if user and hasattr(user, "_bus_send"):
                user._bus_send("iap_notification", params)

    @classmethod
    def _send_no_credit_notification(cls, env, service_name, title):
        params = {"title": title, "type": "no_credit", "get_credits_url": ""}
        BusBus = env.get("bus.bus")
        if BusBus and hasattr(env, "uid"):
            user = env.get("res.users").browse([env.uid])
            if user and hasattr(user, "_bus_send"):
                user._bus_send("iap_notification", params)
