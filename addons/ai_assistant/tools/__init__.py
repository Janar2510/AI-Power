from .registry import TOOL_REGISTRY, get_tools, execute_tool
from . import analytics  # noqa: F401 - registers analyze_kpi, forecast_metric
from . import lead_scoring  # noqa: F401 - registers score_lead, assign_lead
from . import document_ocr  # noqa: F401 - registers process_document
from . import forecasting  # noqa: F401 - registers forecast_demand, forecast_cashflow, suggest_reorder
from . import anomaly_detection  # noqa: F401 - registers detect_anomalies, explain_anomaly

__all__ = ["TOOL_REGISTRY", "get_tools", "execute_tool"]
