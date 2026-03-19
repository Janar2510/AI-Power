"""API decorators and exceptions for ORM models."""

from . import decorators as _decorators

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


# Phase 235: Odoo-style api object for @api.onchange, @api.ondelete, etc.
class api:
    """Namespace for API decorators (Odoo-style: @api.constrains, @api.onchange, etc.)."""
    constrains = staticmethod(constrains)
    depends = staticmethod(depends)
    onchange = staticmethod(_decorators.onchange)
    ondelete = staticmethod(_decorators.ondelete)
    depends_context = staticmethod(_decorators.depends_context)
    autovacuum = staticmethod(_decorators.autovacuum)
    model_create_multi = staticmethod(_decorators.model_create_multi)
    model = staticmethod(_decorators.model)
    private = staticmethod(_decorators.private)
    readonly = staticmethod(_decorators.readonly)
