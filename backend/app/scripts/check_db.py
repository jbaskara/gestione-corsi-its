# -*- coding: utf-8 -*-
"""
Verifica la connessione a MongoDB (Motor, async) e crea le collezioni principali se mancano.
Uso:
    poetry run python -m app.scripts.check_db
"""

import asyncio
from typing import Sequence

from app.core.db import get_db

# Collezioni essenziali del progetto
COLLECTIONS: Sequence[str] = ("modules", "students", "exams")


async def ensure_collections() -> int:
    """
    Controlla se le collezioni base esistono, altrimenti le crea.
    Stampa un riepilogo leggibile dell'operazione.
    """
    db = get_db()

    try:
        existing = await db.list_collection_names()
    except Exception as e:
        print(f"Errore nel recupero delle collection: {e}")
        return 1

    created: list[str] = []
    present: list[str] = []

    for name in COLLECTIONS:
        if name in existing:
            present.append(name)
        else:
            try:
                await db.create_collection(name)
                created.append(name)
            except Exception as e:
                print(f"Errore creazione collection '{name}': {e}")
                # Continuiamo per le altre, ma segnaliamo errore finale
                return 1

    # Output compatto e chiaro
    if present:
        print("Collection presenti:", ", ".join(present))
    if created:
        print("Collection create:", ", ".join(created))
    if not created:
        print("Nessuna nuova collection creata.")

    print("Connessione DB ok.")
    return 0


def main() -> int:
    # Esecuzione async con gestione pulita dell'event loop
    return asyncio.run(ensure_collections())


if __name__ == "__main__":
    raise SystemExit(main())