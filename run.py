# -*- coding: utf-8 -*-
"""
run.py

Orchestratore per il progetto Gestione Corsi ITS.

Cosa fa:
1) Verifica strumenti (Poetry, Node/npm)
2) Prepara backend (poetry install, check DB)
3) Crea collezioni e indici essenziali in MongoDB (idempotente)
4) Chiede se resettare/generare dati Faker (seeder completo)
5) Avvia backend (FastAPI/Uvicorn) e frontend (Angular) con terminazione pulita
"""

import os
import sys
import time
import signal
import platform
import subprocess
import threading
from pathlib import Path

# --- Config path ---
ROOT = Path(__file__).parent.resolve()
BACKEND_DIR = ROOT / "backend"
FRONTEND_DIR = ROOT / "frontend"

IS_WINDOWS = os.name == "nt" or platform.system().lower().startswith("win")

# Coordinazione shutdown
_shutdown = threading.Event()


def _signal_handler(signum, frame):
    print("\nSegnale ricevuto, arresto in corso...", flush=True)
    _shutdown.set()


# Registra handler per SIGINT/SIGTERM
try:
    signal.signal(signal.SIGINT, _signal_handler)
except Exception:
    pass
try:
    signal.signal(signal.SIGTERM, _signal_handler)
except Exception:
    pass


# --- DB helpers (fix import path) ---
def connect_db():
    """
    Connette a MongoDB usando le impostazioni del backend (app.core.settings).
    Aggiunge BACKEND_DIR a sys.path per importare correttamente 'app.core'.
    """
    try:
        backend_path = str(BACKEND_DIR)
        if backend_path not in sys.path:
            sys.path.insert(0, backend_path)

        from pymongo import MongoClient
        # Import aggiornato: usa app.core al posto di app.config
        from app.core import settings

        client = MongoClient(settings.MONGO_URL)
        db = client[settings.DB_NAME]
        return db
    except Exception as e:
        print(f"Avviso: impossibile connettersi a MongoDB ora ({e}). Proseguo senza operazioni DB.")
        return None


def db_has_data(db) -> bool:
    if db is None:
        return False
    try:
        modules_count = db["modules"].count_documents({})
        students_count = db["students"].count_documents({})
        exams_count = db["exams"].count_documents({})
        return (modules_count + students_count + exams_count) > 0
    except Exception:
        return False


def create_collections_if_missing(db):
    if db is None:
        return
    try:
        required_collections = ["modules", "students", "exams"]
        existing = db.list_collection_names()
        print("\nVerifica/creazione collezioni...")
        for name in required_collections:
            if name not in existing:
                db.create_collection(name)
                print(f"  ✓ Creata collezione: {name}")
            else:
                print(f"  • Collezione già presente: {name}")
    except Exception as e:
        print(f"Avviso: errore nella creazione collezioni: {e}")


def create_indexes(db):
    if db is None:
        return
    try:
        print("\nCreazione indici (se non esistono già)...")
        # Moduli: codice univoco (campo 'codice')
        db.modules.create_index("codice", unique=True, name="unique_module_code")

        # Studenti: email univoca
        db.students.create_index("email", unique=True, name="unique_student_email")

        # Studenti: matricola (se presente)
        db.students.create_index("matricola", unique=True, name="unique_student_matricola")

        # Esami: vincolo univoco su student_id, module_id, data
        db.exams.create_index(
            [("student_id", 1), ("module_id", 1), ("data", 1)],
            unique=True,
            name="unique_exam_session",
        )
        print("  ✓ Indici creati / già presenti")
    except Exception as e:
        print(f"Avviso: errore nella creazione indici: {e}")


def ask_yes_no(prompt: str, default: bool | None = None) -> bool:
    while True:
        try:
            answer = input(prompt).strip().lower()
        except EOFError:
            return bool(default) if default is not None else False

        if not answer:
            if default is not None:
                return default
            print("Per favore rispondi 's' oppure 'n'.")
            continue
        if answer in ("s", "si", "sì", "y", "yes"):
            return True
        if answer in ("n", "no"):
            return False
        print("Risposta non valida. Scrivi 's' oppure 'n'.")


# --- Orchestrator helpers ---
def log(msg: str):
    print(msg, flush=True)


def check_cmd_exists(exe: str) -> str:
    from shutil import which
    return which(exe) or ""


def npx_path() -> str:
    npx = "npx.cmd" if IS_WINDOWS else "npx"
    found = check_cmd_exists(npx)
    return found or npx


def run_cmd(cmd, cwd=None, env=None) -> subprocess.Popen:
    creationflags = 0
    preexec_fn = None
    if IS_WINDOWS:
        # Necessario per poter inviare CTRL_BREAK_EVENT al processo/gruppo
        creationflags = subprocess.CREATE_NEW_PROCESS_GROUP
    else:
        # Crea un nuovo group per poter inviare SIGINT/SIGKILL al gruppo
        preexec_fn = os.setsid

    return subprocess.Popen(
        cmd,
        cwd=str(cwd) if cwd else None,
        env=env or os.environ.copy(),
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        creationflags=creationflags,
        preexec_fn=preexec_fn,
        bufsize=1,  # line-buffered
    )


def _start_reader_thread(name: str, proc: subprocess.Popen) -> threading.Thread:
    def _reader():
        try:
            if proc.stdout is None:
                return
            for line in iter(proc.stdout.readline, ""):
                if not line:
                    break
                print(line.rstrip(), flush=True)
        except Exception:
            pass
    t = threading.Thread(target=_reader, name=f"{name}-reader", daemon=True)
    t.start()
    return t


def _kill_tree_windows(pid: int):
    # Termina il processo e tutta la gerarchia su Windows
    try:
        subprocess.run(["taskkill", "/PID", str(pid), "/T", "/F"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception:
        pass


def terminate_proc(proc: subprocess.Popen, name: str, timeout: float = 8.0):
    if not proc:
        return
    if proc.poll() is not None:
        return
    try:
        log(f"\n→ Arresto {name} in corso...")
        if IS_WINDOWS:
            # invia CTRL+BREAK al gruppo del processo (richiede CREATE_NEW_PROCESS_GROUP)
            try:
                proc.send_signal(signal.CTRL_BREAK_EVENT)
            except Exception:
                try:
                    proc.terminate()
                except Exception:
                    pass
        else:
            try:
                # invia SIGINT all'intero process group
                os.killpg(os.getpgid(proc.pid), signal.SIGINT)
            except Exception:
                try:
                    proc.terminate()
                except Exception:
                    pass

        t0 = time.time()
        while proc.poll() is None and (time.time() - t0) < timeout:
            time.sleep(0.2)

        if proc.poll() is None:
            log(f"→ Terminazione forzata di {name}...")
            if IS_WINDOWS:
                _kill_tree_windows(proc.pid)
            else:
                try:
                    os.killpg(os.getpgid(proc.pid), signal.SIGKILL)
                except Exception:
                    try:
                        proc.kill()
                    except Exception:
                        pass
    except Exception:
        try:
            if IS_WINDOWS:
                _kill_tree_windows(proc.pid)
            else:
                proc.kill()
        except Exception:
            pass


def run_seeder_via_backend():
    """
    Esegue il seeder del backend come modulo (equivalente a:
    poetry run python -m app.scripts.seeder).
    """
    poetry = check_cmd_exists("poetry")
    if not poetry:
        log("Avviso: Poetry non trovato, salto seeder.")
        return 1
    seed = subprocess.run([poetry, "run", "python", "-m", "app.scripts.seeder"], cwd=str(BACKEND_DIR))
    return seed.returncode


def main():
    log("=== Gestione Corsi ITS ===\n")

    # Verifica Poetry
    log("Verifica Poetry...")
    poetry = check_cmd_exists("poetry")
    if not poetry:
        log("ERRORE: Poetry non trovato nel PATH.")
        return 1
    log("Poetry trovato.\n")

    # Backend setup
    log("Setup backend...\n")
    log("> Eseguo: poetry install --no-root")
    install = subprocess.run([poetry, "install", "--no-root"], cwd=str(BACKEND_DIR))
    if install.returncode != 0:
        return install.returncode

    log("> Eseguo: poetry run python -m app.scripts.check_db")
    check = subprocess.run([poetry, "run", "python", "-m", "app.scripts.check_db"], cwd=str(BACKEND_DIR))
    if check.returncode != 0:
        return check.returncode

    # DB: collezioni/indici (idempotenti)
    db = connect_db()
    create_collections_if_missing(db)
    create_indexes(db)

    # Seeder/reset
    if db_has_data(db):
        log("\n⚠️  Il database contiene già dei dati.")
        if ask_yes_no("Vuoi AZZERARE tutto e rigenerare i dati Faker? [s/N]: ", default=False):
            log("\nSvuoto collezioni e rigenero dati Faker...")
            reset_rc = subprocess.run([poetry, "run", "python", "-m", "app.scripts.reset_collections"], cwd=str(BACKEND_DIR)).returncode
            if reset_rc != 0:
                log("Avviso: reset_collections fallito o non presente, continuo.")
            create_collections_if_missing(db)
            create_indexes(db)
            seeder_rc = run_seeder_via_backend()
            if seeder_rc != 0:
                return seeder_rc
        else:
            log("OK, mantengo i dati esistenti.")
    else:
        log("\nIl database è vuoto.")
        if ask_yes_no("Vuoi generare dati di esempio con Faker adesso? [S/n]: ", default=True):
            seeder_rc = run_seeder_via_backend()
            if seeder_rc != 0:
                return seeder_rc
        else:
            log("Salto la generazione dei dati di esempio.")

    # Frontend setup
    log("\nSetup frontend...\n")
    log("Verifica Node.js e npm...")
    node = check_cmd_exists("node")
    npm = check_cmd_exists("npm.cmd" if IS_WINDOWS else "npm")
    if not node or not npm:
        log("ERRORE: Node.js/npm non trovati nel PATH.")
        return 1

    log(f"Node: {node}\nnpm: {npm}\n")
    if not FRONTEND_DIR.exists():
        log(f"ERRORE: Cartella frontend non trovata: {FRONTEND_DIR}")
        return 1
    log(f"Verifica cartella frontend: {FRONTEND_DIR}\nCartella frontend valida.\n")

    log("> Eseguo: npm install")
    install_fe = subprocess.run([npm, "install"], cwd=str(FRONTEND_DIR))
    if install_fe.returncode != 0:
        return install_fe.returncode

    log("> Eseguo: npx ng analytics disable")
    subprocess.run([npx_path(), "ng", "analytics", "disable"], cwd=str(FRONTEND_DIR))

    # Avvio backend e frontend
    log("\nAvvio backend e frontend...\n")
    log("> Avvio: poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload")
    backend_cmd = [poetry, "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
    backend = run_cmd(backend_cmd, cwd=str(BACKEND_DIR))
    _start_reader_thread("backend", backend)

    # Avvio frontend standard; se fallisce, tenta porta alternativa (script start:alt)
    log("> Avvio: npm start")
    start_cmd = [npm, "start"]
    frontend = run_cmd(start_cmd, cwd=str(FRONTEND_DIR))
    _start_reader_thread("frontend", frontend)

    log("Backend:  http://localhost:8000")
    log("Frontend: http://localhost:4200")
    log("Premi CTRL+C per interrompere.\n")

    try:
        while not _shutdown.is_set():
            # Uscita se uno dei due termina
            if backend.poll() is not None:
                log("Backend terminato.")
                break

            if frontend.poll() is not None:
                log("Frontend terminato. Provo avvio alternativo su porta 4300...")
                alt_cmd = [npm, "run", "start:alt"]
                frontend = run_cmd(alt_cmd, cwd=str(FRONTEND_DIR))
                _start_reader_thread("frontend-alt", frontend)
                log("Frontend (alternativo): http://localhost:4300")

            # attende poco per reagire ai segnali
            _shutdown.wait(0.2)
    except KeyboardInterrupt:
        # Dovrebbe essere intercettato dal signal handler, ma garantiamo
        _shutdown.set()
    finally:
        terminate_proc(frontend, "frontend (Angular)")
        terminate_proc(backend, "backend (Uvicorn)")

    return 0


if __name__ == "__main__":
    try:
        code = main()
    except KeyboardInterrupt:
        code = 0
    sys.exit(code)