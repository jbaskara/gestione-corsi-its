# -*- coding: utf-8 -*-
"""
Reset delle collezioni principali:
    modules, students, exams

Uso:
    poetry run python -m app.scripts.reset_collections
"""

import asyncio
from typing import Sequence

from app.core.db import get_db

COLLECTIONS: Sequence[str] = ("modules", "students", "exams")


async def reset() -> int:
    db = get_db()
    try:
        for name in COLLECTIONS:
            coll = db[name]
            res = await coll.delete_many({})
            print(f"  - Svuotata '{name}': {res.deleted_count} documenti rimossi")
        return 0
    except Exception as e:
        print(f"Errore durante il reset delle collezioni: {e}")
        return 1


def main() -> int:
    return asyncio.run(reset())


if __name__ == "__main__":
    raise SystemExit(main())