#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Automatización avanzada de operaciones Git/GitHub en Python.
Permite clonar, commit, push, pull, manejo de ramas, tags, diff, configuración, etc.
Uso: python script.py <comando> [opciones]
"""

import logging
import sys
from pathlib import Path
from typing import List, Optional, Union
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


class GitAutomation:
    """Clase para automatizar tareas comunes de Git en un repositorio."""

    def __init__(self, repo_path: Union[str, Path] = "."):
        """
        Inicializa la conexión con el repositorio Git.

        :param repo_path: Ruta al repositorio local (por defecto directorio actual).
        :raises GitAutomationError: Si la ruta no es un repositorio Git válido.
        """
        self.repo_path = Path(repo_path).resolve()
        try:
            self.repo = Repo(self.repo_path)
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
        """
        Retorna el estado actual del repositorio (similar a `git status`).

        :return: Texto del estado.
        """
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

    def commit(self, message: str) -> bool:
        """
        Realiza un commit con el mensaje especificado.

        :param message: Mensaje del commit.
        :return: True si se creó el commit, False si no había cambios.
        """
        if not self.has_changes_to_commit():
            logger.info("No hay cambios para commitear.")
            return False
        self.repo.index.commit(message)
        logger.info(f"Commit realizado: '{message}'")
        return True

    def pull(self, remote_name: str = "origin", branch: Optional[str] = None) -> None:
        """
        Hace pull desde el repositorio remoto.

        :param remote_name: Nombre del remoto (por defecto 'origin').
        :param branch: Rama remota (si es None, usa la rama actual).
        :raises GitAutomationError: Si el remoto no existe o falla el pull.
        """
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
        """
        Hace push al repositorio remoto.

        :param remote_name: Nombre del remoto (por defecto 'origin').
        :param branch: Rama a pushear (si es None, usa la rama actual).
        :param set_upstream: Si True, establece la rama upstream (-u).
        :raises GitAutomationError: Si el remoto no existe o falla el push.
        """
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

    def create_branch(self, branch_name: str, checkout: bool = True) -> None:
        """
        Crea una nueva rama.

        :param branch_name: Nombre de la nueva rama.
        :param checkout: Si True, cambia automáticamente a la nueva rama.
        :raises GitAutomationError: Si la rama ya existe.
        """
        if branch_name in self.repo.branches:
            raise GitAutomationError(f"La rama '{branch_name}' ya existe.")
        new_branch = self.repo.create_head(branch_name)
        if checkout:
            new_branch.checkout()
            logger.info(f"Rama '{branch_name}' creada y activada.")
        else:
            logger.info(f"Rama '{branch_name}' creada (no activada).")

    def switch_branch(self, branch_name: str) -> None:
        """
        Cambia a una rama existente.

        :param branch_name: Nombre de la rama destino.
        :raises GitAutomationError: Si la rama no existe.
        """
        if branch_name not in self.repo.branches:
            raise GitAutomationError(f"La rama '{branch_name}' no existe.")
        self.repo.git.checkout(branch_name)
        logger.info(f"Cambiado a la rama '{branch_name}'")

    def delete_branch(self, branch_name: str, force: bool = False, remote: bool = False) -> None:
        """
        Elimina una rama local y/u opcionalmente la remota.

        :param branch_name: Nombre de la rama a eliminar.
        :param force: Si True, fuerza la eliminación (-D).
        :param remote: Si True, también elimina la rama remota.
        :raises GitAutomationError: Si la rama no existe o falla la eliminación.
        """
        # Eliminar local
        if branch_name in self.repo.branches:
            try:
                self.repo.delete_head(branch_name, force=force)
                logger.info(f"Rama local '{branch_name}' eliminada.")
            except GitCommandError as e:
                raise GitAutomationError(f"No se pudo eliminar la rama local: {e}")
        else:
            raise GitAutomationError(f"La rama local '{branch_name}' no existe.")

        # Eliminar remota
        if remote:
            # Verificar que el remoto 'origin' existe (podría parametrizarse)
            remote_name = "origin"
            if remote_name not in self.repo.remotes:
                raise GitAutomationError(f"El remoto '{remote_name}' no existe.")
            remote_ref = self.repo.remote(remote_name)
            try:
                remote_ref.push(f":{branch_name}")  # Sintaxis para borrar rama remota
                logger.info(f"Rama remota '{remote_name}/{branch_name}' eliminada.")
            except GitCommandError as e:
                raise GitAutomationError(f"Error al eliminar rama remota: {e}")

    def list_branches(self, remote: bool = False) -> List[str]:
        """
        Lista las ramas locales o remotas.

        :param remote: Si True, lista ramas remotas; de lo contrario, locales.
        :return: Lista de nombres de ramas.
        """
        if remote:
            # Ramas remotas: referencias como 'origin/main'
            return [ref.name for ref in self.repo.remote().refs]
        else:
            return [branch.name for branch in self.repo.branches]

    def merge_branch(self, branch_name: str, commit_message: Optional[str] = None) -> None:
        """
        Fusiona la rama especificada en la rama actual.

        :param branch_name: Rama a fusionar.
        :param commit_message: Mensaje para el merge commit (opcional).
        :raises GitAutomationError: Si falla el merge.
        """
        try:
            if commit_message:
                self.repo.git.merge(branch_name, m=commit_message)
            else:
                self.repo.git.merge(branch_name)
            logger.info(f"Rama '{branch_name}' fusionada en '{self.repo.active_branch.name}'")
        except GitCommandError as e:
            raise GitAutomationError(f"Error en merge: {e}")

    def create_tag(self, tag_name: str, message: Optional[str] = None) -> None:
        """
        Crea un tag ligero o anotado.

        :param tag_name: Nombre del tag.
        :param message: Mensaje para tag anotado (si se omite, crea tag ligero).
        :raises GitAutomationError: Si el tag ya existe.
        """
        if tag_name in self.repo.tags:
            raise GitAutomationError(f"El tag '{tag_name}' ya existe.")
        if message:
            self.repo.create_tag(tag_name, message=message)
            logger.info(f"Tag anotado '{tag_name}' creado.")
        else:
            self.repo.create_tag(tag_name)
            logger.info(f"Tag ligero '{tag_name}' creado.")

    def push_tags(self, remote_name: str = "origin") -> None:
        """
        Pushea todos los tags al remoto.

        :param remote_name: Nombre del remoto.
        """
        if remote_name not in self.repo.remotes:
            raise GitAutomationError(f"El remoto '{remote_name}' no existe.")
        self.repo.git.push(remote_name, "--tags")
        logger.info(f"Tags pusheados a {remote_name}")

    def get_diff(self, cached: bool = False) -> str:
        """
        Retorna el diff del working tree o del staging (--cached).

        :param cached: Si True, muestra el diff del área de staging.
        :return: Texto del diff.
        """
        if cached:
            return self.repo.git.diff("--cached")
        else:
            return self.repo.git.diff()

    def restore(self, files: Optional[List[str]] = None, staged: bool = False) -> None:
        """
        Restaura archivos descartando cambios (similar a `git restore`).

        :param files: Lista de archivos a restaurar. Si es None, restaura todo.
        :param staged: Si True, restaura desde el índice (--staged).
        """
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
        """
        Configura una opción de Git (user.name, user.email, etc.).

        :param key: Clave de configuración (ej: 'user.name').
        :param value: Valor a asignar.
        :param global_: Si True, usa --global; de lo contrario, local.
        """
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
        description="Herramienta Git automatizada con subcomandos",
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