"""Chart template extension for l10n_ae (phase 374-377)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    ae_chart_template = fields.Boolean(string="AE Chart Template", default=True)
