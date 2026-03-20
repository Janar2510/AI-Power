"""Database management commands."""

import os
import subprocess
import sys
from datetime import datetime

from core.sql_db import create_database, db_exists, get_cursor
from core.db import init_schema
from core.db.init_data import load_default_data, assign_admin_groups
from core.orm import Registry, Environment
from core.orm.models import ModelBase
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.tools import config
from core.http.auth import hash_password

from . import Command


class Db(Command):
    """Database management."""

    def run(self, args):
        parser = self.parser
        parser.add_argument(
            "action",
            choices=["create", "init", "list", "drop", "upgrade", "backup", "restore"],
            help="create, init, list, drop, upgrade, backup, or restore database",
        )
        parser.add_argument("-d", "--database", help="Database name")
        parser.add_argument(
            "-m",
            "-u",
            "--module",
            help="Module(s) to upgrade (comma-separated); -u is an alias for -m",
        )
        parser.add_argument(
            "--demo",
            action="store_true",
            help="Load demo XML from module manifests (Phase 410)",
        )
        parser.add_argument("-f", "--file", help="Backup file for restore")
        parser.add_argument("-o", "--output", help="Output path for backup")

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
        elif parsed.action == "upgrade":
            self._upgrade(dbname, parsed.module)
        elif parsed.action == "backup":
            self._backup(dbname, parsed.output)
        elif parsed.action == "restore":
            self._restore(dbname, parsed.file)

    def _create(self, dbname: str) -> None:
        """Create database."""
        if db_exists(dbname):
            print(f"Database {dbname} already exists.")
            return
        create_database(dbname)
        print(f"Database {dbname} created.")

    def _init(self, dbname: str, load_demo: bool = False) -> None:
        """Initialize database: create if needed, load modules, create tables, create admin user."""
        args = ["--addons-path=addons"]
        if load_demo:
            args.append("--demo")
        config.parse_config(args)
        if not db_exists(dbname):
            create_database(dbname)
            print(f"Database {dbname} created.")
        registry = Registry(dbname)
        ModelBase._registry = registry
        clear_loaded_addon_modules()
        load_module_graph()
        with get_cursor(dbname) as cr:
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            User = env["res.users"]
            existing = User.search([("login", "=", "admin")])
            if not existing:
                User.create({
                    "login": "admin",
                    "password": hash_password("admin"),
                    "name": "Administrator",
                })
                print("Created admin user (login: admin, password: admin)")
            assign_admin_groups(env)
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

    def _upgrade(self, dbname: str, module_arg: str = None) -> None:
        """Run migrations for module(s). Phase 102."""
        if not db_exists(dbname):
            print(f"Database {dbname} does not exist.")
            return
        config.parse_config(["--addons-path=addons"])
        module_names = None
        if module_arg:
            module_names = [m.strip() for m in module_arg.split(",") if m.strip()]
        from core.upgrade import run_upgrade
        with get_cursor(dbname) as cr:
            run_upgrade(cr, dbname, module_names)
            cr.connection.commit()
        print(f"Database {dbname} upgraded.")

    def _backup(self, dbname: str, output_path: str = None) -> None:
        """Backup database with pg_dump (Phase 145)."""
        if not db_exists(dbname):
            print(f"Database {dbname} does not exist.", file=sys.stderr)
            sys.exit(1)
        cfg = config.get_config()
        if not output_path:
            backup_dir = cfg.get("backup_dir") or os.environ.get("ERP_BACKUP_DIR", ".")
            os.makedirs(backup_dir, exist_ok=True)
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            output_path = os.path.join(backup_dir, f"{dbname}_{timestamp}.sql")
        try:
            result = subprocess.run(
                [
                    "pg_dump",
                    "-h", str(cfg.get("db_host", "localhost")),
                    "-p", str(cfg.get("db_port", 5432)),
                    "-U", str(cfg.get("db_user", "postgres")),
                    "-d", dbname,
                    "-f", output_path,
                    "--no-owner",
                    "--no-acl",
                ],
                env={**os.environ, "PGPASSWORD": str(cfg.get("db_password", ""))},
                capture_output=True,
                text=True,
                timeout=3600,
            )
            if result.returncode != 0:
                print(f"pg_dump failed: {result.stderr}", file=sys.stderr)
                sys.exit(1)
            print(f"Backup saved to {output_path}")
        except FileNotFoundError:
            print("pg_dump not found; install PostgreSQL client tools", file=sys.stderr)
            sys.exit(1)

    def _restore(self, dbname: str, filepath: str = None) -> None:
        """Restore database from pg_dump file (Phase 145)."""
        if not filepath or not os.path.isfile(filepath):
            print("Usage: erp-bin db restore -d <db> -f <backup.sql>", file=sys.stderr)
            sys.exit(1)
        cfg = config.get_config()
        if db_exists(dbname):
            print(f"Database {dbname} exists. Drop it first: erp-bin db drop -d {dbname}", file=sys.stderr)
            sys.exit(1)
        create_database(dbname)
        try:
            result = subprocess.run(
                [
                    "psql",
                    "-h", str(cfg.get("db_host", "localhost")),
                    "-p", str(cfg.get("db_port", 5432)),
                    "-U", str(cfg.get("db_user", "postgres")),
                    "-d", dbname,
                    "-f", filepath,
                ],
                env={**os.environ, "PGPASSWORD": str(cfg.get("db_password", ""))},
                capture_output=True,
                text=True,
                timeout=3600,
            )
            if result.returncode != 0:
                print(f"psql restore failed: {result.stderr}", file=sys.stderr)
                sys.exit(1)
            print(f"Database {dbname} restored from {filepath}")
        except FileNotFoundError:
            print("psql not found; install PostgreSQL client tools", file=sys.stderr)
            sys.exit(1)
