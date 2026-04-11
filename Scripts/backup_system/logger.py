import os
from datetime import datetime
from pathlib import Path

# Obtiene la ruta absoluta de donde está este archivo (backup_system/)
BASE_DIR = Path(__file__).resolve().parent
LOG_FOLDER = BASE_DIR / "logs"

def escribir_log(mensaje):
    # Crea la carpeta si no existe, sin dar error
    LOG_FOLDER.mkdir(exist_ok=True)

    archivo = LOG_FOLDER / "backup.log"
    fecha = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    with open(archivo, "a", encoding="utf-8") as f:
        f.write(f"[{fecha}] {mensaje}\n")