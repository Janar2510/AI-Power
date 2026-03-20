"""Chart template extension for l10n_ro (phase 374-377)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    ro_chart_template = fields.Boolean(string="RO Chart Template", default=True)
