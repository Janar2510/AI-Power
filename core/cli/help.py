"""Help command."""

from . import Command


class Help(Command):
    """Show help for a command or list all commands."""

    def run(self, args: list[str]) -> None:
        if args and not args[0].startswith("-"):
            cmd_name = args[0]
            cmd = __import__("core.cli.command", fromlist=["find_command"]).find_command(
                cmd_name
            )
            if cmd:
                cmd().parser.print_help()
            else:
                print(f"Unknown command: {cmd_name}")
        else:
            self.parser.add_argument(
                "command",
                nargs="?",
                help="Command to show help for",
            )
            parsed = self.parser.parse_args(args)
            if parsed.command:
                cmd = __import__(
                    "core.cli.command", fromlist=["find_command"]
                ).find_command(parsed.command)
                if cmd:
                    cmd().parser.print_help()
                else:
                    print(f"Unknown command: {parsed.command}")
            else:
                print("ERP Platform - AI-Powered Modular ERP")
                print()
                print("Usage: erp-bin [--addons-path=PATH,...] <command> [options]")
                print()
                print("Commands:")
                for name, cls in sorted(
                    __import__("core.cli.command", fromlist=["commands"]).commands.items()
                ):
                    desc = (cls.description or cls.__doc__ or "").split("\n")[0]
                    print(f"  {name:<20} {desc}")
                print()
                print("Use 'erp-bin help <command>' for command-specific help.")
