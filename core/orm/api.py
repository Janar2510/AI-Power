"""API decorators and exceptions for ORM models."""


class ValidationError(Exception):
    """Raised by Python constraints when validation fails."""
    pass


def constrains(*field_names):
    """Decorator: mark method as a Python constraint triggered on create/write when listed fields change."""
    def decorator(func):
        func._constrains = field_names
        return func
    return decorator


def depends(*field_paths):
    """Decorator: mark compute method as depending on given field paths (e.g. 'partner_id.name').
    When those fields change on related records, stored computed values are recomputed (Phase 100)."""
    def decorator(func):
        func._depends = list(field_paths)
        return func
    return decorator
