"""Chart template extension for l10n_kr (phase 374-377)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    kr_chart_template = fields.Boolean(string="KR Chart Template", default=True)
