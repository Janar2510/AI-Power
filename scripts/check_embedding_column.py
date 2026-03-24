#!/usr/bin/env python3
"""Phase 552: Read-only check of ``ai_document_chunk.embedding`` udt (jsonb vs vector).

Usage (from ``erp-platform/``):

  .venv/bin/python scripts/check_embedding_column.py
  .venv/bin/python scripts/check_embedding_column.py -d mydb

Requires same ``PG*`` / ``erp-bin`` config as the app. Does not ALTER tables.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def main() -> int:
    parser = argparse.ArgumentParser(description="Check RAG embedding column type (read-only).")
    parser.add_argument(
        "-d",
        "--database",
        default=None,
        help="PostgreSQL database name (default: erp-bin config db_name)",
    )
    args = parser.parse_args()

    from core.tools.config import parse_config
    from core.sql_db import get_cursor

    parse_config(["--addons-path=addons"])

    table = "ai_document_chunk"
    column = "embedding"

    try:
        with get_cursor(args.database) as cr:
            cr.execute(
                """
                SELECT udt_name FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = %s AND column_name = %s
                """,
                (table, column),
            )
            row = cr.fetchone()
            if not row:
                print(f"No column public.{table}.{column} (table missing or AI module not installed).")
                return 1
            udt = row.get("udt_name") if isinstance(row, dict) else row[0]
            print(f"public.{table}.{column} -> udt_name={udt!r}")

            import importlib.util

            _pipe = ROOT / "addons" / "ai_assistant" / "embeddings" / "pipeline.py"
            _spec = importlib.util.spec_from_file_location("_erp_check_embed_pipeline", _pipe)
            _mod = importlib.util.module_from_spec(_spec)
            assert _spec.loader is not None
            _spec.loader.exec_module(_mod)
            embedding_column_is_pgvector_type = _mod.embedding_column_is_pgvector_type
            embedding_column_supported = _mod.embedding_column_supported

            is_vec = embedding_column_is_pgvector_type(cr, table, column)
            supported = embedding_column_supported(cr)
            print(f"embedding_column_is_pgvector_type: {is_vec}")
            print(f"embedding_column_supported (<=> probe): {supported}")

            if str(udt).lower() == "jsonb":
                print(
                    "\nNext steps (see addons/ai_assistant/embeddings/pipeline.py Phase 552):\n"
                    "  - Install pgvector on the server; CREATE EXTENSION vector;\n"
                    "  - Prefer fresh db init with extension, or migrate + re-embed chunks;\n"
                    "  - JSONB mode is valid; RAG uses ILIKE retrieval until native vector."
                )
            elif str(udt).lower() == "vector":
                print("\nNative pgvector column; ensure chunks are re-indexed if you migrated from JSONB.")
            return 0
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
