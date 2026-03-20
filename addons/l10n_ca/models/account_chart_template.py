"""Chart template extension for l10n_ca (phase 354-356)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    ca_chart_template = fields.Boolean(string="CA Chart Template", default=True)
