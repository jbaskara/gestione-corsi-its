# -*- coding: utf-8 -*-
"""
Seeder per il database ITS.

Cosa fa:
- reset delle collezioni principali
- crea un set di moduli realistici
- genera studenti con dati coerenti (nome, cognome, email ITS, matricola)
- iscrive ogni studente a 3–6 moduli (sincronizzando entrambi i lati)
- crea esami realistici (data scolastica, voto plausibile, note coerenti)

Note:
- Mantiene i nomi dei campi in italiano, compatibili con API e frontend:
  Modulo: nome, codice, ore_totali, descrizione, studenti_ids
  Studente: nome, cognome, email, matricola (extra), modules_ids
  Esame: student_id, module_id, modulo_snapshot{nome,codice,ore_totali,descrizione}, data (YYYY-MM-DD), voto, note
"""

import asyncio
import random
import re
import unicodedata
from datetime import datetime
from typing import Any, Dict, List

from bson import ObjectId
from faker import Faker

from app.core.db import get_collection

# Faker configurato per nomi italiani; seed fisso per risultati ripetibili
fake = Faker("it_IT")
random.seed(42)
Faker.seed(42)


# ---------------------------------------------------------------------------
# Utility "pratiche"
# ---------------------------------------------------------------------------

def normalize_email(text: str) -> str:
    """
    Normalizza una stringa per usarla come parte locale dell'email:
    - minuscolo, rimozione accenti/diacritici
    - spazi -> punti
    - consente solo [a-z0-9.]
    - elimina punti ripetuti ed eventuali punti iniziali/finali
    """
    s = text.strip().lower()
    s = unicodedata.normalize("NFD", s)
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    s = s.replace(" ", ".")
    s = re.sub(r"[^a-z0-9\.]", "", s)
    s = re.sub(r"\.+", ".", s)
    return s.strip(".")


def school_exam_date() -> str:
    """
    Restituisce una data d'esame plausibile nel periodo scolastico 2024–2025.
    Periodi: Ott-Dic e Gen-Giu. Output in formato YYYY-MM-DD.
    """
    possible_months = [10, 11, 12, 1, 2, 3, 4, 5, 6]
    year = 2024 if random.random() < 0.5 else 2025
    month = random.choice(possible_months)
    day = random.randint(5, 25)
    return datetime(year, month, day).strftime("%Y-%m-%d")


def exam_note(voto: int, modulo_nome: str) -> str:
    """
    Genera una nota coerente con il voto e il nome del modulo.
    """
    if voto <= 20:
        return (
            f"Lo studente ha mostrato difficoltà nel modulo {modulo_nome}. "
            "Comprensione solo parziale dei concetti fondamentali."
        )
    if 21 <= voto <= 23:
        return (
            f"Prova sufficiente nel modulo {modulo_nome}. "
            "La base teorica è presente ma deve migliorare nella parte pratica."
        )
    if 24 <= voto <= 26:
        return (
            f"Buona prova nel modulo {modulo_nome}. "
            "Esercizi svolti con autonomia e codice generalmente corretto."
        )
    if 27 <= voto <= 28:
        return (
            f"Prova molto buona nel modulo {modulo_nome}. "
            "Eccellente padronanza degli argomenti e buona gestione degli errori."
        )
    # 29–30
    return (
        f"Risultato eccellente nel modulo {modulo_nome}. "
        "Ottima esposizione, codice pulito e comprensione avanzata degli argomenti."
    )


def grade_voto() -> int:
    """
    Restituisce un voto 18–30 con distribuzione plausibile:
      - 18–20: 25%
      - 21–23: 35%
      - 24–26: 25%
      - 27–30: 15%
    """
    r = random.random()
    if r <= 0.25:
        return random.randint(18, 20)
    if r <= 0.60:
        return random.randint(21, 23)
    if r <= 0.85:
        return random.randint(24, 26)
    return random.randint(27, 30)


# ---------------------------------------------------------------------------
# Reset collezioni
# ---------------------------------------------------------------------------

async def reset_collections() -> None:
    """
    Svuota le collezioni principali del database.
    """
    modules = get_collection("modules")
    students = get_collection("students")
    exams = get_collection("exams")

    print("Svuoto collezioni: modules, students, exams...")
    await modules.delete_many({})
    await students.delete_many({})
    await exams.delete_many({})


# ---------------------------------------------------------------------------
# Creazione Moduli (set fisso)
# ---------------------------------------------------------------------------

async def create_modules() -> List[Dict[str, Any]]:
    """
    Crea un set fisso di moduli ITS con i campi attesi.
    """
    print("\nCreazione Moduli ITS...\n")
    module_data = [
        ("ITS-PYT", "Programmazione Python", 80),
        ("ITS-WEB", "Sviluppo Web Frontend", 60),
        ("ITS-BCK", "Sviluppo Web Backend", 80),
        ("ITS-DBA", "Database e SQL", 60),
        ("ITS-LNX", "Sistemi Operativi Linux", 50),
        ("ITS-CBR", "Cybersecurity Fondamenti", 70),
        ("ITS-MLA", "Machine Learning e AI", 90),
        ("ITS-NET", "Networking e Sistemi", 50),
    ]

    modules_coll = get_collection("modules")
    created: List[Dict[str, Any]] = []

    for codice, nome, ore in module_data:
        doc = {
            "nome": nome,
            "codice": codice,
            "ore_totali": ore,
            "descrizione": f"Modulo ITS avanzato: {nome}",
            "studenti_ids": [],
        }
        res = await modules_coll.insert_one(doc)
        created.append({**doc, "_id": res.inserted_id})
        print(f"  - {codice} | {nome} ({ore} ore)")

    return created


# ---------------------------------------------------------------------------
# Creazione Studenti
# ---------------------------------------------------------------------------

async def create_students(n: int = 35) -> List[Dict[str, Any]]:
    """
    Genera n studenti con nome/cognome/email/matricola e modules_ids vuoto.
    Ritorna i documenti creati (con _id).
    """
    print(f"\nCreazione di {n} studenti ITS...\n")
    students_coll = get_collection("students")
    created: List[Dict[str, Any]] = []

    for i in range(1, n + 1):
        nome = fake.first_name()
        cognome = fake.last_name()

        email_local = f"{normalize_email(nome)}.{normalize_email(cognome)}"
        email = f"{email_local}@studenti.its-ict.edu.it"
        matricola = f"ITS2025-{i:04d}"

        doc = {
            "nome": nome,
            "cognome": cognome,
            "email": email,
            "matricola": matricola,      # campo extra (non richiesto dalle API), utile in fase demo
            "modules_ids": [],
        }
        res = await students_coll.insert_one(doc)
        created.append({**doc, "_id": res.inserted_id})
        print(f"  - {matricola}: {nome} {cognome} | {email}")

    return created


# ---------------------------------------------------------------------------
# Iscrizione Studenti ai Moduli
# ---------------------------------------------------------------------------

async def enroll_students(students: List[Dict[str, Any]], modules: List[Dict[str, Any]]) -> None:
    """
    Assegna a ogni studente 3–6 moduli scelti a caso.
    Aggiorna sia lo studente (modules_ids) che ogni modulo (studenti_ids) con ID in formato stringa.
    """
    print("\nIscrizione degli studenti ai moduli...\n")
    students_coll = get_collection("students")
    modules_coll = get_collection("modules")

    for stud in students:
        chosen_modules = random.sample(modules, k=random.randint(3, 6))
        module_ids_str = [str(m["_id"]) for m in chosen_modules]
        student_id_str = str(stud["_id"])

        # Aggiorna lo studente con l'elenco dei moduli iscritti (stringhe)
        await students_coll.update_one(
            {"_id": stud["_id"]},
            {"$set": {"modules_ids": module_ids_str}},
        )

        # Aggiorna ogni modulo: aggiunge lo studente iscritto (stringa)
        for m in chosen_modules:
            await modules_coll.update_one(
                {"_id": m["_id"]},
                {"$addToSet": {"studenti_ids": student_id_str}},
            )

        print(f"  - {stud['nome']} {stud['cognome']} → {len(chosen_modules)} moduli")


# ---------------------------------------------------------------------------
# Creazione Esami
# ---------------------------------------------------------------------------

async def create_exams(students: List[Dict[str, Any]]) -> None:
    """
    Per ogni studente e modulo iscritto, crea 0–2 esami in sessioni diverse.
    """
    print("\nCreazione esami...")
    exams_coll = get_collection("exams")
    modules_coll = get_collection("modules")

    total_exams = 0

    for stud in students:
        # recupera modules_ids aggiornati (se lo studente non li ha, ricarico dal DB)
        module_ids = stud.get("modules_ids")
        if not module_ids:
            fetched = await get_collection("students").find_one({"_id": stud["_id"]})
            module_ids = fetched.get("modules_ids", [])

        for mid_str in module_ids:
            mod = await modules_coll.find_one({"_id": ObjectId(mid_str)})
            if not mod:
                continue

            for _ in range(random.choice([0, 1, 2])):
                voto = grade_voto()
                data = school_exam_date()
                note = exam_note(voto, mod["nome"])

                modulo_snapshot = {
                    "nome": mod["nome"],
                    "codice": mod["codice"],
                    "ore_totali": mod["ore_totali"],
                    "descrizione": mod.get("descrizione", ""),
                }

                doc = {
                    "student_id": str(stud["_id"]),
                    "module_id": str(mod["_id"]),
                    "modulo_snapshot": modulo_snapshot,
                    "data": data,
                    "voto": voto,
                    "note": note,
                }
                await exams_coll.insert_one(doc)
                total_exams += 1

    print(f"Creati {total_exams} esami.")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

async def main():
    """
    1) reset collezioni
    2) crea moduli
    3) crea studenti
    4) iscrive studenti (3–6 moduli)
    5) crea esami realistici
    """
    await reset_collections()
    modules = await create_modules()
    students = await create_students(35)
    await enroll_students(students, modules)
    await create_exams(students)
    print("\nSEED COMPLETATO!")


if __name__ == "__main__":
    asyncio.run(main())