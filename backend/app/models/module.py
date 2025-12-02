# -*- coding: utf-8 -*-
"""
Modello logico per i Moduli (collezione 'modules').
Definisce i campi principali del modulo e l'elenco degli studenti iscritti.
Aggiornato per Pydantic v2: usa 'model_config' al posto di 'Config'.
"""

from typing import List
from pydantic import BaseModel, Field, ConfigDict


class Module(BaseModel):
    """
    Struttura dei dati di un modulo didattico.
    - nome/codice: identificativi e testo
    - ore_totali: numero di ore del modulo
    - descrizione: testo libero
    - studenti_ids: elenco di ID degli studenti iscritti (stringhe di ObjectId)
    """
    nome: str = Field(..., min_length=2, max_length=100, description="Nome del modulo")
    codice: str = Field(..., min_length=2, max_length=20, description="Codice identificativo")
    ore_totali: int = Field(..., ge=1, le=1000, description="Numero di ore totali")
    descrizione: str = Field("", max_length=1000, description="Descrizione del modulo")
    studenti_ids: List[str] = Field(default_factory=list, description="Elenco ID studenti iscritti")

    # Pydantic v2 config
    model_config = ConfigDict(
        # Equivalente del vecchio anystr_strip_whitespace
        str_strip_whitespace=True,
        # Abilita validazione su riassegnazione e imposta comportamento generale
        validate_assignment=True,
        strict=False,
        # Ignora eventuali campi extra provenienti dal DB/payload
        extra="ignore",
    )


class ModuleDB(Module):
    """
    Documento come restituito dal database, con 'id' in formato stringa.
    """
    id: str = Field(..., description="ID del documento (stringa ObjectId)")