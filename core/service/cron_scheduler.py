"""In-process cron scheduler: polling + PostgreSQL LISTEN/NOTIFY (Phase 4a)."""

from __future__ import annotations

import logging
import select
import threading
import time
from typing import Optional

import psycopg2.extensions

from core.tools import config

_logger = logging.getLogger("erp.cron")

_NOTIFY_CHANNEL = "erp_cron_wake"


def start_cron_scheduler_thread() -> None:
    """Start daemon thread that runs ir.cron jobs (single-process dev server)."""
    t = threading.Thread(target=_cron_worker_loop, name="erp-cron", daemon=True)
    t.start()
    _logger.info("In-process cron scheduler thread started (channel=%s)", _NOTIFY_CHANNEL)


def _cron_worker_loop() -> None:
    dbname = config.get_config().get("db_name", "erp")
    listen_conn = None
    try:
        from core.sql_db import _get_connect_params

        params = _get_connect_params()
        params["dbname"] = dbname
        listen_conn = __import__("psycopg2").connect(**params)
        listen_conn.set_isolation_level(psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT)
        cur = listen_conn.cursor()
        cur.execute(f'LISTEN "{_NOTIFY_CHANNEL}";')
        cur.close()
    except Exception as e:
        _logger.warning("Cron LISTEN not available (%s); using poll-only mode", e)
        listen_conn = None

    while True:
        timeout = 30.0
        if listen_conn:
            try:
                if select.select([listen_conn], [], [], timeout)[0]:
                    listen_conn.poll()
                    while listen_conn.notifies:
                        listen_conn.notifies.pop()
            except Exception as e:
                _logger.warning("Cron listen loop error: %s", e)
        else:
            time.sleep(timeout)
        try:
            _run_due_jobs(dbname)
        except Exception as e:
            _logger.warning("Cron run_due_jobs: %s", e)


def _run_due_jobs(dbname: str) -> None:
    from core.modules import load_module_graph
    from core.orm import Environment, Registry
    from core.orm.models import ModelBase
    from core.sql_db import get_cursor

    registry = Registry(dbname)
    ModelBase._registry = registry
    load_module_graph()
    with get_cursor(dbname) as cr:
        env = Environment(registry, cr=cr, uid=1)
        registry.set_env(env)
        IrCron = env.get("ir.cron")
        if IrCron:
            IrCron.run_due()
        IrAsync = env.get("ir.async")
        if IrAsync:
            IrAsync.run_pending(limit=10)
