"""Chart template extension for l10n_fi (phase 386-389)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    fi_chart_template = fields.Boolean(string="FI Chart Template", default=True)
