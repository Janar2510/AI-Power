"""Chart template extension for l10n_mx (phase 354-356)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    mx_chart_template = fields.Boolean(string="MX Chart Template", default=True)
