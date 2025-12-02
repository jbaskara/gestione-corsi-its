# -*- coding: utf-8 -*-
"""
Base per i modelli Pydantic v2.
Sostituisce la vecchia Config (v1) con 'model_config' (v2) per evitare warning:
'anystr_strip_whitespace' -> 'str_strip_whitespace'
"""

from pydantic import BaseModel, ConfigDict


class ModelBase(BaseModel):
    model_config = ConfigDict(
        # Equivalente del vecchio anystr_strip_whitespace
        str_strip_whitespace=True,
        # altri settaggi comuni che usavi in v1, tradotti in v2:
        # validate_assignment=True, ecc.
        validate_assignment=True,
        # coerci tipi dove possibile
        strict=False,
        # evita errori su campi extra, se necessario (oppure 'forbid')
        extra="ignore",
    )