"""Chart template extension for l10n_co (phase 374-377)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    co_chart_template = fields.Boolean(string="CO Chart Template", default=True)
