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
            self._ensure_default_db()
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
        self._ensure_default_db()
        app = Application()
        try:
            from core.service.cron_scheduler import start_cron_scheduler_thread

            start_cron_scheduler_thread()
        except Exception as e:
            _logger.warning("Could not start in-process cron scheduler: %s", e)
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
        """Prefork N HTTP workers + 1 cron worker (Phase 128). Uses gunicorn when available."""
        try:
            from gunicorn.app.base import BaseApplication
        except ImportError:
            _logger.warning(
                "gunicorn not installed; --workers requires gunicorn. "
                "Falling back to single process. Install: pip install gunicorn"
            )
            self._run_single(http_interface, http_port, gevent_websocket)
            return

        import multiprocessing

        signal.signal(signal.SIGTERM, _handle_sigterm)

        def worker_cron() -> None:
            global _shutdown_requested
            from pathlib import Path

            _root = Path(__file__).resolve().parent.parent.parent
            config.parse_config([f"--addons-path={_root / 'addons'}"])
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

        cron_proc = multiprocessing.Process(target=worker_cron)
        cron_proc.start()

        def shutdown_cron():
            global _shutdown_requested
            _shutdown_requested = True
            if cron_proc.is_alive():
                cron_proc.terminate()
                cron_proc.join(timeout=5)

        import atexit
        atexit.register(shutdown_cron)

        class ERPApplication(BaseApplication):
            def __init__(self, app, options=None):
                self.options = options or {}
                self.application = app
                super().__init__()

            def load_config(self):
                for k, v in self.options.items():
                    if k in self.cfg.settings and v is not None:
                        self.cfg.set(k.lower(), v)

            def load(self):
                return self.application

        app = Application()
        opts = {
            "bind": f"{http_interface}:{http_port}",
            "workers": num_workers,
            "worker_class": "sync",
            "timeout": 120,
            "graceful_timeout": 30,
        }
        if gevent_websocket:
            opts["worker_class"] = "gevent"
        _logger.info(
            "Prefork mode (gunicorn): %d workers + 1 cron on %s:%s",
            num_workers,
            http_interface,
            http_port,
        )
        ERPApplication(app, opts).run()

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

    def _sync_orm_schema(self, dbname: str) -> None:
        """Apply create-table / missing-column / index updates for loaded models (idempotent)."""
        from core.db import init_schema
        from core.modules import clear_loaded_addon_modules, load_module_graph
        from core.orm import Registry
        from core.orm.models import ModelBase
        from core.sql_db import get_cursor

        try:
            registry = Registry(dbname)
            ModelBase._registry = registry
            clear_loaded_addon_modules()
            load_module_graph()
            with get_cursor(dbname) as cr:
                init_schema(cr, registry)
            _logger.info("ORM schema sync completed for database %s", dbname)
        except Exception as e:
            _logger.warning("ORM schema sync failed for %s: %s", dbname, e)

    def _ensure_default_db(self) -> None:
        """Create DB if missing; run schema + default data if core tables are absent.

        A PostgreSQL database can exist but be empty (e.g. created manually). Previously we
        only initialized when the database row was missing, which led to login errors like
        ``relation "res_users" does not exist``.

        When the database already has ``res_users``, we still run :func:`init_schema` once
        at startup so new ORM columns (e.g. ``account_move.company_id``) are added without
        requiring a manual migration.
        """
        from core.sql_db import db_exists, create_database, get_cursor
        dbname = config.get_config().get("db_name", "erp")
        if db_exists(dbname):
            try:
                with get_cursor(dbname) as cr:
                    cr.execute(
                        "SELECT 1 FROM information_schema.tables "
                        "WHERE table_schema = 'public' AND table_name = %s",
                        ("res_users",),
                    )
                    if cr.fetchone():
                        self._sync_orm_schema(dbname)
                        return
            except Exception as e:
                _logger.warning("Could not inspect database %s: %s", dbname, e)
                return
        try:
            if not db_exists(dbname):
                create_database(dbname)
                _logger.info("Created database %s", dbname)
            from core.db import init_schema
            from core.db.init_data import load_default_data, assign_admin_groups
            from core.orm import Registry, Environment
            from core.orm.models import ModelBase
            from core.modules import clear_loaded_addon_modules, load_module_graph
            from core.http.auth import hash_password
            registry = Registry(dbname)
            ModelBase._registry = registry
            clear_loaded_addon_modules()
            load_module_graph()
            with get_cursor(dbname) as cr:
                init_schema(cr, registry)
                env = Environment(registry, cr=cr, uid=1)
                registry.set_env(env)
                load_default_data(env)
                User = env.get("res.users")
                if User and not User.search([("login", "=", "admin")]):
                    User.create({
                        "login": "admin",
                        "password": hash_password("admin"),
                        "name": "Administrator",
                    })
                assign_admin_groups(env)
            _logger.info("Database %s initialized. Log in with admin / admin.", dbname)
        except Exception as e:
            _logger.warning("Could not auto-init database %s: %s", dbname, e)

    def _check_root_user(self) -> None:
        if os.name == "posix" and os.getuid() == 0:
            sys.stderr.write("Running as user 'root' is a security risk.\n")
