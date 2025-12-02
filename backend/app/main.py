# -*- coding: utf-8 -*-
"""
Punto di ingresso dell'app FastAPI.
Configura CORS per il frontend e monta le rotte dell'API.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import corretti rispetto al package 'app'
from app.core import settings
from app.core.db import close_client
from app.api.routes import router as api_router  # usa app.api.routes (non app.routers)

app = FastAPI(title="Gestione Corsi ITS API", version="1.0.0")

# Abilita chiamate dal frontend Angular (sviluppo)
app.add_middleware(
    CORSMiddleware,
    allow_origins=(getattr(settings, "CORS_ALLOW_ORIGINS", None) or ["http://localhost:4200"]),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = getattr(settings, "API_PREFIX", "/api")

# Monta tutte le rotte sotto /api
app.include_router(api_router, prefix=API_PREFIX)


@app.get("/health")
def health():
    """Verifica rapida della salute del servizio."""
    return {"status": "ok"}


@app.on_event("shutdown")
def on_shutdown():
    """Chiude il client MongoDB alla terminazione dell'app."""
    close_client()