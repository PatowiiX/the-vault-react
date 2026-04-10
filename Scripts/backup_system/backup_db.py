import os
from datetime import datetime
from logger import escribir_log

BACKUP_FOLDER = "backups"
MAX_BACKUPS = 3

def backup_db():
    try:
        if not os.path.exists(BACKUP_FOLDER):
            os.makedirs(BACKUP_FOLDER)

        fecha = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        archivo = f"{BACKUP_FOLDER}/thevault_{fecha}.sql"

        comando = f"mysqldump -u root -p 0000 > {archivo}" #contraseña
        resultado = os.system(comando)

        if resultado == 0:
            escribir_log(f"Backup OK: {archivo}")
            limpiar_backups()
            print("Backup exitoso")
        else:
            escribir_log("ERROR: fallo mysqldump")

    except Exception as e:
        escribir_log(f"ERROR: {str(e)}")
        print("Error:", e)


def limpiar_backups():
    archivos = [
        f for f in os.listdir(BACKUP_FOLDER) if f.endswith(".sql")
    ]

    # Ordenar por nombre (funciona porque usas fecha en el nombre)
    archivos.sort()

    while len(archivos) > MAX_BACKUPS:
        viejo = archivos.pop(0)
        os.remove(f"{BACKUP_FOLDER}/{viejo}")
        escribir_log(f"Eliminado: {viejo}")