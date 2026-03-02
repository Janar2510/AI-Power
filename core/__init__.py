# ruff: noqa: E402, F401
"""ERP Platform initialization."""

import sys

from .release import MIN_PY_VERSION

if sys.version_info < MIN_PY_VERSION:
    raise RuntimeError(
        f"Python >= {'.'.join(map(str, MIN_PY_VERSION))} required, "
        f"got {sys.version_info.major}.{sys.version_info.minor}"
    )

# Expose release info
from . import release  # noqa: E402

__version__ = release.version
