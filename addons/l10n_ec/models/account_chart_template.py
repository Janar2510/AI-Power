"""Chart template extension for l10n_ec (phase 374-377)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    ec_chart_template = fields.Boolean(string="EC Chart Template", default=True)
