"""Chart template extension for l10n_se (phase 354-356)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    se_chart_template = fields.Boolean(string="SE Chart Template", default=True)
