"""Request wrapper."""

from typing import Any, Dict, Optional

from werkzeug import Request as WerkzeugRequest
from werkzeug.wrappers import Response


class Request(WerkzeugRequest):
    """Extended request with session and params."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.session: Dict[str, Any] = {}
        self.params: Dict[str, Any] = {}
        self.db: Optional[str] = None
        self.uid: Optional[int] = None
