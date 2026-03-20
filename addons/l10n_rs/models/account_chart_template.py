"""Chart template extension for l10n_rs (phase 386-389)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    rs_chart_template = fields.Boolean(string="RS Chart Template", default=True)
