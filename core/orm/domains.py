"""Domain expression operators and constants.

Phase 254: Odoo 19 parity. Domain conditions use (field, operator, value).
any! / not any! bypass record rules on the comodel (internal use only).
"""

from __future__ import annotations

STANDARD_CONDITION_OPERATORS = frozenset([
    "any", "not any",
    "any!", "not any!",
    "in", "not in",
    "=", "!=", "<>",
    "<", ">", "<=", ">=",
    "like", "not like",
    "ilike", "not ilike",
    "=like", "not =like",
    "=ilike", "not =ilike",
])
"""Standard operators for domain conditions."""

INTERNAL_CONDITION_OPERATORS = frozenset(("any!", "not any!"))
"""Operators that bypass record rules on comodel. Must never be exposed via RPC."""

NEGATIVE_CONDITION_OPERATORS = {
    "not any": "any",
    "not any!": "any!",
    "not in": "in",
    "not like": "like",
    "not ilike": "ilike",
    "not =like": "=like",
    "not =ilike": "=ilike",
    "!=": "=",
    "<>": "=",
}

_INVERSE_OPERATOR = {
    "not any": "any",
    "not any!": "any!",
    "not in": "in",
    "not like": "like",
    "not ilike": "ilike",
    "not =like": "=like",
    "not =ilike": "=ilike",
    "!=": "=",
    "<>": "=",
    "any": "not any",
    "any!": "not any!",
    "in": "not in",
    "like": "not like",
    "ilike": "not ilike",
    "=like": "not =like",
    "=ilike": "not =ilike",
    "=": "!=",
    "<": ">=",
    ">": "<=",
    ">=": "<",
    "<=": ">",
}

_TRUE_LEAF = (1, "=", 1)
_FALSE_LEAF = (0, "=", 1)
