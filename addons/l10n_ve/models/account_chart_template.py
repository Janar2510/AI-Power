"""Chart template extension for l10n_ve (phase 386-389)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    ve_chart_template = fields.Boolean(string="VE Chart Template", default=True)
