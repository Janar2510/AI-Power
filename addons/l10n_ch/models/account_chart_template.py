"""Chart template extension for l10n_ch (phase 354-356)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    ch_chart_template = fields.Boolean(string="CH Chart Template", default=True)
