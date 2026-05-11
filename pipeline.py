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
    
    # Nombres de procesos PM2
    PM2_NAMES = {
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
            'Backups': Config.BACKUPS_DIR
        }
        
        missing_paths = []
        for name, path in required_paths.items():
            if not path.exists():
                missing_paths.append(f"{name}: {path}")
                self.logger.warning(f"Directorio no encontrado: {path}")
        
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
    
    def start_ecosystem(self):
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
    
    def restart_ecosystem(self):
        """Reiniciar todo el ecosistema"""
        print("\n" + "="*60)
        print("🔄 THE VAULT - REINICIANDO ECOSISTEMA")
        print("="*60 + "\n")
        
        self.logger.info("Reiniciando orquestación del sistema")
        
        # Detener y luego iniciar
        if self.stop_ecosystem():
            time.sleep(3)
            return self.start_ecosystem()
        
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

def main():
    """Punto de entrada principal"""
    print_banner()
    
    if len(sys.argv) < 2:
        print("Uso: python3 pipeline.py [comando]")
        print("\nComandos disponibles:")
        print("  start   - Iniciar todo el ecosistema")
        print("  stop    - Detener todo el ecosistema")
        print("  restart - Reiniciar todo el ecosistema")
        print("  status  - Mostrar estado actual")
        print("  health  - Verificar salud del sistema")
        sys.exit(1)
    
    orchestrator = VaultOrchestrator()
    command = sys.argv[1].lower()
    
    # Mapeo de comandos
    commands = {
        'start': orchestrator.start_ecosystem,
        'stop': orchestrator.stop_ecosystem,
        'restart': orchestrator.restart_ecosystem,
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