# -*- coding: utf-8 -*-
"""
Modello logico per gli Esami (collezione 'exams').
Salviamo anche uno snapshot del modulo al momento della prova
(codice, nome, ore, descrizione) per storicizzare le informazioni.

Note pratiche:
- Lo snapshot viene rigenerato dal router sulla base del modulo attuale:
  nel payload lato client può essere omesso (il backend lo calcola).
- La data è un 'date' (YYYY-MM-DD), coerente con gli input HTML e l'ordinamento.
- Il voto è compreso tra 0 e 30; se preferisci il minimo 18, impostalo a 18.

Aggiornato per Pydantic v2: usa 'model_config' invece della vecchia 'Config'.
"""

from datetime import date
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


class ModuleSnapshot(BaseModel):
    """Snapshot del modulo associato all'esame (stato al momento della prova)."""
    nome: str
    codice: str
    ore_totali: int
    descrizione: str | None = ""

    model_config = ConfigDict(
        # Opzioni utili generali
        str_strip_whitespace=True,
        validate_assignment=True,
        strict=False,
        extra="ignore",
    )


class Exam(BaseModel):
    """Payload di creazione/aggiornamento esame."""
    student_id: str = Field(..., description="ID dello studente (stringa ObjectId)")
    module_id: str = Field(..., description="ID del modulo (stringa ObjectId)")
    # Lo snapshot è opzionale nel payload: il backend lo ricalcola sempre.
    modulo_snapshot: Optional[ModuleSnapshot] = Field(
        default=None,
        description="Snapshot del modulo; viene calcolato dal backend se non fornito"
    )
    data: date = Field(..., description="Data dell'esame (YYYY-MM-DD)")
    voto: int = Field(..., ge=0, le=30, description="Voto (0–30)")
    note: str = Field("", max_length=1000, description="Note opzionali")

    model_config = ConfigDict(
        # Equivalente del vecchio 'populate_by_name' e encoder per date
        populate_by_name=True,
        json_encoders={date: lambda d: d.isoformat()},
        # Opzioni generali comuni
        str_strip_whitespace=True,
        validate_assignment=True,
        strict=False,
        extra="ignore",
    )


class ExamDB(Exam):
    """Documento restituito/letto dal DB con 'id' in formato stringa."""
    id: str = Field(..., description="ID del documento (stringa ObjectId)")