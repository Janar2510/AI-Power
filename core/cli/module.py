"""Module command - list, load, install modules."""

from core.db import init_schema
from core.modules import (
    clear_loaded_addon_modules,
    get_manifest,
    get_modules,
    get_modules_with_version,
    load_module_graph,
    resolve_load_order,
)
from core.orm import Registry
from core.orm.models import ModelBase
from core.sql_db import db_exists, get_cursor
from core.tools import config

from . import Command


class Module(Command):
    """List, load, or install modules."""

    def run(self, args):
        parser = self.parser
        parser.add_argument(
            "action",
            nargs="?",
            choices=["list", "load", "install"],
            default="list",
            help="list, load, or install modules",
        )
        parser.add_argument("-d", "--database", help="Database name (required for install)")
        parser.add_argument("-m", "--module", help="Module name to install")

        parsed = parser.parse_args(args)

        if parsed.action == "list":
            modules = get_modules_with_version()
            for name, version in modules:
                print(f"  {name:<30} {version}")
            if not modules:
                print("  (no modules found in addons path)")
                print("  addons path:", config.get_addons_paths())

        elif parsed.action == "load":
            loaded = load_module_graph()
            print(f"Loaded {len(loaded)} modules:", ", ".join(loaded) or "(none)")

        elif parsed.action == "install":
            dbname = parsed.database or config.get_config().get("db_name", "erp")
            mod_name = parsed.module
            if not mod_name:
                print("Error: -m/--module required for install")
                return
            if not db_exists(dbname):
                print(f"Error: Database {dbname} does not exist. Run: erp-bin db init -d {dbname}")
                return
            config.parse_config(["--addons-path=addons"])
            available = set(get_modules())
            expanded = set()
            to_expand = [mod_name]
            while to_expand:
                m = to_expand.pop()
                if m in expanded or m not in available:
                    continue
                expanded.add(m)
                for dep in get_manifest(m).get("depends", []):
                    if dep in available:
                        to_expand.append(dep)
            to_load = resolve_load_order(list(expanded))
            registry = Registry(dbname)
            ModelBase._registry = registry
            clear_loaded_addon_modules()
            load_module_graph(module_names=to_load)
            with get_cursor(dbname) as cr:
                init_schema(cr, registry)
            print(f"Installed {mod_name} in database {dbname}")
