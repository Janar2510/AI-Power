"""CLI command registry and dispatch."""

import argparse
import contextlib
import re
import sys
from inspect import cleandoc
from pathlib import Path
from typing import Optional

# Import core first for init
import core  # noqa: F401
from core.tools import config

COMMAND_NAME_RE = re.compile(r"^[a-z][a-z0-9_]*$", re.I)
PROG_NAME = Path(sys.argv[0]).name
commands: dict = {}


class Command:
    """Base class for CLI commands."""

    name = None
    description = None
    epilog = None
    _parser = None

    def __init_subclass__(cls):
        cls.name = cls.name or cls.__name__.lower()
        module = cls.__module__.rpartition(".")[2]
        if not cls.is_valid_name(cls.name):
            raise ValueError(
                f"Command name {cls.name!r} must match {COMMAND_NAME_RE.pattern!r}"
            )
        if cls.name != module:
            raise ValueError(
                f"Command name {cls.name!r} must match module name {module!r}"
            )
        commands[cls.name] = cls

    @property
    def prog(self) -> str:
        return f"{PROG_NAME} [--addons-path=PATH,...] {self.name}"

    @property
    def parser(self) -> argparse.ArgumentParser:
        if self._parser is None:
            self._parser = argparse.ArgumentParser(
                formatter_class=argparse.RawDescriptionHelpFormatter,
                prog=self.prog,
                description=cleandoc(self.description or self.__doc__ or ""),
                epilog=cleandoc(self.epilog or ""),
            )
        return self._parser

    @classmethod
    def is_valid_name(cls, name: str) -> bool:
        return bool(re.match(COMMAND_NAME_RE, name))

    def run(self, args: list[str]) -> None:
        """Execute the command. Override in subclasses."""
        raise NotImplementedError


def _load_internal_commands() -> None:
    """Load commands from core.cli."""
    cli_path = Path(__file__).parent
    for module in cli_path.iterdir():
        if module.suffix != ".py" or module.stem in ("__init__", "command"):
            continue
        with contextlib.suppress(ImportError):
            __import__(f"core.cli.{module.stem}")


def _load_addons_commands(command: Optional[str] = None) -> None:
    """Load commands from addons path: */cli/<command>.py."""
    if command is not None and not Command.is_valid_name(command):
        return

    pattern = f"*/cli/{command or '*'}.py"
    for addons_dir in config.get_addons_paths():
        if not addons_dir.exists():
            continue
        for fullpath in addons_dir.glob(pattern):
            if fullpath.stem and Command.is_valid_name(fullpath.stem):
                with contextlib.suppress(ImportError, Exception):
                    # Load script into a synthetic module
                    import importlib.util
                    spec = importlib.util.spec_from_file_location(
                        f"addon_cli.{fullpath.stem}", fullpath
                    )
                    if spec and spec.loader:
                        mod = importlib.util.module_from_spec(spec)
                        spec.loader.exec_module(mod)


def find_command(name: str):
    """Get command by name."""
    if cmd := commands.get(name):
        return cmd
    with contextlib.suppress(ImportError):
        __import__(f"core.cli.{name}")
        return commands.get(name)
    _load_addons_commands(command=name)
    return commands.get(name)


def main() -> None:
    """Main CLI entrypoint."""
    args = sys.argv[1:]

    # Parse addons-path early if present (for command discovery)
    if args and args[0].startswith("--addons-path=") and (
        len(args) == 1 or not args[1].startswith("-")
    ):
        config.parse_config([args[0]])
        if len(args) > 1:
            args = args[1:]

    if args and not args[0].startswith("-"):
        command_name = args[0]
        args = args[1:]
    elif "-h" in args or "--help" in args:
        command_name = "help"
        args = [x for x in args if x not in ("-h", "--help")]
    else:
        command_name = "server"

    _load_internal_commands()

    if cmd := find_command(command_name):
        cmd().run(args)
    else:
        sys.exit(
            f"Unknown command {command_name!r}.\n"
            f"Use '{PROG_NAME} --help' to see available commands."
        )
