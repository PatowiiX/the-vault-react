#!/usr/bin/env python3
"""
THE VAULT - Pipeline Orchestrator
Sistema de orquestación para el ecosistema The Vault
Maneja frontend React, backend Node.js y scripts de automatización
"""

import subprocess
import sys
import logging
import time
import json
import signal
import os
import argparse
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Tuple

# ==============================
#   CONFIGURACIÓN
# ==============================

class Config:
    """Configuración centralizada del sistema"""
    
    # Estructura de directorios
    HOME = Path.home()
    BASE_DIR = HOME / "LOCALGIT" / "the-vault-react"
    BACKEND_DIR = BASE_DIR / "backend"
    SCRIPTS_DIR = BASE_DIR / "Scripts"
    AUTOGIT_DIR = SCRIPTS_DIR / "AutoGit"
    BACKUPS_DIR = SCRIPTS_DIR / "backup_system"
    LOGS_DIR = BASE_DIR / "logs"
    ENV_SWITCHER_SCRIPT = BASE_DIR / "env_switcher.py"
    ENV_SWITCHER_HEARTBEAT = 300
    PYTHON_BIN = sys.executable or "python3"
    VALID_ENV_MODES = ("local", "aws")
    DEFAULT_ENV_MODE = os.environ.get("VAULT_DB_ENV", "aws").lower()
    
    # Nombres de procesos PM2
    PM2_NAMES = {
        'env_switcher': 'vault-env-switcher',
        'backend': 'vault-backend',
        'frontend': 'vault-frontend',
        'backups': 'vault-backups',
        'autogit': 'vault-autogit'
    }
    
    # Tiempos de espera (segundos)
    STARTUP_TIMEOUT = 30
    SHUTDOWN_TIMEOUT = 10
    HEALTH_CHECK_INTERVAL = 2
    
    # Configuración de logs
    LOG_LEVEL = logging.INFO
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    LOG_DATE_FORMAT = '%Y-%m-%d %H:%M:%S'

# ==============================
#   LOGGING
# ==============================

def setup_logging():
    """Configurar sistema de logging profesional"""
    
    # Crear directorio de logs
    Config.LOGS_DIR.mkdir(parents=True, exist_ok=True)
    
    # Archivo de log con fecha
    log_file = Config.LOGS_DIR / f"vault_{datetime.now().strftime('%Y%m%d')}.log"
    
    # Configurar handlers
    file_handler = logging.FileHandler(log_file)
    file_handler.setFormatter(logging.Formatter(Config.LOG_FORMAT, Config.LOG_DATE_FORMAT))
    
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(logging.Formatter('%(levelname)s: %(message)s'))
    
    # Configurar logger
    logger = logging.getLogger('VaultOrchestrator')
    logger.setLevel(Config.LOG_LEVEL)
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    return logger

# ==============================
#   CLASE PRINCIPAL
# ==============================

class VaultOrchestrator:
    """Orquestador principal del ecosistema The Vault"""
    
    def __init__(self):
        self.logger = setup_logging()
        self.running = True
        
        # Validar estructura de directorios
        self._validate_paths()
        
        # Configurar signal handlers
        signal.signal(signal.SIGTERM, self._signal_handler)
        signal.signal(signal.SIGINT, self._signal_handler)
    
    def _signal_handler(self, signum, frame):
        """Manejar señales del sistema"""
        self.logger.info(f"Recibida señal {signum}, iniciando apagado...")
        self.running = False
        self.stop_ecosystem()
        sys.exit(0)
    
    def _validate_paths(self):
        """Validar que todas las rutas necesarias existan"""
        required_paths = {
            'Frontend': Config.BASE_DIR,
            'Backend': Config.BACKEND_DIR,
            'Scripts': Config.SCRIPTS_DIR,
            'AutoGit': Config.AUTOGIT_DIR,
            'Backups': Config.BACKUPS_DIR,
            'Env switcher': Config.ENV_SWITCHER_SCRIPT
        }
        
        missing_paths = []
        for name, path in required_paths.items():
            if not path.exists():
                missing_paths.append(f"{name}: {path}")
                self.logger.warning(f"Ruta no encontrada: {path}")
        
        if missing_paths:
            self.logger.warning(f"Faltan {len(missing_paths)} directorios")
            for missing in missing_paths:
                self.logger.warning(f"  - {missing}")
    
    def _run_command(self, command: List[str], cwd: Optional[Path] = None, 
                     check: bool = False, timeout: Optional[int] = None) -> Tuple[bool, str]:
        """
        Ejecutar comando de forma segura
        
        Returns:
            Tuple[bool, str]: (éxito, mensaje de salida/error)
        """
        try:
            result = subprocess.run(
                command,
                cwd=cwd,
                capture_output=True,
                text=True,
                timeout=timeout,
                check=check
            )
            
            output = result.stdout if result.stdout else result.stderr
            success = result.returncode == 0
            
            if success:
                self.logger.debug(f"Comando exitoso: {' '.join(command)}")
            else:
                self.logger.error(f"Comando falló: {' '.join(command)}")
                self.logger.error(f"Error: {output}")
            
            return success, output.strip()
            
        except subprocess.TimeoutExpired as e:
            self.logger.error(f"Timeout ejecutando comando: {' '.join(command)}")
            return False, f"Timeout after {timeout}s"
        except Exception as e:
            self.logger.error(f"Excepción ejecutando comando: {e}")
            return False, str(e)
    
    def _check_pm2_installed(self) -> bool:
        """Verificar que PM2 esté instalado"""
        success, _ = self._run_command(["pm2", "--version"])
        if not success:
            self.logger.error("PM2 no está instalado. Instalar con: npm install -g pm2")
            return False
        return True
    
    def _get_pm2_processes(self) -> Dict[str, dict]:
        """Obtener estado de procesos PM2"""
        success, output = self._run_command(["pm2", "jlist"])
        if not success:
            return {}
        
        try:
            processes = json.loads(output)
            return {proc['name']: proc for proc in processes}
        except json.JSONDecodeError:
            self.logger.error("Error parseando respuesta de PM2")
            return {}
    
    def _is_process_running(self, process_name: str) -> bool:
        """Verificar si un proceso específico está corriendo"""
        processes = self._get_pm2_processes()
        if process_name in processes:
            return processes[process_name]['pm2_env']['status'] == 'online'
        return False
    
    def _wait_for_process(self, process_name: str, expected_state: str = 'online', 
                          timeout: int = Config.STARTUP_TIMEOUT) -> bool:
        """Esperar a que un proceso alcance un estado específico"""
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            processes = self._get_pm2_processes()
            if process_name in processes:
                status = processes[process_name]['pm2_env']['status']
                if status == expected_state:
                    self.logger.info(f"✅ {process_name} está {expected_state}")
                    return True
            time.sleep(Config.HEALTH_CHECK_INTERVAL)
        
        self.logger.error(f"❌ {process_name} no alcanzó estado {expected_state} en {timeout}s")
        return False

    def _apply_database_environment(self, env_mode: str) -> bool:
        """
        Aplicar el entorno de base de datos antes de levantar Node/React.

        env_switcher.py puede pedir credenciales la primera vez que se usa AWS,
        por eso se ejecuta en primer plano y con stdin/stdout heredados. Despues
        se crea un monitor PM2 separado para que la tabla de PM2 muestre el
        script y sus recursos sin bloquear prompts interactivos.
        """
        print(f"🌍 Aplicando entorno de Base de Datos: {env_mode.upper()}...")

        try:
            result = subprocess.run(
                [Config.PYTHON_BIN, str(Config.ENV_SWITCHER_SCRIPT), "--mode", env_mode],
                cwd=Config.BASE_DIR
            )
        except Exception as exc:
            self.logger.error(f"No se pudo ejecutar env_switcher.py: {exc}")
            return False

        if result.returncode != 0:
            self.logger.error(f"env_switcher.py falló para modo {env_mode}")
            return False

        self.logger.info(f"Entorno de BD aplicado: {env_mode}")
        return True

    def _start_env_switcher_monitor(self, env_mode: str) -> bool:
        """
        Registrar env_switcher.py como proceso PM2 observable.

        El monitor no cambia el .env; solo permanece vivo y emite heartbeats.
        Asi `pm2 list` muestra `vault-env-switcher` junto con CPU/MEM.
        """
        print("🧭 Registrando Env Switcher en PM2...")

        success, _ = self._run_command(
            [
                "pm2", "start", str(Config.ENV_SWITCHER_SCRIPT),
                "--name", Config.PM2_NAMES['env_switcher'],
                "--interpreter", Config.PYTHON_BIN,
                "--log", str(Config.LOGS_DIR / "env_switcher.log"),
                "--",
                "--mode", env_mode,
                "--pm2-monitor",
                "--heartbeat", str(Config.ENV_SWITCHER_HEARTBEAT)
            ],
            cwd=Config.BASE_DIR
        )

        if not success:
            self.logger.error("No se pudo registrar env_switcher.py en PM2")
            return False

        return self._wait_for_process(Config.PM2_NAMES['env_switcher'], 'online', timeout=10)
    
    def start_ecosystem(self, env_mode: str = Config.DEFAULT_ENV_MODE):
        """Iniciar todo el ecosistema"""
        print("\n" + "="*60)
        print("🚀 THE VAULT - INICIANDO ECOSISTEMA")
        print("="*60 + "\n")
        
        self.logger.info("Iniciando orquestación del sistema")
        
        # Verificar PM2
        if not self._check_pm2_installed():
            return False
        
        # Limpiar procesos previos
        self.logger.info("Limpiando procesos anteriores...")
        self._run_command(["pm2", "delete", "all"], check=False)

        if not self._apply_database_environment(env_mode):
            return False

        if not self._start_env_switcher_monitor(env_mode):
            return False
        
        # Iniciar backend (Node.js)
        print("📡 Levantando Backend...")
        success, _ = self._run_command(
            ["pm2", "start", "server.js", "--name", Config.PM2_NAMES['backend'], 
             "--log", str(Config.LOGS_DIR / "backend.log")],
            cwd=Config.BACKEND_DIR
        )
        
        if success:
            self._wait_for_process(Config.PM2_NAMES['backend'], 'online')
        
        # Iniciar frontend (React)
        print("🎨 Levantando Frontend...")
        success, _ = self._run_command(
            ["pm2", "start", "npm", "--name", Config.PM2_NAMES['frontend'],
             "--", "start", "--log", str(Config.LOGS_DIR / "frontend.log")],
            cwd=Config.BASE_DIR
        )
        
        if success:
            self._wait_for_process(Config.PM2_NAMES['frontend'], 'online')
        
        # Iniciar sistema de backups
        if Config.BACKUPS_DIR.exists():
            print("💾 Levantando Sistema de Backups...")
            success, _ = self._run_command(
                ["pm2", "start", "scheduler.py", "--name", Config.PM2_NAMES['backups'],
                 "--interpreter", "python3", "--log", str(Config.LOGS_DIR / "backups.log")],
                cwd=Config.BACKUPS_DIR
            )
            
            if success:
                self._wait_for_process(Config.PM2_NAMES['backups'], 'online')
        else:
            self.logger.warning(f"Backup system no encontrado: {Config.BACKUPS_DIR}")
        
        # Iniciar AutoGit
        if Config.AUTOGIT_DIR.exists():
            print("🔄 Levantando AutoGit...")
            success, _ = self._run_command(
                ["pm2", "start", "git_automatizacion.py", "--name", Config.PM2_NAMES['autogit'],
                 "--interpreter", "python3", "--log", str(Config.LOGS_DIR / "autogit.log")],
                cwd=Config.AUTOGIT_DIR
            )
            
            if success:
                self._wait_for_process(Config.PM2_NAMES['autogit'], 'online')
        else:
            self.logger.warning(f"AutoGit no encontrado: {Config.AUTOGIT_DIR}")
        
        # Guardar configuración PM2
        self._run_command(["pm2", "save"])
        
        # Mostrar estado final
        self._show_status()
        
        print("\n✅ ¡ECOSISTEMA COMPLETAMENTE OPERATIVO!\n")
        return True
    
    def stop_ecosystem(self, graceful: bool = True):
        """Detener todo el ecosistema"""
        print("\n" + "="*60)
        print("🛑 THE VAULT - DETENIENDO ECOSISTEMA")
        print("="*60 + "\n")
        
        self.logger.info("Deteniendo orquestación del sistema")
        
        # Verificar qué procesos están corriendo
        running_processes = self._get_pm2_processes()
        
        if not running_processes:
            self.logger.info("No hay procesos activos para detener")
            return True
        
        # Detener cada proceso
        for name in Config.PM2_NAMES.values():
            if name in running_processes:
                print(f"⏹️  Deteniendo {name}...")
                
                if graceful:
                    # Detención graceful
                    self._run_command(["pm2", "stop", name], check=False)
                    self._run_command(["pm2", "delete", name], check=False)
                else:
                    # Detención forzada
                    self._run_command(["pm2", "delete", name, "--force"], check=False)
        
        # Limpiar todo
        self._run_command(["pm2", "delete", "all"], check=False)
        self._run_command(["pm2", "save", "--force"], check=False)
        
        # Verificar que todo esté detenido
        time.sleep(2)
        remaining = self._get_pm2_processes()
        
        if remaining:
            self.logger.warning(f"Quedan {len(remaining)} procesos activos")
        else:
            self.logger.info("Todos los procesos detenidos correctamente")
        
        print("\n💤 SISTEMA COMPLETAMENTE DETENIDO\n")
        return True
    
    def restart_ecosystem(self, env_mode: str = Config.DEFAULT_ENV_MODE):
        """Reiniciar todo el ecosistema"""
        print("\n" + "="*60)
        print("🔄 THE VAULT - REINICIANDO ECOSISTEMA")
        print("="*60 + "\n")
        
        self.logger.info("Reiniciando orquestación del sistema")
        
        # Detener y luego iniciar
        if self.stop_ecosystem():
            time.sleep(3)
            return self.start_ecosystem(env_mode)
        
        return False
    
    def _show_status(self):
        """Mostrar estado detallado del sistema"""
        print("\n" + "="*60)
        print("📊 ESTADO DEL ECOSISTEMA")
        print("="*60)
        
        success, output = self._run_command(["pm2", "status"])
        if success:
            print(output)
        
        # Mostrar logs recientes
        print("\n📝 Últimas entradas de log:")
        for log_file in Config.LOGS_DIR.glob("*.log"):
            if log_file.stat().st_size > 0:
                print(f"\n  {log_file.name}:")
                try:
                    with open(log_file, 'r') as f:
                        last_lines = f.readlines()[-3:]
                        for line in last_lines:
                            print(f"    {line.strip()}")
                except Exception as e:
                    print(f"    Error leyendo log: {e}")
        
        print("="*60 + "\n")
    
    def status(self):
        """Mostrar estado actual del sistema"""
        self._show_status()
    
    def health_check(self) -> bool:
        """Verificar salud del sistema"""
        self.logger.info("Ejecutando health check...")
        
        processes = self._get_pm2_processes()
        expected_names = set(Config.PM2_NAMES.values())
        running_names = set(processes.keys())
        
        missing = expected_names - running_names
        if missing:
            self.logger.warning(f"Procesos faltantes: {missing}")
            return False
        
        all_online = all(processes[name]['pm2_env']['status'] == 'online' 
                        for name in running_names if name in expected_names)
        
        if all_online:
            self.logger.info("Health check: ✅ TODO OK")
        else:
            self.logger.warning("Health check: ⚠️ Algunos procesos no están online")
        
        return all_online

# ==============================
#   CLI Y MAIN
# ==============================

def print_banner():
    """Mostrar banner del sistema"""
    banner = """
    ╔════════════════════════════════════════════╗
    ║         🔐 THE VAULT PIPELINE 🔐          ║
    ║         Sistema de Orquestación           ║
    ╚════════════════════════════════════════════╝
    """
    print(banner)

def parse_args() -> argparse.Namespace:
    """Parsear CLI manteniendo compatibilidad con `pipeline.py start aws`."""
    default_env = (
        Config.DEFAULT_ENV_MODE
        if Config.DEFAULT_ENV_MODE in Config.VALID_ENV_MODES
        else "aws"
    )

    parser = argparse.ArgumentParser(
        prog="pipeline.py",
        description="Orquestador PM2 para el ecosistema The Vault.",
    )
    parser.add_argument(
        "command",
        nargs="?",
        choices=["start", "stop", "restart", "status", "health"],
        help="Accion a ejecutar.",
    )
    parser.add_argument(
        "env_positional",
        nargs="?",
        choices=Config.VALID_ENV_MODES,
        help=argparse.SUPPRESS,
    )
    parser.add_argument(
        "--env",
        dest="env_mode",
        choices=Config.VALID_ENV_MODES,
        default=default_env,
        help=(
            "Entorno de BD para start/restart. Tambien se puede definir con "
            "VAULT_DB_ENV=local|aws."
        ),
    )

    args = parser.parse_args()
    if args.command is None:
        parser.print_help()
        sys.exit(1)

    if args.env_positional:
        args.env_mode = args.env_positional

    return args

def main():
    """Punto de entrada principal"""
    print_banner()
    args = parse_args()
    
    orchestrator = VaultOrchestrator()
    command = args.command.lower()
    
    # Mapeo de comandos
    commands = {
        'start': lambda: orchestrator.start_ecosystem(args.env_mode),
        'stop': orchestrator.stop_ecosystem,
        'restart': lambda: orchestrator.restart_ecosystem(args.env_mode),
        'status': orchestrator.status,
        'health': orchestrator.health_check
    }
    
    if command in commands:
        try:
            result = commands[command]()
            if result is False:
                sys.exit(1)
        except KeyboardInterrupt:
            print("\n\n⚠️ Interrupción recibida. Deteniendo...")
            orchestrator.stop_ecosystem()
            sys.exit(0)
        except Exception as e:
            orchestrator.logger.error(f"Error inesperado: {e}")
            sys.exit(1)
    else:
        print(f"❌ Comando desconocido: {command}")
        print("Usa: start, stop, restart, status, health")
        sys.exit(1)

if __name__ == "__main__":
    main()
# Fin del archivo pipeline.py
