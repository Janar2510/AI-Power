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
