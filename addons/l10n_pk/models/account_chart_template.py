"""Chart template extension for l10n_pk (phase 386-389)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    pk_chart_template = fields.Boolean(string="PK Chart Template", default=True)
