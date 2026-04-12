# git_scheduler.py
import time
import subprocess

print("🤖 Iniciando reloj de Git Auto-Commit...")

while True:
    print("Ejecutando escaneo de auto-commit...")
    # Llama a tu súper script de Git
    subprocess.run(["python3", "git_automatizacion.py", "auto", "scan", "--path", "."])
    
    # Se duerme 30 minutos (1800 segundos)
    time.sleep(1800)