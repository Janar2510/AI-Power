"""Chart template extension for l10n_bg (phase 374-377)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    bg_chart_template = fields.Boolean(string="BG Chart Template", default=True)
