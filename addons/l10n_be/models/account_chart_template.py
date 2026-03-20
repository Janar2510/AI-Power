"""Chart template extension for l10n_be (phase 354-356)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    be_chart_template = fields.Boolean(string="BE Chart Template", default=True)
