import subprocess
import sys
from pathlib import Path

# --- RUTAS DE TU PROYECTO ---
home = Path.expanduser(Path("~"))
frontend_path = home / "LOCALGIT" / "the-vault-react"
backend_path = frontend_path / "backend"
# Ruta donde guardaste scheduler.py y git_scheduler.py
scripts_path = frontend_path / "Scripts" 

def start_everything():
    print("🚀 Levantando el ecosistema The Vault (Producción)...")
    
    # 1. Aplicaciones Web
    print("🌐 Levantando Backend y Frontend...")
    subprocess.run(["pm2", "start", "server.js", "--name", "vault-backend"], cwd=backend_path)
    subprocess.run(["pm2", "start", "npm", "--name", "vault-frontend", "--", "start"], cwd=frontend_path)
    
    # 2. Automatizaciones (Trabajadores de fondo)
    print("⚙️ Levantando scripts de automatización...")
    # Usamos interpreter python3 para asegurar que corren bien
    subprocess.run(["pm2", "start", "scheduler.py", "--name", "vault-backups", "--interpreter", "python3"], cwd=scripts_path)
    subprocess.run(["pm2", "start", "git_scheduler.py", "--name", "vault-autogit", "--interpreter", "python3"], cwd=scripts_path)
    
    # 3. Blindaje
    subprocess.run(["pm2", "save"])
    print("\n✅ ¡Los 4 motores están en línea!")
    subprocess.run(["pm2", "status"])

def stop_everything():
    print("🛑 Apagando todo el sistema y liberando RAM...")
    subprocess.run(["pm2", "delete", "all"], stdout=subprocess.DEVNULL)
    subprocess.run(["pm2", "save", "--force"])
    print("💤 Sistema apagado completamente.")

# Controlador de argumentos
if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "stop":
        stop_everything()
    else:
        # Limpieza previa y encendido global
        subprocess.run(["pm2", "delete", "all"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        start_everything()