"""Server command - start HTTP server."""

import logging
import os
import sys

from core import release
from core.tools import config
from core.http import Application

from . import Command

_logger = logging.getLogger("erp")


class Server(Command):
    """Start the ERP platform HTTP server."""

    description = "Start the HTTP server"

    def run(self, args: list[str]) -> None:
        self._check_root_user()
        config.parse_config(args)

        _logger.info(
            "%s version %s",
            release.product_name,
            release.version,
        )
        _logger.info("addons paths: %s", config.get_addons_paths())

        http_port = config.get_config().get("http_port", 8069)
        http_interface = config.get_config().get("http_interface", "0.0.0.0")

        app = Application()
        _logger.info("HTTP service listening on %s:%s", http_interface, http_port)

        from werkzeug.serving import run_simple
        run_simple(
            http_interface,
            http_port,
            app,
            use_debugger=False,
            use_reloader=False,
        )

    def _check_root_user(self) -> None:
        if os.name == "posix" and os.getuid() == 0:
            sys.stderr.write("Running as user 'root' is a security risk.\n")
