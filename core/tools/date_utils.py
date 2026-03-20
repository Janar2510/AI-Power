"""Date utility helpers (Phase 404)."""

from datetime import datetime, timedelta


def start_of(dt: datetime, unit: str) -> datetime:
    if unit == "day":
        return dt.replace(hour=0, minute=0, second=0, microsecond=0)
    if unit == "month":
        return dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if unit == "year":
        return dt.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    return dt


def end_of(dt: datetime, unit: str) -> datetime:
    if unit == "day":
        return start_of(dt, "day") + timedelta(days=1, microseconds=-1)
    if unit == "month":
        s = start_of(dt, "month")
        nxt = s.replace(year=s.year + 1, month=1) if s.month == 12 else s.replace(month=s.month + 1)
        return nxt + timedelta(microseconds=-1)
    if unit == "year":
        s = start_of(dt, "year")
        return s.replace(year=s.year + 1) + timedelta(microseconds=-1)
    return dt


def add(dt: datetime, **kwargs) -> datetime:
    return dt + timedelta(**kwargs)


def subtract(dt: datetime, **kwargs) -> datetime:
    return dt - timedelta(**kwargs)
