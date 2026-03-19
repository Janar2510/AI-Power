"""Command class for One2many and Many2many field writes.

Phase 254: Odoo 19 parity. One2many and Many2many fields expect command tuples
(verb, id, values) to manipulate relations. Use Command.create(), Command.update(), etc.
"""

from __future__ import annotations

import enum
from typing import Any, Collection

if False:
    from typing import TYPE_CHECKING
    if TYPE_CHECKING:
        ValuesType = dict[str, Any]


class Command(enum.IntEnum):
    """
    One2many and Many2many fields expect a 3-element tuple: (command, id, values).
    - CREATE (0): create new record(s), link to self
    - UPDATE (1): write values on existing record
    - DELETE (2): delete record and remove relation
    - UNLINK (3): remove relation (record may remain)
    - LINK (4): add relation to existing record
    - CLEAR (5): remove all relations
    - SET (6): replace relations with given ids
    """

    CREATE = 0
    UPDATE = 1
    DELETE = 2
    UNLINK = 3
    LINK = 4
    CLEAR = 5
    SET = 6

    @classmethod
    def create(cls, values: dict[str, Any]) -> tuple[int, int, Any]:
        """Create new record(s). Returns (CREATE, 0, values)."""
        return (cls.CREATE, 0, values)

    @classmethod
    def update(cls, id: int, values: dict[str, Any]) -> tuple[int, int, Any]:
        """Write values on related record. Returns (UPDATE, id, values)."""
        return (cls.UPDATE, id, values)

    @classmethod
    def delete(cls, id: int) -> tuple[int, int, int]:
        """Delete related record. Returns (DELETE, id, 0)."""
        return (cls.DELETE, id, 0)

    @classmethod
    def unlink(cls, id: int) -> tuple[int, int, int]:
        """Remove relation. Returns (UNLINK, id, 0)."""
        return (cls.UNLINK, id, 0)

    @classmethod
    def link(cls, id: int) -> tuple[int, int, int]:
        """Add relation. Returns (LINK, id, 0)."""
        return (cls.LINK, id, 0)

    @classmethod
    def clear(cls) -> tuple[int, int, int]:
        """Remove all relations. Returns (CLEAR, 0, 0)."""
        return (cls.CLEAR, 0, 0)

    @classmethod
    def set(cls, ids: Collection[int]) -> tuple[int, int, Collection[int]]:
        """Replace relations with given ids. Returns (SET, 0, ids)."""
        return (cls.SET, 0, list(ids) if ids else [])
