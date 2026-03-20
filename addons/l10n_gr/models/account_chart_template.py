"""Chart template extension for l10n_gr (phase 386-389)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    gr_chart_template = fields.Boolean(string="GR Chart Template", default=True)
