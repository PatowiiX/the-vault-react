#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Automatización avanzada de operaciones Git/GitHub en Python.
Permite clonar, commit, push, pull, manejo de ramas, tags, diff, configuración, etc.
Incluye auto-commit por etiquetas #git-auto con sistema FIFO y auditoría.
Uso: python script.py <comando> [opciones]
"""

import logging
import sys
import re
import json
import sqlite3
import hashlib
from pathlib import Path
from typing import List, Optional, Union, Dict, Tuple
from datetime import datetime, timedelta
from collections import deque
import argparse
from git import Repo, GitCommandError, InvalidGitRepositoryError, RemoteReference

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s: %(message)s'
)
logger = logging.getLogger(__name__)


class GitAutomationError(Exception):
    """Excepción base para errores de GitAutomation."""
    pass


class AutoCommitTracker:
    """Gestiona el tracking de auto-commits con FIFO y auditoría."""
    
    def __init__(self, repo_path: Path):
        self.repo_path = repo_path
        self.state_dir = repo_path / ".auto_git_state"
        self.db_path = self.state_dir / "auto_commits.db"
        self.fifo_path = self.state_dir / "fifo_queue.json"
        self.config_path = self.state_dir / "config.json"
        
        self._init_state_dir()
        self._init_database()
        self._init_config()
    
    def _init_state_dir(self):
        """Crea el directorio de estado si no existe."""
        self.state_dir.mkdir(exist_ok=True)
    
    def _init_database(self):
        """Inicializa la base de datos SQLite para auditoría."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS auto_commits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                commit_hash TEXT NOT NULL,
                file_path TEXT NOT NULL,
                line_number INTEGER,
                author TEXT NOT NULL,
                author_email TEXT,
                message TEXT,
                timestamp TEXT NOT NULL,
                tag_content TEXT,
                UNIQUE(commit_hash, file_path)
            )
        ''')
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_commit_hash 
            ON auto_commits(commit_hash)
        ''')
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_author 
            ON auto_commits(author)
        ''')
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_timestamp 
            ON auto_commits(timestamp DESC)
        ''')
        conn.commit()
        conn.close()
    
    def _init_config(self):
        """Inicializa la configuración por defecto."""
        if not self.config_path.exists():
            default_config = {
                "max_fifo_size": 10,
                "min_interval_minutes": 5,
                "max_auto_commits_per_hour": 5,
                "allowed_extensions": [".py", ".js", ".html", ".css", ".node", ".md", ".txt"],
                "forbidden_paths": ["node_modules", ".venv", "venv", "dist", "build", "__pycache__"],
                "auto_commit_enabled": True,
                "require_manual_push": True,
                "working_hours_only": False,
                "working_hours_start": 9,
                "working_hours_end": 18,
                "working_days": [0, 1, 2, 3, 4]  # Lunes a Viernes
            }
            self.save_config(default_config)
    
    def save_config(self, config: dict):
        """Guarda la configuración."""
        with open(self.config_path, 'w') as f:
            json.dump(config, f, indent=2)
    
    def load_config(self) -> dict:
        """Carga la configuración."""
        with open(self.config_path, 'r') as f:
            return json.load(f)
    
    def get_fifo_queue(self) -> deque:
        """Obtiene la cola FIFO de auto-commits."""
        if self.fifo_path.exists():
            with open(self.fifo_path, 'r') as f:
                data = json.load(f)
                return deque(data, maxlen=self.load_config()["max_fifo_size"])
        return deque(maxlen=self.load_config()["max_fifo_size"])
    
    def save_fifo_queue(self, queue: deque):
        """Guarda la cola FIFO."""
        with open(self.fifo_path, 'w') as f:
            json.dump(list(queue), f, indent=2)
    
    def add_auto_commit_record(self, commit_hash: str, file_path: str, line_number: int,
                                author: str, author_email: str, message: str, tag_content: str):
        """Registra un auto-commit en la base de datos y FIFO."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        timestamp = datetime.now().isoformat()
        
        cursor.execute('''
            INSERT INTO auto_commits 
            (commit_hash, file_path, line_number, author, author_email, message, timestamp, tag_content)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (commit_hash, file_path, line_number, author, author_email, message, timestamp, tag_content))
        
        conn.commit()
        conn.close()
        
        # Actualizar FIFO
        fifo = self.get_fifo_queue()
        fifo.append({
            "commit_hash": commit_hash,
            "file_path": file_path,
            "author": author,
            "timestamp": timestamp,
            "message": message
        })
        self.save_fifo_queue(fifo)
    
    def get_recent_auto_commits(self, limit: int = 10) -> List[Dict]:
        """Obtiene los últimos auto-commits."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            SELECT commit_hash, file_path, author, author_email, message, timestamp, tag_content
            FROM auto_commits
            ORDER BY timestamp DESC
            LIMIT ?
        ''', (limit,))
        
        results = []
        for row in cursor.fetchall():
            results.append({
                "commit_hash": row[0],
                "file_path": row[1],
                "author": row[2],
                "author_email": row[3],
                "message": row[4],
                "timestamp": row[5],
                "tag_content": row[6]
            })
        
        conn.close()
        return results
    
    def get_auto_commit_count_last_hour(self, author: Optional[str] = None) -> int:
        """Cuenta cuántos auto-commits se hicieron en la última hora."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        one_hour_ago = (datetime.now() - timedelta(hours=1)).isoformat()
        
        if author:
            cursor.execute('''
                SELECT COUNT(*) FROM auto_commits
                WHERE timestamp > ? AND author = ?
            ''', (one_hour_ago, author))
        else:
            cursor.execute('''
                SELECT COUNT(*) FROM auto_commits
                WHERE timestamp > ?
            ''', (one_hour_ago,))
        
        count = cursor.fetchone()[0]
        conn.close()
        return count
    
    def can_auto_commit(self, author: str, file_path: str) -> Tuple[bool, str]:
        """Verifica si se puede hacer un auto-commit según las reglas."""
        config = self.load_config()
        
        if not config["auto_commit_enabled"]:
            return False, "Auto-commit está deshabilitado globalmente"
        
        # Verificar horario laboral
        if config["working_hours_only"]:
            now = datetime.now()
            if now.weekday() not in config["working_days"]:
                return False, "Fuera de días laborables"
            if now.hour < config["working_hours_start"] or now.hour >= config["working_hours_end"]:
                return False, "Fuera de horario laboral"
        
        # Verificar extensión de archivo
        file_ext = Path(file_path).suffix
        if file_ext and file_ext not in config["allowed_extensions"]:
            return False, f"Extensión {file_ext} no permitida para auto-commit"
        
        # Verificar rutas prohibidas
        for forbidden in config["forbidden_paths"]:
            if forbidden in file_path:
                return False, f"Ruta contiene carpeta prohibida: {forbidden}"
        
        # Verificar límite por hora
        hourly_count = self.get_auto_commit_count_last_hour(author)
        if hourly_count >= config["max_auto_commits_per_hour"]:
            return False, f"Límite de {config['max_auto_commits_per_hour']} auto-commits por hora excedido"
        
        return True, "OK"
    
    def get_oldest_fifo_commit(self) -> Optional[Dict]:
        """Obtiene el commit más antiguo en la FIFO."""
        fifo = self.get_fifo_queue()
        if fifo:
            return fifo[0]
        return None
    
    def rollback_last_auto_commit(self, repo: Repo, keep_changes: bool = False) -> bool:
        """Deshace el último auto-commit."""
        fifo = self.get_fifo_queue()
        if not fifo:
            logger.warning("No hay auto-commits en el historial FIFO")
            return False
        
        last_commit = fifo[-1]
        commit_hash = last_commit["commit_hash"]
        
        try:
            if keep_changes:
                # Soft reset: deshace commit pero mantiene cambios en working directory
                repo.git.reset('--soft', 'HEAD~1')
                logger.info(f"Auto-commit {commit_hash[:8]} deshecho (cambios preservados)")
            else:
                # Hard reset: deshace todo
                repo.git.reset('--hard', 'HEAD~1')
                logger.info(f"Auto-commit {commit_hash[:8]} deshecho completamente")
            
            # Remover de FIFO
            fifo.pop()
            self.save_fifo_queue(fifo)
            return True
            
        except GitCommandError as e:
            logger.error(f"Error al hacer rollback: {e}")
            return False


class GitAutomation:
    """Clase para automatizar tareas comunes de Git en un repositorio."""

    def __init__(self, repo_path: Union[str, Path] = "."):
        """
        Inicializa la conexión con el repositorio Git.

        :param repo_path: Ruta al repositorio local (por defecto directorio actual).
        :raises GitAutomationError: Si la ruta no es un repositorio Git válido.
        """
        self.repo_path = Path(repo_path).resolve()
        self._force_push = False
        try:
            self.repo = Repo(self.repo_path)
            self.auto_tracker = AutoCommitTracker(self.repo_path)
            logger.info(f"Repositorio cargado: {self.repo_path}")
        except InvalidGitRepositoryError:
            raise GitAutomationError(
                f"'{self.repo_path}' no es un repositorio Git válido."
            )

    @classmethod
    def clone(cls, url: str, destino: Union[str, Path] = ".", branch: Optional[str] = None):
        """
        Clona un repositorio remoto y devuelve una instancia de GitAutomation.

        :param url: URL del repositorio remoto.
        :param destino: Ruta local donde clonar.
        :param branch: Rama específica a clonar (opcional).
        :return: Nueva instancia de GitAutomation.
        :raises GitAutomationError: Si falla la clonación.
        """
        destino_path = Path(destino).resolve()
        try:
            if branch:
                logger.info(f"Clonando rama '{branch}' desde {url} en {destino_path}")
                repo = Repo.clone_from(url, destino_path, branch=branch)
            else:
                logger.info(f"Clonando {url} en {destino_path}")
                repo = Repo.clone_from(url, destino_path)
            return cls(destino_path)
        except GitCommandError as e:
            raise GitAutomationError(f"Error al clonar: {e}")

    def get_status(self) -> str:
        """Retorna el estado actual del repositorio (similar a `git status`)."""
        return self.repo.git.status()

    def add_files(self, files: Optional[List[str]] = None) -> None:
        """
        Agrega archivos al área de staging.

        :param files: Lista de archivos/rutas a agregar.
                      Si es None, agrega todos los cambios (--all).
        """
        if files is None:
            self.repo.git.add("--all")
            logger.info("Todos los archivos agregados al staging.")
        else:
            self.repo.index.add(files)
            logger.info(f"Agregados: {', '.join(files)}")

    def has_changes_to_commit(self) -> bool:
        """Retorna True si hay cambios en el working tree o en el índice."""
        return self.repo.is_dirty(untracked_files=True) or bool(self.repo.index.diff("HEAD"))

    def commit(self, message: str, auto_commit_info: Optional[Dict] = None) -> bool:
        """
        Realiza un commit con el mensaje especificado.

        :param message: Mensaje del commit.
        :param auto_commit_info: Información de auto-commit (opcional).
        :return: True si se creó el commit, False si no había cambios.
        """
        if not self.has_changes_to_commit():
            logger.info("No hay cambios para commitear.")
            return False
        
        commit = self.repo.index.commit(message)
        logger.info(f"Commit realizado: '{message}' (hash: {commit.hexsha[:8]})")
        
        # Si es auto-commit, registrar en tracker
        if auto_commit_info:
            self.auto_tracker.add_auto_commit_record(
                commit_hash=commit.hexsha,
                file_path=auto_commit_info.get("file_path", ""),
                line_number=auto_commit_info.get("line_number", 0),
                author=auto_commit_info.get("author", "unknown"),
                author_email=auto_commit_info.get("author_email", ""),
                message=message,
                tag_content=auto_commit_info.get("tag_content", "")
            )
        
        return True

    def scan_and_auto_commit(self) -> Dict:
        """
        Escanea archivos modificados en busca de etiquetas #git-auto y hace auto-commit.
        
        :return: Diccionario con resultados del escaneo.
        """
        config = self.auto_tracker.load_config()
        
        if not config["auto_commit_enabled"]:
            return {"status": "disabled", "message": "Auto-commit globalmente deshabilitado"}
        
        # Obtener cambios no commiteados
        if not self.has_changes_to_commit():
            return {"status": "no_changes", "message": "No hay cambios para escanear"}
        
        # Obtener diff de archivos modificados
        diff_files = []
        for diff_item in self.repo.index.diff(None):
            diff_files.append(diff_item.a_path)
        
        # También incluir untracked files
        untracked = self.repo.untracked_files
        all_changed_files = list(set(diff_files + untracked))
        
        if not all_changed_files:
            return {"status": "no_changes", "message": "No se detectaron archivos modificados"}
        
        # Buscar etiquetas #git-auto
        auto_commits_found = []
        
        for file_path in all_changed_files:
            full_path = self.repo_path / file_path
            
            if not full_path.exists():
                continue
            
            # Verificar si es archivo de texto
            try:
                with open(full_path, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
            except (UnicodeDecodeError, IOError):
                continue  # Skip binary files
            
            for line_num, line in enumerate(lines, 1):
                # Buscar patrón #git-auto
                match = re.search(r'#git-auto(?:\s+(.+))?', line)
                if match:
                    tag_content = match.group(1) or ""
                    
                    # Obtener autor del archivo (usando git blame)
                    author, author_email = self._get_file_author(file_path, line_num)
                    
                    # Verificar si se puede hacer auto-commit
                    can_commit, reason = self.auto_tracker.can_auto_commit(author, file_path)
                    
                    if not can_commit:
                        logger.warning(f"Auto-commit bloqueado para {file_path}:{line_num} - {reason}")
                        continue
                    
                    # Generar mensaje de commit
                    if tag_content:
                        commit_message = f"🤖 Auto-commit: {tag_content[:100]}"
                    else:
                        commit_message = "🤖 Auto-commit automático"
                    
                    # Agregar contexto
                    commit_message += f"\n\n🔍 Origen: {file_path}:{line_num}\n👤 Autor: {author}"
                    
                    auto_commits_found.append({
                        "file_path": file_path,
                        "line_number": line_num,
                        "author": author,
                        "author_email": author_email,
                        "tag_content": tag_content,
                        "message": commit_message
                    })
        
        # Si encontramos etiquetas, hacer commit
        if auto_commits_found:
            # Agregar archivos modificados
            self.add_files(None)
            
            # Tomar la primera etiqueta como principal (o combinarlas)
            primary = auto_commits_found[0]
            if len(auto_commits_found) > 1:
                combined_message = f"🤖 Auto-commit múltiple: {len(auto_commits_found)} etiquetas\n\n"
                for item in auto_commits_found:
                    combined_message += f"- {item['file_path']}:{item['line_number']} [{item['author']}]\n"
                primary["message"] = combined_message
            
            # Hacer commit
            success = self.commit(primary["message"], auto_commit_info=primary)
            
            if success:
                return {
                    "status": "success",
                    "message": f"Auto-commit realizado con {len(auto_commits_found)} etiqueta(s)",
                    "commits": auto_commits_found
                }
            else:
                return {"status": "failed", "message": "No se pudo realizar el auto-commit"}
        
        return {"status": "no_tags", "message": "No se encontraron etiquetas #git-auto"}
    
    def _get_file_author(self, file_path: str, line_number: int) -> Tuple[str, str]:
        """Obtiene el autor de una línea específica usando git blame."""
        try:
            blame_output = self.repo.git.blame('-L', f'{line_number},{line_number}', '--porcelain', file_path)
            author = "unknown"
            email = ""
            
            for line in blame_output.split('\n'):
                if line.startswith('author '):
                    author = line[7:].strip()
                elif line.startswith('author-mail '):
                    email = line[12:].strip().strip('<>')
            
            return author, email
        except GitCommandError:
            # Si no se puede obtener blame, usar config global
            try:
                author = self.repo.git.config('user.name')
                email = self.repo.git.config('user.email')
                return author, email
            except:
                return "unknown", ""

    def pull(self, remote_name: str = "origin", branch: Optional[str] = None) -> None:
        """Hace pull desde el repositorio remoto."""
        if remote_name not in self.repo.remotes:
            raise GitAutomationError(f"El remoto '{remote_name}' no existe.")
        remote = self.repo.remote(remote_name)
        branch = branch or self.repo.active_branch.name
        try:
            remote.pull(branch)
            logger.info(f"Pull completado desde {remote_name}/{branch}")
        except GitCommandError as e:
            raise GitAutomationError(f"Error en pull: {e}")

    def push(self, remote_name: str = "origin", branch: Optional[str] = None,
             set_upstream: bool = False) -> None:
        """Hace push al repositorio remoto."""
        config = self.auto_tracker.load_config()
        
        if config["require_manual_push"]:
            logger.warning("⚠️  Push manual requerido por configuración. Usa --force-manual para override.")
            if not hasattr(self, '_force_push'):
                raise GitAutomationError("Auto-push deshabilitado. Usa --force-manual si estás seguro.")
        
        if remote_name not in self.repo.remotes:
            raise GitAutomationError(f"El remoto '{remote_name}' no existe.")
        remote = self.repo.remote(remote_name)
        branch = branch or self.repo.active_branch.name
        try:
            if set_upstream:
                remote.push(branch, set_upstream=True)
            else:
                remote.push(branch)
            logger.info(f"Push realizado a {remote_name}/{branch}")
        except GitCommandError as e:
            raise GitAutomationError(f"Error en push: {e}")

    def audit_auto_commits(self, limit: int = 10) -> List[Dict]:
        """Audita los últimos auto-commits."""
        return self.auto_tracker.get_recent_auto_commits(limit)
    
    def rollback_auto_commit(self, keep_changes: bool = False) -> bool:
        """Deshace el último auto-commit."""
        return self.auto_tracker.rollback_last_auto_commit(self.repo, keep_changes)
    
    def amend_last_commit(self, new_message: str) -> bool:
        """Modifica el mensaje del último commit."""
        try:
            self.repo.git.commit('--amend', '-m', new_message)
            logger.info(f"Commit amend realizado: '{new_message}'")
            return True
        except GitCommandError as e:
            logger.error(f"Error en amend: {e}")
            return False
    
    def toggle_auto_commit(self, enabled: Optional[bool] = None) -> bool:
        """Activa o desactiva el auto-commit."""
        config = self.auto_tracker.load_config()
        if enabled is None:
            config["auto_commit_enabled"] = not config["auto_commit_enabled"]
        else:
            config["auto_commit_enabled"] = enabled
        self.auto_tracker.save_config(config)
        status = "activado" if config["auto_commit_enabled"] else "desactivado"
        logger.info(f"Auto-commit {status}")
        return config["auto_commit_enabled"]
    
    def get_auto_commit_config(self) -> dict:
        """Obtiene la configuración actual de auto-commit."""
        return self.auto_tracker.load_config()
    
    def update_auto_commit_config(self, **kwargs) -> None:
        """Actualiza la configuración de auto-commit."""
        config = self.auto_tracker.load_config()
        config.update(kwargs)
        self.auto_tracker.save_config(config)
        logger.info("Configuración actualizada")

    def create_branch(self, branch_name: str, checkout: bool = True) -> None:
        """Crea una nueva rama."""
        if branch_name in self.repo.branches:
            raise GitAutomationError(f"La rama '{branch_name}' ya existe.")
        new_branch = self.repo.create_head(branch_name)
        if checkout:
            new_branch.checkout()
            logger.info(f"Rama '{branch_name}' creada y activada.")
        else:
            logger.info(f"Rama '{branch_name}' creada (no activada).")

    def switch_branch(self, branch_name: str) -> None:
        """Cambia a una rama existente."""
        if branch_name not in self.repo.branches:
            raise GitAutomationError(f"La rama '{branch_name}' no existe.")
        self.repo.git.checkout(branch_name)
        logger.info(f"Cambiado a la rama '{branch_name}'")

    def delete_branch(self, branch_name: str, force: bool = False, remote: bool = False) -> None:
        """Elimina una rama local y/u opcionalmente la remota."""
        if branch_name in self.repo.branches:
            try:
                self.repo.delete_head(branch_name, force=force)
                logger.info(f"Rama local '{branch_name}' eliminada.")
            except GitCommandError as e:
                raise GitAutomationError(f"No se pudo eliminar la rama local: {e}")
        else:
            raise GitAutomationError(f"La rama local '{branch_name}' no existe.")

        if remote:
            remote_name = "origin"
            if remote_name not in self.repo.remotes:
                raise GitAutomationError(f"El remoto '{remote_name}' no existe.")
            remote_ref = self.repo.remote(remote_name)
            try:
                remote_ref.push(f":{branch_name}")
                logger.info(f"Rama remota '{remote_name}/{branch_name}' eliminada.")
            except GitCommandError as e:
                raise GitAutomationError(f"Error al eliminar rama remota: {e}")

    def list_branches(self, remote: bool = False) -> List[str]:
        """Lista las ramas locales o remotas."""
        if remote:
            return [ref.name for ref in self.repo.remote().refs]
        else:
            return [branch.name for branch in self.repo.branches]

    def merge_branch(self, branch_name: str, commit_message: Optional[str] = None) -> None:
        """Fusiona la rama especificada en la rama actual."""
        try:
            if commit_message:
                self.repo.git.merge(branch_name, m=commit_message)
            else:
                self.repo.git.merge(branch_name)
            logger.info(f"Rama '{branch_name}' fusionada en '{self.repo.active_branch.name}'")
        except GitCommandError as e:
            raise GitAutomationError(f"Error en merge: {e}")

    def create_tag(self, tag_name: str, message: Optional[str] = None) -> None:
        """Crea un tag ligero o anotado."""
        if tag_name in self.repo.tags:
            raise GitAutomationError(f"El tag '{tag_name}' ya existe.")
        if message:
            self.repo.create_tag(tag_name, message=message)
            logger.info(f"Tag anotado '{tag_name}' creado.")
        else:
            self.repo.create_tag(tag_name)
            logger.info(f"Tag ligero '{tag_name}' creado.")

    def push_tags(self, remote_name: str = "origin") -> None:
        """Pushea todos los tags al remoto."""
        if remote_name not in self.repo.remotes:
            raise GitAutomationError(f"El remoto '{remote_name}' no existe.")
        self.repo.git.push(remote_name, "--tags")
        logger.info(f"Tags pusheados a {remote_name}")

    def get_diff(self, cached: bool = False) -> str:
        """Retorna el diff del working tree o del staging (--cached)."""
        if cached:
            return self.repo.git.diff("--cached")
        else:
            return self.repo.git.diff()

    def restore(self, files: Optional[List[str]] = None, staged: bool = False) -> None:
        """Restaura archivos descartando cambios (similar a `git restore`)."""
        if files is None:
            files_to_restore = ["."]
        else:
            files_to_restore = files
        if staged:
            self.repo.git.restore("--staged", *files_to_restore)
            logger.info(f"Archivos removidos del staging: {', '.join(files_to_restore)}")
        else:
            self.repo.git.restore(*files_to_restore)
            logger.info(f"Cambios descartados en: {', '.join(files_to_restore)}")

    def set_config(self, key: str, value: str, global_: bool = False) -> None:
        """Configura una opción de Git (user.name, user.email, etc.)."""
        if global_:
            self.repo.git.config("--global", key, value)
            logger.info(f"Configuración global '{key}' = '{value}'")
        else:
            self.repo.git.config(key, value)
            logger.info(f"Configuración local '{key}' = '{value}'")

    def get_remotes(self) -> List[str]:
        """Retorna la lista de nombres de remotos configurados."""
        return [remote.name for remote in self.repo.remotes]


# ========================
# Interfaz de línea de comandos con subcomandos
# ========================

def main():
    parser = argparse.ArgumentParser(
        description="Herramienta Git automatizada con subcomandos y auto-commit por etiquetas",
        usage="%(prog)s <comando> [opciones]"
    )
    parser.add_argument("--path", default=".", help="Ruta al repositorio local (por defecto .)")
    subparsers = parser.add_subparsers(dest="comando", required=True, help="Comando a ejecutar")

    # Comando: status
    subparsers.add_parser("status", help="Mostrar estado del repositorio")

    # Comando: add
    add_parser = subparsers.add_parser("add", help="Agregar archivos al staging")
    add_parser.add_argument("archivos", nargs="*", help="Archivos a agregar (vacío = todos)")

    # Comando: commit
    commit_parser = subparsers.add_parser("commit", help="Realizar un commit")
    commit_parser.add_argument("-m", "--message", required=True, help="Mensaje del commit")

    # Comando: pull
    pull_parser = subparsers.add_parser("pull", help="Hacer pull del remoto")
    pull_parser.add_argument("--remote", default="origin", help="Nombre del remoto")
    pull_parser.add_argument("--branch", help="Rama remota (por defecto la actual)")

    # Comando: push
    push_parser = subparsers.add_parser("push", help="Hacer push al remoto")
    push_parser.add_argument("--remote", default="origin", help="Nombre del remoto")
    push_parser.add_argument("--branch", help="Rama a pushear")
    push_parser.add_argument("--set-upstream", action="store_true", help="Usar -u")
    push_parser.add_argument("--force-manual", action="store_true", help="Forzar push manual (override configuración)")

    # Comando: branch
    branch_parser = subparsers.add_parser("branch", help="Gestión de ramas")
    branch_subparsers = branch_parser.add_subparsers(dest="branch_action", required=True)

    branch_create = branch_subparsers.add_parser("crear", help="Crear nueva rama")
    branch_create.add_argument("nombre", help="Nombre de la rama")
    branch_create.add_argument("--no-checkout", action="store_true", help="No cambiar a la nueva rama")

    branch_switch = branch_subparsers.add_parser("cambiar", help="Cambiar a una rama existente")
    branch_switch.add_argument("nombre", help="Nombre de la rama")

    branch_delete = branch_subparsers.add_parser("eliminar", help="Eliminar rama")
    branch_delete.add_argument("nombre", help="Nombre de la rama")
    branch_delete.add_argument("--force", action="store_true", help="Forzar eliminación")
    branch_delete.add_argument("--remote", action="store_true", help="También eliminar remota")

    branch_list = branch_subparsers.add_parser("listar", help="Listar ramas")
    branch_list.add_argument("--remote", action="store_true", help="Listar ramas remotas")

    # Comando: merge
    merge_parser = subparsers.add_parser("merge", help="Fusionar una rama en la actual")
    merge_parser.add_argument("rama", help="Rama a fusionar")
    merge_parser.add_argument("-m", "--message", help="Mensaje del merge commit")

    # Comando: tag
    tag_parser = subparsers.add_parser("tag", help="Crear un tag")
    tag_parser.add_argument("nombre", help="Nombre del tag")
    tag_parser.add_argument("--message", "-m", help="Mensaje para tag anotado")
    tag_parser.add_argument("--push", action="store_true", help="Pushear tags después de crear")

    # Comando: push-tags
    subparsers.add_parser("push-tags", help="Pushear todos los tags al remoto")

    # Comando: diff
    diff_parser = subparsers.add_parser("diff", help="Mostrar diferencias")
    diff_parser.add_argument("--cached", action="store_true", help="Mostrar diff del staging")

    # Comando: restore
    restore_parser = subparsers.add_parser("restore", help="Descartar cambios o quitar del staging")
    restore_parser.add_argument("archivos", nargs="*", help="Archivos a restaurar (vacío = todo)")
    restore_parser.add_argument("--staged", action="store_true", help="Quitar del staging")

    # Comando: config
    config_parser = subparsers.add_parser("config", help="Configurar opciones de Git")
    config_parser.add_argument("key", help="Clave (ej: user.name)")
    config_parser.add_argument("value", help="Valor")
    config_parser.add_argument("--global", dest="global_", action="store_true", help="Configuración global")

    # Comando: remotes
    subparsers.add_parser("remotes", help="Listar remotos configurados")

    # Comando: clone (no requiere --path existente)
    clone_parser = subparsers.add_parser("clone", help="Clonar un repositorio remoto")
    clone_parser.add_argument("url", help="URL del repositorio")
    clone_parser.add_argument("--destino", default=".", help="Directorio destino")
    clone_parser.add_argument("--branch", help="Rama específica a clonar")

    # Comandos de auto-commit (nuevos)
    auto_parser = subparsers.add_parser("auto", help="Comandos de automatización")
    auto_subparsers = auto_parser.add_subparsers(dest="auto_action", required=True)
    
    # auto scan
    auto_subparsers.add_parser("scan", help="Escanear y hacer auto-commit por etiquetas #git-auto")
    
    # auto audit
    audit_parser = auto_subparsers.add_parser("audit", help="Auditar auto-commits recientes")
    audit_parser.add_argument("--limit", type=int, default=10, help="Número de commits a mostrar")
    
    # auto rollback
    rollback_parser = auto_subparsers.add_parser("rollback", help="Deshacer último auto-commit")
    rollback_parser.add_argument("--keep-changes", action="store_true", help="Preservar cambios en working directory")
    
    # auto amend
    amend_parser = auto_subparsers.add_parser("amend", help="Modificar mensaje del último commit")
    amend_parser.add_argument("-m", "--message", required=True, help="Nuevo mensaje")
    
    # auto toggle
    toggle_parser = auto_subparsers.add_parser("toggle", help="Activar/desactivar auto-commit")
    toggle_parser.add_argument("--on", action="store_true", help="Activar")
    toggle_parser.add_argument("--off", action="store_true", help="Desactivar")
    
    # auto config
    auto_config_parser = auto_subparsers.add_parser("config", help="Ver/modificar configuración de auto-commit")
    auto_config_parser.add_argument("--show", action="store_true", help="Mostrar configuración actual")
    auto_config_parser.add_argument("--set", nargs=2, metavar=("KEY", "VALUE"), help="Establecer configuración (ej: max_fifo_size 15)")
    
    # auto fifo
    fifo_parser = auto_subparsers.add_parser("fifo", help="Ver cola FIFO de auto-commits")
    fifo_parser.add_argument("--show", action="store_true", help="Mostrar cola FIFO")

    args = parser.parse_args()

    # Para clone, no se necesita repositorio previo
    if args.comando == "clone":
        try:
            git = GitAutomation.clone(args.url, args.destino, args.branch)
            logger.info(f"Repositorio clonado exitosamente en {git.repo_path}")
        except GitAutomationError as e:
            logger.error(e)
            sys.exit(1)
        return

    # Para el resto de comandos, se requiere un repositorio existente
    try:
        git = GitAutomation(args.path)
    except GitAutomationError as e:
        logger.error(e)
        sys.exit(1)

    try:
        if args.comando == "status":
            print(git.get_status())

        elif args.comando == "add":
            git.add_files(args.archivos if args.archivos else None)

        elif args.comando == "commit":
            git.commit(args.message)

        elif args.comando == "pull":
            git.pull(remote_name=args.remote, branch=args.branch)

        elif args.comando == "push":
            if args.force_manual:
                git._force_push = True
            git.push(remote_name=args.remote, branch=args.branch, set_upstream=args.set_upstream)

        elif args.comando == "branch":
            if args.branch_action == "crear":
                git.create_branch(args.nombre, checkout=not args.no_checkout)
            elif args.branch_action == "cambiar":
                git.switch_branch(args.nombre)
            elif args.branch_action == "eliminar":
                git.delete_branch(args.nombre, force=args.force, remote=args.remote)
            elif args.branch_action == "listar":
                ramas = git.list_branches(remote=args.remote)
                for r in ramas:
                    print(r)

        elif args.comando == "merge":
            git.merge_branch(args.rama, commit_message=args.message)

        elif args.comando == "tag":
            git.create_tag(args.nombre, message=args.message)
            if args.push:
                git.push_tags()

        elif args.comando == "push-tags":
            git.push_tags()

        elif args.comando == "diff":
            print(git.get_diff(cached=args.cached))

        elif args.comando == "restore":
            git.restore(files=args.archivos if args.archivos else None, staged=args.staged)

        elif args.comando == "config":
            git.set_config(args.key, args.value, global_=args.global_)

        elif args.comando == "remotes":
            for r in git.get_remotes():
                print(r)

        elif args.comando == "auto":
            if args.auto_action == "scan":
                result = git.scan_and_auto_commit()
                print(f"\n📊 Resultado: {result['status']}")
                print(f"📝 Mensaje: {result['message']}")
                if result.get('commits'):
                    print("\n🔍 Detalles:")
                    for commit in result['commits']:
                        print(f"   📄 {commit['file_path']}:{commit['line_number']}")
                        print(f"   👤 {commit['author']}")
                        print(f"   🏷️  {commit['tag_content'][:50]}")
                        print()
            
            elif args.auto_action == "audit":
                commits = git.audit_auto_commits(args.limit)
                if not commits:
                    print("No hay auto-commits registrados.")
                else:
                    print(f"\n📋 Últimos {len(commits)} auto-commits:\n")
                    for i, commit in enumerate(commits, 1):
                        print(f"{i}. 🔖 {commit['commit_hash'][:8]}")
                        print(f"   📝 {commit['message'][:80]}")
                        print(f"   📄 {commit['file_path']}:{commit.get('line_number', '?')}")
                        print(f"   👤 {commit['author']} <{commit['author_email']}>")
                        print(f"   🕐 {commit['timestamp']}")
                        print()
            
            elif args.auto_action == "rollback":
                if git.rollback_auto_commit(keep_changes=args.keep_changes):
                    print("✅ Rollback completado exitosamente")
                else:
                    print("❌ No se pudo hacer rollback")
            
            elif args.auto_action == "amend":
                if git.amend_last_commit(args.message):
                    print("✅ Commit amend realizado")
                else:
                    print("❌ Error en amend")
            
            elif args.auto_action == "toggle":
                if args.on:
                    git.toggle_auto_commit(True)
                elif args.off:
                    git.toggle_auto_commit(False)
                else:
                    git.toggle_auto_commit()
            
            elif args.auto_action == "config":
                if args.show:
                    config = git.get_auto_commit_config()
                    print("\n⚙️ Configuración actual de auto-commit:\n")
                    for key, value in config.items():
                        print(f"   {key}: {value}")
                elif args.set:
                    key, value = args.set
                    # Convertir valor a tipo apropiado
                    if value.lower() == 'true':
                        value = True
                    elif value.lower() == 'false':
                        value = False
                    elif value.isdigit():
                        value = int(value)
                    git.update_auto_commit_config(**{key: value})
                    print(f"✅ Configuración actualizada: {key} = {value}")
                else:
                    print("Usa --show para ver configuración o --set KEY VALUE para modificar")
            
            elif args.auto_action == "fifo":
                if args.show:
                    fifo = git.auto_tracker.get_fifo_queue()
                    if not fifo:
                        print("Cola FIFO vacía")
                    else:
                        print(f"\n📦 Cola FIFO (últimos {len(fifo)} auto-commits):\n")
                        for i, item in enumerate(fifo, 1):
                            print(f"{i}. 🔖 {item['commit_hash'][:8]} - {item['author']}")
                            print(f"   📝 {item['message'][:60]}")
                            print(f"   🕐 {item['timestamp'][:19]}")
                            print()

    except GitAutomationError as e:
        logger.error(e)
        sys.exit(1)
    except GitCommandError as e:
        logger.error(f"Error de Git: {e}")
        sys.exit(1)
    except Exception as e:
        logger.exception(f"Error inesperado: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()