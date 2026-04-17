import subprocess
import sys
from pathlib import Path

class VaultOrchestrator:
    def __init__(self):
        # --- RUTAS ABSOLUTAS (robustas) ---
        home = Path.home()
        self.frontend_path = home / "LOCALGIT" / "the-vault-react"
        self.backend_path = self.frontend_path / "backend"
        
        # Rutas específicas que tu equipo ignoró
        scripts_path = self.frontend_path / "Scripts"
        self.autogit_path = scripts_path / "AutoGit"
        self.backups_path = scripts_path / "backup_system"

    def run(self, command, cwd=None, silent=False):
        """Wrapper para ejecutar comandos."""
        stdout = subprocess.DEVNULL if silent else None
        stderr = subprocess.DEVNULL if silent else None
        subprocess.run(command, cwd=cwd, stdout=stdout, stderr=stderr)

    def start_ecosystem(self):
        print("🚀 Levantando el ecosistema The Vault (Producción)...")
        self.run(["pm2", "delete", "all"], silent=True)

        print("🌐 Levantando Backend y Frontend...")
        self.run(["pm2", "start", "server.js", "--name", "vault-backend"], cwd=self.backend_path)
        self.run(["pm2", "start", "npm", "--name", "vault-frontend", "--", "start"], cwd=self.frontend_path)

        print("⚙️ Levantando scripts de automatización...")
        # Corregido: Llamando desde sus carpetas reales
        self.run(["pm2", "start", "scheduler.py", "--name", "vault-backups", "--interpreter", "python3"], cwd=self.backups_path)
        self.run(["pm2", "start", "git_automatizacion.py", "--name", "vault-autogit", "--interpreter", "python3"], cwd=self.autogit_path)

        self.run(["pm2", "save"])
        print("\n✅ ¡Los 4 motores están en línea!")
        self.run(["pm2", "status"])

    def stop_ecosystem(self):
        print("🛑 Apagando todo el sistema y liberando RAM...")
        self.run(["pm2", "delete", "all"], silent=True)
        self.run(["pm2", "save", "--force"], silent=True)
        print("💤 Sistema apagado completamente.")

if __name__ == "__main__":
    orchestrator = VaultOrchestrator()
    if len(sys.argv) < 2:
        print("Uso: python pipeline.py [start|stop]")
        sys.exit(1)
        
    command = sys.argv[1].lower()
    if command == "start":
        orchestrator.start_ecosystem()
    elif command == "stop":
        orchestrator.stop_ecosystem()
    else:
        print(f"Comando desconocido: {command}")