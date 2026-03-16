"""Database backup cron hook (Phase 145)."""

import logging
import os
import subprocess
from datetime import datetime
from pathlib import Path

from core.orm import Model
from core.tools import config

_logger = logging.getLogger("erp.db_backup")


class BaseDbBackup(Model):
    """Cron hook for automated database backup. Uses pg_dump."""

    _name = "base.db.backup"
    _description = "Database Backup"

    @classmethod
    def run(cls) -> str:
        """Cron entrypoint: run pg_dump for the configured database.
        Returns path to backup file or empty string on failure."""
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        if not env:
            return ""
        db_name = getattr(cls._registry, "db_name", None) or config.get_config().get("db_name", "erp")
        backup_dir = _get_backup_dir()
        if not backup_dir:
            _logger.warning("No backup directory configured; set db.backup_dir or --backup-dir")
            return ""
        Path(backup_dir).mkdir(parents=True, exist_ok=True)
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"{db_name}_{timestamp}.sql"
        filepath = os.path.join(backup_dir, filename)
        cfg = config.get_config()
        try:
            result = subprocess.run(
                [
                    "pg_dump",
                    "-h", str(cfg.get("db_host", "localhost")),
                    "-p", str(cfg.get("db_port", 5432)),
                    "-U", str(cfg.get("db_user", "postgres")),
                    "-d", db_name,
                    "-f", filepath,
                    "--no-owner",
                    "--no-acl",
                ],
                env={**os.environ, "PGPASSWORD": str(cfg.get("db_password", ""))},
                capture_output=True,
                text=True,
                timeout=3600,
            )
            if result.returncode != 0:
                _logger.warning("pg_dump failed: %s", result.stderr)
                return ""
            _logger.info("Backup created: %s", filepath)
            return filepath
        except subprocess.TimeoutExpired:
            _logger.warning("pg_dump timed out")
            return ""
        except FileNotFoundError:
            _logger.warning("pg_dump not found; install PostgreSQL client tools")
            return ""
        except Exception as e:
            _logger.exception("Backup failed: %s", e)
            return ""


def _get_backup_dir() -> str:
    """Get backup directory from config or ir.config_parameter."""
    cfg = config.get_config()
    backup_dir = cfg.get("backup_dir", "")
    if backup_dir:
        return backup_dir
    try:
        env = getattr(
            getattr(BaseDbBackup, "_registry", None),
            "_env",
            None,
        )
        if env:
            Param = env.get("ir.config_parameter")
            if Param:
                return (Param.get_param("db.backup_dir") or "").strip()
    except Exception:
        pass
    return ""
