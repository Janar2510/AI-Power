"""Chart template extension for l10n_ua (phase 386-389)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    ua_chart_template = fields.Boolean(string="UA Chart Template", default=True)
