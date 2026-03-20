"""Chart template extension for l10n_ma (phase 386-389)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    ma_chart_template = fields.Boolean(string="MA Chart Template", default=True)
