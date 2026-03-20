"""Chart template extension for l10n_in (phase 354-356)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    in_chart_template = fields.Boolean(string="IN Chart Template", default=True)
