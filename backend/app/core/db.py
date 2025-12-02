# -*- coding: utf-8 -*-
"""
Gestione della connessione a MongoDB con Motor (async).
Offre funzioni semplici per ottenere client, database e collezioni.

Note pratiche:
- Il client Motor è thread-safe e va riutilizzato: qui lo istanziamo una volta sola (lazy).
- I nomi di DB e URI arrivano dalle impostazioni (vedi app/core/settings.py).
- Se serve chiudere la connessione a fine vita dell'app, usa close_client() nel ciclo di shutdown.
"""

from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase, AsyncIOMotorCollection
from app.core import settings

# Client condiviso (lazy init)
_client: Optional[AsyncIOMotorClient] = None


def get_client() -> AsyncIOMotorClient:
    """
    Restituisce il client MongoDB asincrono.
    Se non esiste ancora, lo crea usando l'URI dalle impostazioni (settings.MONGO_URL).
    """
    global _client
    if _client is None:
        # Istanzia il client una volta sola; Motor gestisce internamente il pool di connessioni.
        _client = AsyncIOMotorClient(settings.MONGO_URL)
    return _client


def close_client() -> None:
    """
    Chiude il client MongoDB, se inizializzato.
    Utile in fase di shutdown dell'applicazione.
    """
    global _client
    if _client is not None:
        _client.close()
        _client = None


def get_db() -> AsyncIOMotorDatabase:
    """
    Restituisce il database configurato (settings.DB_NAME).
    """
    return get_client()[settings.DB_NAME]


def get_collection(name: str) -> AsyncIOMotorCollection:
    """
    Restituisce una collezione del database corrente.
    Esempio: coll = get_collection("students")
    """
    return get_db()[name]