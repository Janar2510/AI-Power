"""Chart template extension for l10n_lv (phase 386-389)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    lv_chart_template = fields.Boolean(string="LV Chart Template", default=True)
