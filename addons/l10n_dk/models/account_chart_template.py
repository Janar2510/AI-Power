"""Chart template extension for l10n_dk (phase 354-356)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    dk_chart_template = fields.Boolean(string="DK Chart Template", default=True)
