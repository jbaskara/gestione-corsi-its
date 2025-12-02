# -*- coding: utf-8 -*-
"""
Router per la gestione degli Studenti:
- CRUD
- assegnazione moduli (sincronizza anche il modulo)
- media voti e filtro esami per soglia
"""

from typing import Any

from bson import ObjectId
from fastapi import APIRouter, HTTPException

from app.core.db import get_collection
from app.models.student import Student, StudentDB
from app.models.exam import ExamDB

router = APIRouter()
COLL = "students"


# Utilità locali ---------------------------------------------------------------

def to_str_id(doc: dict[str, Any]) -> dict[str, Any]:
    """Converte l'_id in stringa 'id' e rimuove '_id' dal documento."""
    doc["id"] = str(doc["_id"])
    doc.pop("_id", None)
    return doc


def parse_object_id(id_str: str) -> ObjectId:
    """
    Converte una stringa in ObjectId.
    Se non valida, restituisce un errore 400 invece di un 500 generico.
    """
    try:
        return ObjectId(id_str)
    except Exception:
        raise HTTPException(status_code=400, detail="Identificativo non valido")


# Endpoints --------------------------------------------------------------------

@router.get("", response_model=list[StudentDB])
async def list_students():
    """Elenca gli studenti ordinati per cognome (A→Z)."""
    coll = get_collection(COLL)
    items: list[dict[str, Any]] = []
    async for d in coll.find({}).sort("cognome", 1):
        items.append(to_str_id(d))
    return items


@router.post("", response_model=StudentDB)
async def create_student(payload: Student):
    """Crea uno studente, con controllo univocità email."""
    coll = get_collection(COLL)
    exists = await coll.find_one({"email": payload.email})
    if exists:
        raise HTTPException(status_code=400, detail="Email già registrata")
    res = await coll.insert_one(payload.model_dump())
    doc = await coll.find_one({"_id": res.inserted_id})
    return to_str_id(doc)


@router.get("/{id}", response_model=StudentDB)
async def get_student(id: str):
    """Dettaglio studente per ID."""
    coll = get_collection(COLL)
    doc = await coll.find_one({"_id": parse_object_id(id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Studente non trovato")
    return to_str_id(doc)


@router.put("/{id}", response_model=StudentDB)
async def update_student(id: str, payload: Student):
    """
    Aggiorna i dati dello studente:
    - evita conflitti di email con altri record
    - mantiene campi non presenti nel payload (es. modules_ids) grazie a $set
    """
    coll = get_collection(COLL)
    oid = parse_object_id(id)

    # Verifica conflitto email su altri documenti
    exists = await coll.find_one({"email": payload.email, "_id": {"$ne": oid}})
    if exists:
        raise HTTPException(status_code=400, detail="Email già in uso")

    # Verifica esistenza per un 404 chiaro
    if not await coll.find_one({"_id": oid}):
        raise HTTPException(status_code=404, detail="Studente non trovato")

    await coll.update_one({"_id": oid}, {"$set": payload.model_dump()})
    doc = await coll.find_one({"_id": oid})
    return to_str_id(doc)


@router.delete("/{id}")
async def delete_student(id: str):
    """
    Elimina uno studente:
    - rimuove anche il suo ID dagli elenchi 'studenti_ids' dei moduli
    """
    coll = get_collection(COLL)
    oid = parse_object_id(id)

    res = await coll.delete_one({"_id": oid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Studente non trovato")

    modules = get_collection("modules")
    # Gli ID salvati in studenti_ids sono stringhe; rimuoviamo la stringa 'id'
    await modules.update_many({}, {"$pull": {"studenti_ids": id}})
    return {"message": "Studente eliminato"}


@router.post("/{student_id}/assign-module/{module_id}")
async def assign_module(student_id: str, module_id: str):
    """
    Assegna un modulo allo studente e sincronizza il modulo.
    - Evita duplicati con $addToSet
    - Controlla che studente e modulo esistano
    """
    students = get_collection("students")
    modules = get_collection("modules")

    # Verifica esistenza documenti
    student = await students.find_one({"_id": parse_object_id(student_id)})
    if not student:
        raise HTTPException(status_code=404, detail="Studente non trovato")

    module = await modules.find_one({"_id": parse_object_id(module_id)})
    if not module:
        raise HTTPException(status_code=404, detail="Modulo non trovato")

    # Aggiorna lo studente: salva gli ID modulo come stringhe
    await students.update_one(
        {"_id": parse_object_id(student_id)},
        {"$addToSet": {"modules_ids": module_id}},
    )

    # Aggiorna il modulo: salva gli ID studente come stringhe
    await modules.update_one(
        {"_id": parse_object_id(module_id)},
        {"$addToSet": {"studenti_ids": student_id}},
    )
    return {"message": "Modulo assegnato e aggiornato"}


@router.get("/{student_id}/average")
async def student_average(student_id: str):
    """Calcola la media dei voti dello studente (arrotondata a 2 decimali)."""
    exams = get_collection("exams")
    cursor = exams.find({"student_id": student_id})
    votes: list[float] = []
    async for e in cursor:
        voto = e.get("voto")
        if voto is not None:
            votes.append(float(voto))

    if not votes:
        return {"average": None, "count": 0}

    from statistics import mean
    return {"average": round(mean(votes), 2), "count": len(votes)}


@router.get("/{student_id}/exams", response_model=dict[str, Any])
async def student_exams_with_min(student_id: str, min_score: int = 24):
    """Restituisce gli esami dello studente con voto >= soglia, ordinati per data (desc)."""
    exams = get_collection("exams")
    items: list[ExamDB] = []
    async for e in exams.find({"student_id": student_id, "voto": {"$gte": min_score}}).sort("data", -1):
        e["id"] = str(e["_id"])
        e.pop("_id", None)
        items.append(e)
    return {"min_score": min_score, "items": items}