"""Misc helpers (Phase 404)."""

from contextlib import contextmanager
import logging
from typing import Iterable, List, Tuple, TypeVar


T = TypeVar("T")


@contextmanager
def mute_logger(name: str):
    logger = logging.getLogger(name)
    old = logger.level
    logger.setLevel(logging.CRITICAL)
    try:
        yield
    finally:
        logger.setLevel(old)


def unique(values: Iterable[T]) -> List[T]:
    out: List[T] = []
    for v in values:
        if v not in out:
            out.append(v)
    return out


def flatten(values: Iterable[Iterable[T]]) -> List[T]:
    out: List[T] = []
    for chunk in values:
        out.extend(list(chunk))
    return out


def partition(values: Iterable[T], predicate) -> Tuple[List[T], List[T]]:
    left: List[T] = []
    right: List[T] = []
    for v in values:
        (left if predicate(v) else right).append(v)
    return left, right
