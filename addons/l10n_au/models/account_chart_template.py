"""Chart template extension for l10n_au (phase 354-356)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    au_chart_template = fields.Boolean(string="AU Chart Template", default=True)
