# -*- coding: utf-8 -*-
"""
Modello logico per gli Studenti (collezione 'students').
Definisce i campi anagrafici e l'elenco dei moduli a cui lo studente è iscritto.
Aggiornato per Pydantic v2: usa 'model_config' al posto di 'Config'.
"""

from typing import List
from pydantic import BaseModel, Field, EmailStr, ConfigDict


class Student(BaseModel):
    """
    Dati anagrafici dello studente.
    - nome/cognome: testo con lunghezza ragionevole
    - email: indirizzo valido (EmailStr)
    - modules_ids: elenco di ID dei moduli (stringhe di ObjectId)
    """
    nome: str = Field(..., min_length=2, max_length=100, description="Nome dello studente")
    cognome: str = Field(..., min_length=2, max_length=100, description="Cognome dello studente")
    email: EmailStr = Field(..., description="Email dello studente")
    modules_ids: List[str] = Field(default_factory=list, description="ID moduli a cui è iscritto")

    # Pydantic v2 config
    model_config = ConfigDict(
        str_strip_whitespace=True,   # equivalente del vecchio anystr_strip_whitespace
        validate_assignment=True,
        strict=False,
        extra="ignore",
    )


class StudentDB(Student):
    """
    Documento come restituito dal database, con 'id' in formato stringa.
    """
    id: str = Field(..., description="ID del documento (stringa ObjectId)")