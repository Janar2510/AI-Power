"""Server command - start HTTP server."""

import logging
import os
import signal
import sys
import time

from core import release
from core.tools import config
from core.http import Application

from . import Command

_logger = logging.getLogger("erp")

_shutdown_requested = False


def _handle_sigterm(signum, frame):
    """Graceful shutdown on SIGTERM (Phase 120)."""
    global _shutdown_requested
    _shutdown_requested = True
    _logger.info("Received SIGTERM, shutting down gracefully")


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
        gevent_websocket = config.get_config().get("gevent_websocket", False)
        workers = config.get_config().get("workers", 0)

        if workers > 0:
            self._run_prefork(workers, http_interface, http_port, gevent_websocket)
        else:
            self._run_single(http_interface, http_port, gevent_websocket)

    def _run_single(
        self,
        http_interface: str,
        http_port: int,
        gevent_websocket: bool,
    ) -> None:
        """Single-process mode."""
        app = Application()
        if gevent_websocket:
            try:
                from gevent.pywsgi import WSGIServer
                _logger.info(
                    "HTTP + WebSocket (gevent) listening on %s:%s",
                    http_interface,
                    http_port,
                )
                server = WSGIServer((http_interface, http_port), app)
                server.serve_forever()
            except ImportError:
                _logger.warning(
                    "gevent not installed; falling back to Werkzeug (WebSocket will use longpolling). "
                    "Install: pip install gevent"
                )
                self._run_werkzeug(http_interface, http_port, app)
        else:
            _logger.info("HTTP service listening on %s:%s", http_interface, http_port)
            self._run_werkzeug(http_interface, http_port, app)

    def _run_prefork(
        self,
        num_workers: int,
        http_interface: str,
        http_port: int,
        gevent_websocket: bool,
    ) -> None:
        """Prefork N HTTP workers + 1 cron worker (Phase 120)."""
        import multiprocessing

        signal.signal(signal.SIGTERM, _handle_sigterm)

        def worker_http(worker_id: int) -> None:
            config.parse_config(["--addons-path=addons"])
            app = Application()
            if gevent_websocket:
                try:
                    from gevent.pywsgi import WSGIServer
                    server = WSGIServer((http_interface, http_port), app)
                    server.serve_forever()
                except ImportError:
                    self._run_werkzeug(http_interface, http_port, app)
            else:
                self._run_werkzeug(http_interface, http_port, app)

        def worker_cron() -> None:
            global _shutdown_requested
            config.parse_config(["--addons-path=addons"])
            from core.sql_db import get_cursor
            from core.db import init_schema
            from core.orm import Registry, Environment
            from core.orm.models import ModelBase
            from core.modules import load_module_graph

            dbname = config.get_config().get("db_name", "erp")
            while not _shutdown_requested:
                try:
                    registry = Registry(dbname)
                    ModelBase._registry = registry
                    load_module_graph()
                    with get_cursor(dbname) as cr:
                        init_schema(cr, registry)
                        env = Environment(registry, cr=cr, uid=1)
                        IrCron = env.get("ir.cron")
                        if IrCron:
                            IrCron.run_due(env)
                            cr.connection.commit()
                except Exception as e:
                    _logger.warning("Cron worker error: %s", e)
                for _ in range(60):
                    if _shutdown_requested:
                        return
                    time.sleep(1)

        _logger.info(
            "Prefork mode: %d HTTP workers + 1 cron worker on %s:%s",
            num_workers,
            http_interface,
            http_port,
        )
        processes = []
        for i in range(num_workers):
            p = multiprocessing.Process(target=worker_http, args=(i,))
            p.start()
            processes.append(p)
        cron_proc = multiprocessing.Process(target=worker_cron)
        cron_proc.start()
        processes.append(cron_proc)

        try:
            for p in processes:
                p.join()
        except KeyboardInterrupt:
            pass
        for p in processes:
            if p.is_alive():
                p.terminate()
                p.join(timeout=5)

    def _run_werkzeug(
        self, http_interface: str, http_port: int, app: Application
    ) -> None:
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
