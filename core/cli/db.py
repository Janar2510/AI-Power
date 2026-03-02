"""Database management commands."""

import sys

from core.sql_db import create_database, db_exists, get_cursor
from core.db import init_schema
from core.orm import Registry, Environment
from core.orm.models import ModelBase
from core.modules import load_module_graph
from core.tools import config

from . import Command


class Db(Command):
    """Database management."""

    def run(self, args):
        parser = self.parser
        parser.add_argument(
            "action",
            choices=["create", "init", "list", "drop"],
            help="create, init, list, or drop database",
        )
        parser.add_argument("-d", "--database", help="Database name")

        parsed = parser.parse_args(args)
        dbname = parsed.database or config.get_config().get("db_name", "erp")

        if parsed.action == "create":
            self._create(dbname)
        elif parsed.action == "init":
            self._init(dbname)
        elif parsed.action == "list":
            self._list()
        elif parsed.action == "drop":
            self._drop(dbname)

    def _create(self, dbname: str) -> None:
        """Create database."""
        if db_exists(dbname):
            print(f"Database {dbname} already exists.")
            return
        create_database(dbname)
        print(f"Database {dbname} created.")

    def _init(self, dbname: str) -> None:
        """Initialize database: create if needed, load modules, create tables, create admin user."""
        config.parse_config(["--addons-path=addons"])
        if not db_exists(dbname):
            create_database(dbname)
            print(f"Database {dbname} created.")
        registry = Registry(dbname)
        ModelBase._registry = registry
        load_module_graph()
        with get_cursor(dbname) as cr:
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            User = env["res.users"]
            existing = User.search([("login", "=", "admin")])
            if not existing:
                User.create({
                    "login": "admin",
                    "password": hash_password("admin"),
                    "name": "Administrator",
                })
                print("Created admin user (login: admin, password: admin)")
        print(f"Database {dbname} initialized.")

    def _list(self) -> None:
        """List databases (connect to postgres and list)."""
        try:
            with get_cursor("postgres") as cr:
                cr.execute(
                    "SELECT datname FROM pg_database "
                    "WHERE datistemplate = false ORDER BY datname"
                )
                dbs = [r["datname"] for r in cr.fetchall()]
            for db in dbs:
                print(f"  {db}")
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            sys.exit(1)

    def _drop(self, dbname: str) -> None:
        """Drop database."""
        if not db_exists(dbname):
            print(f"Database {dbname} does not exist.")
            return
        import psycopg2
        from psycopg2 import sql
        cfg = config.get_config()
        conn = psycopg2.connect(
            host=cfg.get("db_host", "localhost"),
            port=cfg.get("db_port", 5432),
            user=cfg.get("db_user", "postgres"),
            password=cfg.get("db_password", ""),
            dbname="postgres",
        )
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute(sql.SQL("DROP DATABASE IF EXISTS {}").format(sql.Identifier(dbname)))
        cur.close()
        conn.close()
        print(f"Database {dbname} dropped.")
