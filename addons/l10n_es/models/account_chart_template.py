"""Chart template extension for l10n_es (phase 354-356)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    es_chart_template = fields.Boolean(string="ES Chart Template", default=True)
