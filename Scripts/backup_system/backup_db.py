import subprocess
from pathlib import Path
from datetime import datetime
from logger import escribir_log

BASE_DIR = Path(__file__).resolve().parent
BACKUP_FOLDER = BASE_DIR / "backups"
MAX_BACKUPS = 3

def backup_db():
    try:
        BACKUP_FOLDER.mkdir(exist_ok=True)
        fecha = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        archivo = BACKUP_FOLDER / f"thevault_{fecha}.sql"

        # Comando mysqldump con fix SSL
        comando = [
            "mysqldump",
            "-u", "root",
            "-p0000",
            "--skip-ssl",  # Te amo (pavlo)
            "--result-file", str(archivo),
            "thevault"
        ]

        # Ejecutar comando
        resultado = subprocess.run(
            comando,
            check=True,
            capture_output=True,
            text=True
        )

        escribir_log(f"Backup OK: {archivo.name}")
        limpiar_backups()
        print("Backup exitoso")

    except subprocess.CalledProcessError as e:
        error_msg = f"ERROR: fallo mysqldump. Detalle: {e.stderr.strip()}"
        escribir_log(error_msg)
        print(error_msg)

    except Exception as e:
        escribir_log(f"ERROR GENERAL: {str(e)}")
        print("Error:", e)


def limpiar_backups():
    archivos = sorted([f for f in BACKUP_FOLDER.glob("*.sql")])

    while len(archivos) > MAX_BACKUPS:
        viejo = archivos.pop(0)
        viejo.unlink()
        escribir_log(f"Rotación: Eliminado {viejo.name}")