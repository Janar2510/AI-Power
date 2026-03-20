"""Float helpers (Phase 404)."""


def _eps(precision_digits: int) -> float:
    return 10.0 ** (-max(0, int(precision_digits)))


def float_compare(a: float, b: float, precision_digits: int = 2) -> int:
    e = _eps(precision_digits)
    d = float(a) - float(b)
    if abs(d) <= e:
        return 0
    return 1 if d > 0 else -1


def float_round(value: float, precision_digits: int = 2) -> float:
    return round(float(value), int(precision_digits))


def float_is_zero(value: float, precision_digits: int = 2) -> bool:
    return abs(float(value)) <= _eps(precision_digits)
