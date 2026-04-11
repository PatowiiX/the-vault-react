import subprocess
import os
from pathlib import Path

# Definir rutas base
home = Path.expanduser(Path("~"))
frontend_path = home / "LOCALGIT" / "the-vault-react"
backend_path = frontend_path / "backend"

# Crear carpeta para guardar los logs
log_dir = home / "LOCALGIT" / "logs"
log_dir.mkdir(exist_ok=True)

print("🚀 Iniciando The Vault en segundo plano (Debian Mode)...")

# Abrimos archivos de log. Estos serán nuestras "terminales virtuales"
out_front = open(log_dir / "frontend.log", "a")
out_back = open(log_dir / "backend.log", "a")

# 1. Iniciar Frontend (React)
subprocess.Popen(
    ["npm", "start"], 
    cwd=frontend_path, 
    stdout=out_front, 
    stderr=subprocess.STDOUT
)
print("✅ Frontend ejecutándose (Revisa logs/frontend.log)")

# 2. Iniciar Backend (Node server.js)
subprocess.Popen(
    ["node", "server.js"], 
    cwd=backend_path, 
    stdout=out_back, 
    stderr=subprocess.STDOUT
)
print("✅ Backend ejecutándose (Revisa logs/backend.log)")