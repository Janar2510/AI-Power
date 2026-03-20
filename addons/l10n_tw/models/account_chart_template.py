"""Chart template extension for l10n_tw (phase 374-377)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    tw_chart_template = fields.Boolean(string="TW Chart Template", default=True)
