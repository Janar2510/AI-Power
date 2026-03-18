"""base.automation - Automated actions (Phase 119, 226)."""

import json
import logging
from typing import Any, Dict, List, Optional

from core.orm import Model, fields

_logger = logging.getLogger("erp.automation")


class BaseAutomation(Model):
    _name = "base.automation"
    _description = "Automated Action"

    name = fields.Char(required=True, string="Action Name")
    model_name = fields.Char(required=True, string="Model")
    trigger = fields.Selection(
        selection=[
            ("on_create", "On Creation"),
            ("on_write", "On Update"),
            ("on_unlink", "On Deletion"),
            ("on_time", "Based on Timed Condition"),
        ],
        string="Trigger",
        required=True,
    )
    filter_domain = fields.Text(string="Filter Domain")  # JSON domain, optional
    action_type = fields.Selection(
        selection=[
            ("server_action", "Execute Server Action"),
            ("update", "Update Fields"),
            ("webhook", "Call Webhook"),
        ],
        string="Action To Do",
        default="server_action",
    )
    action_server_id = fields.Many2one("ir.actions.server", string="Server Action")
    update_vals = fields.Text(string="Values to Write")  # JSON: {"field": "value"}
    webhook_url = fields.Char(string="Webhook URL")
    interval_minutes = fields.Integer(string="Interval (minutes)", default=60)  # for on_time
    active = fields.Boolean(default=True)

    @classmethod
    def run_on_time(cls) -> int:
        """Phase 226: Cron entrypoint - run all base.automation rules with trigger=on_time."""
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        if not env:
            return 0
        return cls._run_on_time_automations(env)

    @classmethod
    def _run_on_time_automations(cls, env: Any) -> int:
        """Phase 226: Run all base.automation rules with trigger=on_time."""
        from core.orm.automation import _execute_automation_rule
        Automation = env.get("base.automation")
        if not Automation:
            return 0
        rules = Automation.search([
            ("trigger", "=", "on_time"),
            ("active", "=", True),
        ])
        if not rules or not rules.ids:
            return 0
        count = 0
        for rule in rules:
            try:
                row = rule.read(["model_name", "filter_domain", "action_type", "action_server_id", "update_vals", "webhook_url"])[0]
                model_name = row.get("model_name")
                if not model_name:
                    continue
                Model = env.get(model_name)
                if not Model:
                    continue
                domain = _parse_domain(row.get("filter_domain"))
                recs = Model.search(domain)
                record_ids = recs.ids if hasattr(recs, "ids") else [r for r in recs]
                if not record_ids:
                    continue
                _execute_automation_rule(env, row, model_name, record_ids, None)
                count += 1
            except Exception as e:
                _logger.warning("base.automation on_time rule %s failed: %s", rule.id, e)
        return count


def _parse_domain(domain_str: Optional[str]) -> List:
    """Parse domain from JSON string."""
    if not domain_str or not str(domain_str).strip():
        return []
    try:
        parsed = json.loads(str(domain_str).strip())
        return parsed if isinstance(parsed, list) else []
    except (json.JSONDecodeError, TypeError):
        return []
