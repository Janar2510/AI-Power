"""Chart template extension for l10n_id (phase 386-389)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    id_chart_template = fields.Boolean(string="ID Chart Template", default=True)
