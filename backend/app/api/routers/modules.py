# -*- coding: utf-8 -*-
"""
Router per la gestione dei Moduli:
- CRUD (lista, dettaglio, creazione, aggiornamento, eliminazione)
- Ordinamento per nome nella lista
- Controllo univocità del codice
- Gestione ID non validi con errore 400 (anziché 500)
"""

from typing import Any

from bson import ObjectId
from fastapi import APIRouter, HTTPException

from app.core.db import get_collection
from app.models.module import Module, ModuleDB

router = APIRouter()
COLL = "modules"


# -------------------------
# Utility locali
# -------------------------

def to_str_id(doc: dict[str, Any]) -> dict[str, Any]:
    """Converte l'_id Mongo in stringa 'id' e rimuove l'_id dal documento."""
    doc["id"] = str(doc["_id"])
    doc.pop("_id", None)
    return doc


def parse_object_id(id_str: str) -> ObjectId:
    """
    Prova a convertire una stringa in ObjectId.
    Solleva 400 se la stringa non è un ObjectId valido (anziché un 500 generico).
    """
    try:
        return ObjectId(id_str)
    except Exception:
        raise HTTPException(status_code=400, detail="Identificativo non valido")


# -------------------------
# Endpoints
# -------------------------

@router.get("", response_model=list[ModuleDB])
async def list_modules():
    """
    Elenco dei moduli ordinati per nome (asc).
    """
    coll = get_collection(COLL)
    items: list[dict[str, Any]] = []
    async for d in coll.find({}).sort("nome", 1):
        items.append(to_str_id(d))
    return items


@router.post("", response_model=ModuleDB)
async def create_module(payload: Module):
    """
    Crea un modulo.
    - Controlla che il codice sia univoco.
    """
    coll = get_collection(COLL)
    exists = await coll.find_one({"codice": payload.codice})
    if exists:
        raise HTTPException(status_code=400, detail="Codice modulo già esistente")

    res = await coll.insert_one(payload.model_dump())
    doc = await coll.find_one({"_id": res.inserted_id})
    return to_str_id(doc)


@router.get("/{id}", response_model=ModuleDB)
async def get_module(id: str):
    """
    Restituisce un modulo per ID.
    """
    coll = get_collection(COLL)
    doc = await coll.find_one({"_id": parse_object_id(id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Modulo non trovato")
    return to_str_id(doc)


@router.put("/{id}", response_model=ModuleDB)
async def update_module(id: str, payload: Module):
    """
    Aggiorna un modulo.
    - Controlla conflitti sul codice (codice univoco su altri documenti)
    - Applica un update con $set dei campi del payload
    Nota: se il documento include altri campi (es. studenti_ids) e non sono nel payload,
    verranno mantenuti finché non vengono sovrascritti esplicitamente.
    """
    coll = get_collection(COLL)

    # Verifica conflitto codice su altri moduli
    exists = await coll.find_one({"codice": payload.codice, "_id": {"$ne": parse_object_id(id)}})
    if exists:
        raise HTTPException(status_code=400, detail="Codice modulo in conflitto")

    oid = parse_object_id(id)

    # Verifica esistenza per errore 404 più chiaro
    if not await coll.find_one({"_id": oid}):
        raise HTTPException(status_code=404, detail="Modulo non trovato")

    await coll.update_one({"_id": oid}, {"$set": payload.model_dump()})
    doc = await coll.find_one({"_id": oid})
    return to_str_id(doc)


@router.delete("/{id}")
async def delete_module(id: str):
    """
    Elimina un modulo per ID.
    """
    coll = get_collection(COLL)
    res = await coll.delete_one({"_id": parse_object_id(id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Modulo non trovato")
    return {"message": "Modulo eliminato"}