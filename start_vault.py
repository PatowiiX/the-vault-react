import subprocess
import os
from pathlib import Path

# Definir rutas base
home = Path.expanduser(Path("~"))
frontend_path = home / "LOCALGIT" / "the-vault-react"
backend_path = frontend_path / "backend"

def run_command(cmd, working_dir):
    """Ejecuta un comando y espera a que termine"""
    subprocess.run(cmd, cwd=working_dir, shell=False)

print("🧹 Limpiando procesos anteriores...")
# Matamos todo lo que huela a Vault para empezar de cero
subprocess.run(["pm2", "delete", "all"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

print("🚀 Iniciando The Vault desde cero (Debian Mode)...")

# 1. Iniciar Backend (Node)
# Usamos PM2 para que gestione los reinicios y logs automáticamente
print("📦 Arrancando Backend...")
run_command(["pm2", "start", "server.js", "--name", "vault-backend"], backend_path)

# 2. Iniciar Frontend (React)
print("💻 Arrancando Frontend...")
run_command(["pm2", "start", "npm", "--name", "vault-frontend", "--", "start"], frontend_path)

# 3. Guardar configuración para que persista
subprocess.run(["pm2", "save"])

print("\n✅ ¡Todo reiniciado con éxito!")
print("📊 Estado actual de los procesos:")
subprocess.run(["pm2", "status"])

print("\n💡 Tip: Para ver los logs en tiempo real usa: 'pm2 logs'")