"""Chart template extension for l10n_at (phase 354-356)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    at_chart_template = fields.Boolean(string="AT Chart Template", default=True)
