"""Chart template extension for l10n_il (phase 386-389)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    il_chart_template = fields.Boolean(string="IL Chart Template", default=True)
