"""
Impostazioni di progetto per il backend (FastAPI + MongoDB).

Questo modulo definisce l'oggetto 'settings' da importare con:
    from app.core import settings

Valori di default pensati per lo sviluppo locale. Possono essere
sovrascritti tramite variabili d'ambiente.
"""

import os
from dataclasses import dataclass

@dataclass(frozen=True)
class Settings:
    # MongoDB
    MONGO_URL: str = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    DB_NAME: str = os.getenv("DB_NAME", "its_gestione")

    # Server
    API_PREFIX: str = os.getenv("API_PREFIX", "/api")
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    # Ambiente / debug
    ENV: str = os.getenv("ENV", "development")
    DEBUG: bool = os.getenv("DEBUG", "true").lower() in ("1", "true", "yes", "y")

# Istanza condivisa da importare
settings = Settings()