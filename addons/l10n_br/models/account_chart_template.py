"""Chart template extension for l10n_br (phase 354-356)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    br_chart_template = fields.Boolean(string="BR Chart Template", default=True)
