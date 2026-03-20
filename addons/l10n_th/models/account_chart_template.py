"""Chart template extension for l10n_th (phase 374-377)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    th_chart_template = fields.Boolean(string="TH Chart Template", default=True)
