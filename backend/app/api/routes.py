# -*- coding: utf-8 -*-
"""
Router principale dell'API.
Qui montiamo i router specifici per:
- Moduli (/modules)
- Studenti (/students)
- Esami (/exams)

Tenere tutto qui rende chiaro e modulare l'ordine di esposizione delle risorse.
"""

from fastapi import APIRouter

from app.api.routers.modules import router as modules_router
from app.api.routers.students import router as students_router
from app.api.routers.exams import router as exams_router

router = APIRouter()

# Moduli didattici
router.include_router(modules_router, prefix="/modules", tags=["modules"])

# Anagrafiche studenti
router.include_router(students_router, prefix="/students", tags=["students"])

# Esami e valutazioni
router.include_router(exams_router, prefix="/exams", tags=["exams"])