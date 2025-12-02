# -*- coding: utf-8 -*-
"""
Router per la gestione degli Esami:
- Lista, dettaglio, creazione, aggiornamento, eliminazione
- Creazione/aggiornamento con snapshot del modulo (codice/nome/ore/descrizione)
"""

from datetime import date, datetime
from typing import Any

from bson import ObjectId
from fastapi import APIRouter, HTTPException

from app.core.db import get_collection
from app.models.exam import Exam, ExamDB, ModuleSnapshot

router = APIRouter()
COLL = "exams"


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
    Solleva 400 se la stringa non è un ObjectId valido (anziché 500).
    """
    try:
        return ObjectId(id_str)
    except Exception:
        raise HTTPException(status_code=400, detail="Identificativo non valido")


def normalize_exam_date(value: Any) -> str | Any:
    """
    Normalizza il campo 'data' in stringa ISO (YYYY-MM-DD) se è un date/datetime.
    In caso contrario, restituisce il valore originale.
    """
    if isinstance(value, (date, datetime)):
        # Usa solo la parte di data (compatibilità con form HTML type="date")
        return value.isoformat()[:10]
    return value


async def build_module_snapshot_or_400(module_id: str) -> dict[str, Any]:
    """
    Recupera il modulo e costruisce lo snapshot coerente.
    Solleva 400 se il modulo non esiste.
    """
    modules = get_collection("modules")
    mod = await modules.find_one({"_id": parse_object_id(module_id)})
    if not mod:
        raise HTTPException(status_code=400, detail="Modulo inesistente")
    snapshot = ModuleSnapshot(
        nome=mod["nome"],
        codice=mod["codice"],
        ore_totali=mod["ore_totali"],
        descrizione=mod.get("descrizione", "")
    )
    return snapshot.model_dump()


# -------------------------
# Endpoints
# -------------------------

@router.get("", response_model=list[ExamDB])
async def list_exams():
    """
    Elenco esami ordinati per data decrescente.
    """
    coll = get_collection(COLL)
    items: list[dict[str, Any]] = []
    async for d in coll.find({}).sort("data", -1):
        items.append(to_str_id(d))
    return items


@router.post("", response_model=ExamDB)
async def create_exam(payload: Exam):
    """
    Crea un esame.
    - Verifica che studente e modulo esistano.
    - Genera sempre lo snapshot del modulo allo stato corrente.
    - Normalizza la data in formato ISO 'YYYY-MM-DD'.
    """
    # Verifica studente esistente
    students = get_collection("students")
    if not await students.find_one({"_id": parse_object_id(payload.student_id)}):
        raise HTTPException(status_code=400, detail="Studente inesistente")

    # Snapshot modulo (solleva 400 se non esiste)
    modulo_snapshot = await build_module_snapshot_or_400(payload.module_id)

    # Documento da salvare
    doc = payload.model_dump()
    doc["modulo_snapshot"] = modulo_snapshot
    doc["data"] = normalize_exam_date(doc.get("data"))

    coll = get_collection(COLL)
    res = await coll.insert_one(doc)
    saved = await coll.find_one({"_id": res.inserted_id})
    return to_str_id(saved)


@router.get("/{id}", response_model=ExamDB)
async def get_exam(id: str):
    """
    Restituisce un esame per ID.
    """
    coll = get_collection(COLL)
    doc = await coll.find_one({"_id": parse_object_id(id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Esame non trovato")
    return to_str_id(doc)


@router.put("/{id}", response_model=ExamDB)
async def update_exam(id: str, payload: Exam):
    """
    Aggiorna un esame.
    - Aggiorna sempre lo snapshot del modulo coerentemente al modulo attuale
    - Normalizza la data in formato ISO 'YYYY-MM-DD'
    """
    coll = get_collection(COLL)

    # Verifica esistenza esame per un errore 404 più chiaro
    if not await coll.find_one({"_id": parse_object_id(id)}):
        raise HTTPException(status_code=404, detail="Esame non trovato")

    # Snapshot modulo (solleva 400 se non esiste)
    modulo_snapshot = await build_module_snapshot_or_400(payload.module_id)

    doc = payload.model_dump()
    doc["modulo_snapshot"] = modulo_snapshot
    doc["data"] = normalize_exam_date(doc.get("data"))

    await coll.update_one({"_id": parse_object_id(id)}, {"$set": doc})
    updated = await coll.find_one({"_id": parse_object_id(id)})
    return to_str_id(updated)


@router.delete("/{id}")
async def delete_exam(id: str):
    """
    Elimina un esame per ID.
    """
    coll = get_collection(COLL)
    res = await coll.delete_one({"_id": parse_object_id(id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Esame non trovato")
    return {"message": "Esame eliminato"}