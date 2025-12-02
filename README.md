# Gestione Corsi ITS

Applicazione full-stack per gestire moduli, studenti ed esami.
- Frontend: Angular + Angular Material
- Backend: FastAPI (Python) + MongoDB + Poetry
- Seeder: Faker per dati realistici
- Orchestratore: setup dipendenze, DB e avvio servizi

## Funzionalità

- Moduli: CRUD, dettagli, studenti iscritti
- Studenti: CRUD, assegnazione moduli, media voti, esami con snapshot
- Esami: CRUD, filtri per data e voto
- Aggiornamenti automatici di riferimenti tra studenti e moduli

## Requisiti

- Node.js >= 18
- Python >= 3.11
- Poetry >= 1.7
- MongoDB (localhost:27017)

## Struttura del Progetto

```text
.
├── run.py                      # Orchestratore: setup backend/frontend, DB, seeder, avvio
├── backend/                    # Backend FastAPI
│   ├── pyproject.toml          # Config Poetry (dipendenze backend)
│   └── app/
│       ├── __init__.py
│       ├── main.py             # Entrypoint FastAPI (monta router /api)
│       ├── api/                # Strato API
│       │   ├── routes.py       # Router principale (aggrega i sotto-router)
│       │   └── routers/        # Endpoints REST modulari
│       │       ├── exams.py    # /api/exams
│       │       ├── modules.py  # /api/modules
│       │       └── students.py # /api/students
│       ├── core/               # Core (config e DB)
│       │   ├── __init__.py
│       │   ├── db.py           # Client/utility Mongo (Motor) e helpers
│       │   └── settings.py     # Settings (MONGO_URL, DB_NAME, API_PREFIX, CORS, ...)
│       ├── models/             # Modelli Pydantic (schema I/O)
│       │   ├── _base.py
│       │   ├── exam.py
│       │   ├── module.py
│       │   └── student.py
│       └── scripts/            # Utility per DB/seeding
│           ├── check_db.py
│           ├── reset_collections.py
│           └── seeder.py
└── frontend/                   # Frontend Angular
    ├── .npmrc                  # Config npm (es. engine-strict=false)
    ├── angular.json            # Config Angular workspace
    ├── package.json            # Script npm e dipendenze
    ├── tsconfig.app.json       # Tsconfig specifico dell’app
    ├── tsconfig.json           # Tsconfig base
    └── src/
        ├── index.html          # Shell HTML
        ├── main.ts             # Bootstrap applicazione
        ├── styles.css          # Stili globali
        ├── app/
        │   ├── app.component.ts # Root component + layout/toolbar
        │   ├── app.routes.ts    # Rotte principali (standalone routing)
        │   ├── material.module.ts # Re-export moduli Angular Material (facoltativo)
        │   ├── dashboard/
        │   │   └── dashboard.page.ts
        │   ├── exams/
        │   │   ├── exam-dialog.component.ts
        │   │   ├── exams-form.page.ts
        │   │   └── exams.page.ts
        │   ├── modules/
        │   │   ├── module-dialog.component.ts
        │   │   ├── module-form.page.ts
        │   │   └── modules.page.ts
        │   ├── shared/
        │   │   ├── api.interceptor.ts     # Prefisso http://localhost:8000 su /api/...
        │   │   ├── api.service.ts         # Client API (Moduli/Studenti/Esami)
        │   │   └── confirm-dialog.component.ts # Dialog di conferma
        │   └── students/
        │       ├── assign-module-dialog.component.ts
        │       ├── student-detail.page.ts
        │       ├── student-dialog.component.ts
        │       ├── student-form.page.ts
        │       └── students.page.ts
        └── assets/
            └── icons/
                └── favicon.svg
```

## Setup Rapido

```bash
python run.py
```

Esegue setup Poetry/npm, configura DB/indici, seeder su richiesta e avvia:
- Backend: http://localhost:8000
- Frontend: http://localhost:4200

Avvio manuale:
```bash
# Backend
cd backend
poetry install
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Frontend
cd frontend
npm install
npm start
```

## Configurazione

- MongoDB: `mongodb://localhost:27017`, DB `its_gestione` (settings.py)
- Frontend API: gestito da `api.interceptor.ts`
- Porte: backend 8000, frontend 4200

## API Principali

- Moduli: GET/POST/GET{id}/PUT{id}/DELETE{id}
- Studenti: GET/POST/GET{id}/PUT{id}/DELETE{id}, assign-module, average, exams?min_score
- Esami: GET/POST/GET{id}/PUT{id}/DELETE{id}

## Frontend (Angular Material)

- Moduli: elenco/ricerca, form, studenti iscritti
- Studenti: elenco/ricerca, dettaglio, assegnazione, media, esami ≥ 24
- Esami: elenco con filtri, form
- Dashboard: conteggi, media globale, esami ≥ 24

## Seeder

Genera moduli, studenti ed esami con snapshot; reset opzionale se DB già popolato.

## Qualità del Codice

- Struttura modulare e commenti sintetici
- Validazioni Pydantic (backend) e Reactive Forms (frontend)
- Interceptor HTTP centralizzato
- Normalizzazione data esami (YYYY-MM-DD) e snapshot coerente
- Indici unici in MongoDB (codice modulo, email/matricola, sessione esame)

## Autore

- Jhoseph Baskara

## Licenza

Questo progetto è rilasciato sotto licenza MIT.  
Consulta il file [`LICENSE`](LICENSE) per maggiori dettagli.
