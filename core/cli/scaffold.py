"""Scaffold command - generate module from template."""

import os
import re
import sys
from pathlib import Path

import jinja2

from core.tools import config

from . import Command


def _snake(s: str) -> str:
    """Convert to snake_case."""
    s = re.sub(r"(?<=[^A-Z])\B([A-Z])", r" \1", s)
    return "_".join(s.lower().split())


def _pascal(s: str) -> str:
    """Convert to PascalCase."""
    return "".join(
        ss.capitalize() for ss in re.sub(r"[_\s]+", " ", s).split()
    )


def _builtins(*parts: str) -> Path:
    """Path to built-in templates."""
    base = Path(__file__).parent / "templates"
    return base / os.path.join(*parts) if parts else base


class Scaffold(Command):
    """Generate an ERP module skeleton from a template."""

    description = "Generate a new module from a template"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        templates_dir = _builtins()
        if templates_dir.exists():
            available = [
                d.name
                for d in templates_dir.iterdir()
                if d.is_dir() and d.name != "base"
            ]
            self.epilog = f"Built-in templates: {', '.join(available)}"

    def run(self, args: list[str]) -> None:
        parser = self.parser
        parser.add_argument(
            "-t",
            "--template",
            default="default",
            help="Template name (default: default)",
        )
        parser.add_argument("name", help="Module name")
        parser.add_argument(
            "dest",
            nargs="?",
            default=".",
            help="Destination directory (default: current)",
        )

        if not args:
            parser.print_help()
            sys.exit(0)

        parsed = parser.parse_args(args)
        template_dir = _builtins(parsed.template)
        if not template_dir.is_dir():
            sys.exit(f"Template {parsed.template!r} not found")

        modname = _snake(parsed.name)
        dest_dir = Path(parsed.dest).resolve().expanduser()
        dest_dir.mkdir(parents=True, exist_ok=True)
        module_path = dest_dir / modname

        env = jinja2.Environment()
        env.filters["snake"] = _snake
        env.filters["pascal"] = _pascal

        params = {"name": parsed.name}

        for root, _, files in os.walk(template_dir):
            root_path = Path(root)
            for f in files:
                src = root_path / f
                rel = src.relative_to(template_dir)
                # Render path (for {{ name|snake }} in filenames)
                rel_str = str(rel).replace("\\", "/")
                rel_str = env.from_string(rel_str).render(params)
                rel = Path(rel_str)
                # Strip .template extension
                if rel.suffix == ".template":
                    rel = rel.with_suffix("")
                dest_file = module_path / rel
                dest_file.parent.mkdir(parents=True, exist_ok=True)

                content = src.read_bytes()
                if rel.suffix in (".py", ".xml", ".csv", ".js", ".rst", ".html"):
                    rendered = env.from_string(content.decode("utf-8")).render(
                        params
                    )
                    dest_file.write_text(rendered + "\n", encoding="utf-8")
                else:
                    dest_file.write_bytes(content)

        print(f"Created module {modname} at {module_path}")
