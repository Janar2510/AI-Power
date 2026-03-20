"""Chart template extension for l10n_no (phase 354-356)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    no_chart_template = fields.Boolean(string="NO Chart Template", default=True)
