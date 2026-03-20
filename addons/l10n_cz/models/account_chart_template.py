"""Chart template extension for l10n_cz (phase 374-377)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    cz_chart_template = fields.Boolean(string="CZ Chart Template", default=True)
