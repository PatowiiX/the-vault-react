#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Automatización de operaciones Git/GitHub en Python.
Permite hacer commits, pushes, pulls, creación de ramas, merges, etc.
"""

import os
import sys
from pathlib import Path
from git import Repo, GitCommandError, InvalidGitRepositoryError

class GitAutomation:
    """
    Clase para automatizar tareas comunes de Git en un repositorio.
    """

    

    def __init__(self, repo_path="."):
        """
        Inicializa la conexión con el repositorio Git.
        :param repo_path: Ruta al repositorio local (por defecto el directorio actual).
        """
        self.repo_path = Path(repo_path).resolve()
        try:
            self.repo = Repo(self.repo_path)
            print(f"Repositorio cargado correctamente: {self.repo_path}")
        except InvalidGitRepositoryError:
            print(f"Error: '{self.repo_path}' no es un repositorio Git válido.")
            sys.exit(1)

    def get_status(self):
        """Muestra el estado actual del repositorio (archivos modificados, agregados, etc.)."""
        status = self.repo.git.status()
        print("\n=== STATUS ===\n")
        print(status)
        return status

    def add_files(self, files=None):
        """
        Agrega archivos al área de staging.
        :param files: Lista de archivos/rutas a agregar. Si es None, agrega todos los cambios.
        """
        if files is None:
            # Agrega todos los cambios (incluyendo nuevos, modificados y eliminados)
            self.repo.git.add("--all")
            print("Todos los archivos agregados al staging.")
        else:
            if isinstance(files, str):
                files = [files]
            for f in files:
                self.repo.git.add(f)
                print(f"Agregado: {f}")

    def commit(self, message):
        """
        Realiza un commit con el mensaje especificado.
        :param message: Mensaje del commit.
        :return: True si se creó el commit, False si no hay cambios.
        """
        if self.repo.is_dirty(untracked_files=True) or len(self.repo.index.diff("HEAD")):
            self.repo.index.commit(message)
            print(f"Commit realizado: '{message}'")
            return True
        else:
            print("No hay cambios para commitear.")
            return False

    def pull(self, remote_name="origin", branch=None):
        """
        Hace pull desde el repositorio remoto.
        :param remote_name: Nombre del remoto (por defecto 'origin').
        :param branch: Rama remota (si es None, usa la rama actual).
        """
        try:
            if branch is None:
                branch = self.repo.active_branch.name
            self.repo.git.pull(remote_name, branch)
            print(f"Pull completado desde {remote_name}/{branch}")
        except GitCommandError as e:
            print(f"Error en pull: {e}")

    def push(self, remote_name="origin", branch=None, set_upstream=False):
        """
        Hace push al repositorio remoto.
        :param remote_name: Nombre del remoto (por defecto 'origin').
        :param branch: Rama a pushear (si es None, usa la rama actual).
        :param set_upstream: Si True, establece la rama upstream (-u).
        """
        if branch is None:
            branch = self.repo.active_branch.name
        try:
            if set_upstream:
                self.repo.git.push("--set-upstream", remote_name, branch)
            else:
                self.repo.git.push(remote_name, branch)
            print(f"Push realizado a {remote_name}/{branch}")
        except GitCommandError as e:
            print(f"Error en push: {e}")

    def create_branch(self, branch_name, checkout=True):
        """
        Crea una nueva rama.
        :param branch_name: Nombre de la nueva rama.
        :param checkout: Si True, cambia automáticamente a la nueva rama.
        """
        if branch_name in self.repo.branches:
            print(f"La rama '{branch_name}' ya existe.")
            return
        new_branch = self.repo.create_head(branch_name)
        if checkout:
            new_branch.checkout()
            print(f"Rama '{branch_name}' creada y activada.")
        else:
            print(f"Rama '{branch_name}' creada (no activada).")

    def switch_branch(self, branch_name):
        """
        Cambia a una rama existente.
        :param branch_name: Nombre de la rama destino.
        """
        if branch_name not in self.repo.branches:
            print(f"La rama '{branch_name}' no existe.")
            return
        self.repo.git.checkout(branch_name)
        print(f"Cambiado a la rama '{branch_name}'")

    def merge_branch(self, branch_name, commit_message=None):
        """
        Fusiona la rama especificada en la rama actual.
        :param branch_name: Rama a fusionar.
        :param commit_message: Mensaje para el merge commit (opcional).
        """
        try:
            if commit_message:
                self.repo.git.merge(branch_name, m=commit_message)
            else:
                self.repo.git.merge(branch_name)
            print(f"Rama '{branch_name}' fusionada en '{self.repo.active_branch.name}'")
        except GitCommandError as e:
            print(f"Error en merge: {e}")

    def create_tag(self, tag_name, message=None):
        """
        Crea un tag ligero o anotado.
        :param tag_name: Nombre del tag.
        :param message: Mensaje para tag anotado (si se omite, crea tag ligero).
        """
        if message:
            self.repo.create_tag(tag_name, message=message)
            print(f"Tag anotado '{tag_name}' creado.")
        else:
            self.repo.create_tag(tag_name)
            print(f"Tag ligero '{tag_name}' creado.")

    def push_tags(self, remote_name="origin"):
        """Pushea todos los tags al remoto."""
        self.repo.git.push(remote_name, "--tags")
        print(f"Tags pusheados a {remote_name}")

# ============
#parseo de argumentos y ejecución
# ============
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Automatización de operaciones Git/GitHub")
    parser.add_argument("--path", default=".", help="Ruta al repositorio local (por defecto directorio actual)")
    
    # Acciones principales
    parser.add_argument("--status", action="store_true", help="Mostrar estado del repositorio")
    parser.add_argument("--add", nargs="*", default=None, help="Archivos a agregar (si no se especifica, se agregan todos)")
    parser.add_argument("--commit", "-m", help="Mensaje del commit")
    parser.add_argument("--pull", action="store_true", help="Hacer pull antes de pushear")
    parser.add_argument("--push", action="store_true", help="Hacer push después del commit")
    parser.add_argument("--branch-create", help="Crear una nueva rama (y cambiar a ella)")
    parser.add_argument("--branch-switch", help="Cambiar a una rama existente")
    parser.add_argument("--merge", help="Fusionar una rama en la actual")
    parser.add_argument("--tag", help="Nombre del tag a crear")
    parser.add_argument("--tag-message", help="Mensaje para tag anotado (opcional)")
    parser.add_argument("--push-tags", action="store_true", help="Pushear todos los tags al remoto")
    
    # Opciones adicionales
    parser.add_argument("--remote", default="origin", help="Nombre del remoto (por defecto origin)")
    parser.add_argument("--branch", help="Rama específica para pull/push (por defecto la actual)")
    parser.add_argument("--set-upstream", action="store_true", help="Usar -u en el push")

    args = parser.parse_args()

    git_auto = GitAutomation(args.path)

    # Ejecutar acciones en orden lógico
    if args.status:
        git_auto.get_status()

    if args.add is not None:  # None significa "todos", lista vacía también agrega todos
        git_auto.add_files(args.add if args.add else None)
    elif args.commit or args.push:  # si no se pidió add explícitamente pero hay commit/push, agregamos todo
        git_auto.add_files()

    if args.commit:
        git_auto.commit(args.commit)

    if args.pull:
        git_auto.pull(remote_name=args.remote, branch=args.branch)

    if args.push:
        git_auto.push(remote_name=args.remote, branch=args.branch, set_upstream=args.set_upstream)

    if args.branch_create:
        git_auto.create_branch(args.branch_create, checkout=True)

    if args.branch_switch:
        git_auto.switch_branch(args.branch_switch)

    if args.merge:
        git_auto.merge_branch(args.merge)

    if args.tag:
        git_auto.create_tag(args.tag, message=args.tag_message)

    if args.push_tags:
        git_auto.push_tags(remote_name=args.remote)