"""Chart template extension for l10n_pe (phase 374-377)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    pe_chart_template = fields.Boolean(string="PE Chart Template", default=True)
