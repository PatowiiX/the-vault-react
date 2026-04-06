import os
from datetime import datetime

LOG_FOLDER = "logs"

def escribir_log(mensaje):
    if not os.path.exists(LOG_FOLDER):
        os.makedirs(LOG_FOLDER)

    archivo = f"{LOG_FOLDER}/backup.log"
    fecha = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    with open(archivo, "a", encoding="utf-8") as f:
        f.write(f"[{fecha}] {mensaje}\n")