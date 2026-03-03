"""Cron command - run scheduled jobs."""

import logging

from core.sql_db import get_cursor
from core.db import init_schema
from core.orm import Registry, Environment
from core.orm.models import ModelBase
from core.modules import load_module_graph
from core.tools import config

from . import Command

_logger = logging.getLogger("erp.cron")


class Cron(Command):
    """Run due scheduled jobs (ir.cron)."""

    description = "Run due cron jobs for configured database(s)"

    def run(self, args):
        parser = self.parser
        parser.add_argument("-d", "--database", help="Database name (default: from config)")
        parsed = parser.parse_args(args)
        dbname = parsed.database or config.get_config().get("db_name", "erp")

        config.parse_config(["--addons-path=addons"])
        registry = Registry(dbname)
        ModelBase._registry = registry
        load_module_graph()

        with get_cursor(dbname) as cr:
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            IrCron = env.get("ir.cron")
            if IrCron is None:
                _logger.warning("ir.cron model not found")
                return
            count = IrCron.run_due(env)
            cr.connection.commit()
            print(f"Cron: ran {count} job(s) on {dbname}")
