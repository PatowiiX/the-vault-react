#!/usr/bin/env python3
"""
env_switcher.py — Orquestador de entornos Local / AWS
Ticket: DEV-002 | Prioridad: MEDIA
"""

import argparse
import os
import re
import sys
import getpass
from pathlib import Path

# ─── Colores ANSI ────────────────────────────────────────────────────────────
GREEN   = "\033[92m"
YELLOW  = "\033[93m"
RED     = "\033[91m"
CYAN    = "\033[96m"
BOLD    = "\033[1m"
RESET   = "\033[0m"

def print_success(msg: str) -> None:
    print(f"{GREEN}{BOLD}✅ {msg}{RESET}")

def print_warning(msg: str) -> None:
    print(f"{YELLOW}⚠️  {msg}{RESET}")

def print_error(msg: str) -> None:
    print(f"{RED}❌ {msg}{RESET}")

def print_info(msg: str) -> None:
    print(f"{CYAN}ℹ️  {msg}{RESET}")

# ─── Paths ────────────────────────────────────────────────────────────────────
#SCRIPT_DIR       = Path(__file__).resolve().parent
PROJECT_ROOT     = Path(__file__).resolve().parent
ENV_FILE         = PROJECT_ROOT / ".env.development"
CREDENTIALS_FILE = PROJECT_ROOT / ".aws_credentials"   # NO rastreado por Git

# ─── Variables locales por defecto (sin secretos) ─────────────────────────────
LOCAL_DEFAULTS = {
    "DB_HOST":     "localhost",
    "DB_USER":     "root",
    "DB_PASSWORD": "",          # Contraseña local vacía por defecto
}

# ─── Lectura de credenciales AWS ──────────────────────────────────────────────
def load_aws_credentials() -> dict:
    """
    Carga credenciales AWS desde .aws_credentials.
    Si el archivo no existe, las pide de forma interactiva y ofrece guardarlas.
    """
    creds = {}

    if CREDENTIALS_FILE.exists():
        print_info(f"Leyendo credenciales desde: {CREDENTIALS_FILE.name}")
        pattern = re.compile(r"^\s*([A-Z_]+)\s*=\s*(.*)$")
        for line in CREDENTIALS_FILE.read_text().splitlines():
            match = pattern.match(line)
            if match:
                creds[match.group(1)] = match.group(2).strip().strip('"').strip("'")
    else:
        print_warning(
            f"No se encontró {CREDENTIALS_FILE.name}. "
            "Ingresa las credenciales manualmente (no se mostrarán en pantalla)."
        )
        creds["DB_HOST"]     = input("  AWS DB_HOST (endpoint RDS): ").strip()
        creds["DB_USER"]     = input("  AWS DB_USER: ").strip()
        creds["DB_PASSWORD"] = getpass.getpass("  AWS DB_PASSWORD: ")

        save = input("\n¿Guardar credenciales en .aws_credentials para usos futuros? [s/N]: ").strip().lower()
        if save == "s":
            _save_credentials_file(creds)

    required = {"DB_HOST", "DB_USER", "DB_PASSWORD"}
    missing  = required - creds.keys()
    if missing:
        print_error(f"Faltan claves en .aws_credentials: {', '.join(missing)}")
        sys.exit(1)

    return creds


def _save_credentials_file(creds: dict) -> None:
    """Escribe el archivo .aws_credentials con advertencia de seguridad."""
    lines = [
        "# .aws_credentials — NO rastrear con Git (.gitignore)\n",
        "# Generado por env_switcher.py\n\n",
    ]
    for key, value in creds.items():
        lines.append(f'{key}="{value}"\n')

    CREDENTIALS_FILE.write_text("".join(lines))
    print_success(f"Credenciales guardadas en {CREDENTIALS_FILE.name}")
    print_warning("Asegúrate de que .aws_credentials esté en tu .gitignore ‼️")

# ─── Manipulación del .env ────────────────────────────────────────────────────
def read_env_file() -> str:
    if not ENV_FILE.exists():
        print_error(f"Archivo .env no encontrado en: {ENV_FILE}")
        sys.exit(1)
    return ENV_FILE.read_text()


def update_env_variable(content: str, key: str, new_value: str) -> str:
    """
    Reemplaza el valor de una variable en el contenido del .env.
    Si la variable no existe, la añade al final.
    """
    pattern     = re.compile(rf"^({re.escape(key)}\s*=)(.*)$", re.MULTILINE)
    replacement = rf"\g<1>{new_value}"

    if pattern.search(content):
        return pattern.sub(replacement, content)

    # Variable no encontrada → agregar al final
    print_warning(f"{key} no encontrada en .env. Se añadirá al final.")
    return content.rstrip("\n") + f"\n{key}={new_value}\n"


def apply_env_values(values: dict) -> None:
    """Lee el .env, aplica los nuevos valores y lo sobreescribe."""
    content = read_env_file()

    for key, value in values.items():
        content = update_env_variable(content, key, value)

    ENV_FILE.write_text(content)

# ─── Modos ────────────────────────────────────────────────────────────────────
def switch_to_local() -> None:
    print_info("Aplicando configuración LOCAL...")
    apply_env_values(LOCAL_DEFAULTS)
    print_success("Entorno cambiado a LOCAL. Reinicia PM2 para aplicar los cambios.")
    print_info(f"  DB_HOST  → {LOCAL_DEFAULTS['DB_HOST']}")
    print_info(f"  DB_USER  → {LOCAL_DEFAULTS['DB_USER']}")
    print_info(f"  DB_PASSWORD → {'(vacía)' if not LOCAL_DEFAULTS['DB_PASSWORD'] else '***'}")


def switch_to_aws() -> None:
    print_info("Cargando credenciales AWS...")
    creds = load_aws_credentials()

    print_info("Aplicando configuración AWS...")
    apply_env_values({
        "DB_HOST":     creds["DB_HOST"],
        "DB_USER":     creds["DB_USER"],
        "DB_PASSWORD": creds["DB_PASSWORD"],
    })

    print_success("Entorno cambiado a AWS. Reinicia PM2 para aplicar los cambios.")
    print_info(f"  DB_HOST  → {creds['DB_HOST']}")
    print_info(f"  DB_USER  → {creds['DB_USER']}")
    print_info(f"  DB_PASSWORD → ***")

# ─── CLI ──────────────────────────────────────────────────────────────────────
def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog        = "env_switcher.py",
        description = "Orquestador de entornos: cambia entre Local y AWS de forma segura.",
    )
    parser.add_argument(
        "--mode",
        required = True,
        choices  = ["local", "aws"],
        help     = "Entorno destino: 'local' o 'aws'",
    )
    return parser.parse_args()


def main() -> None:
    print(f"\n{BOLD}{CYAN}{'─' * 50}")
    print("   🔄  env_switcher.py  |  DEV-002")
    print(f"{'─' * 50}{RESET}\n")

    args = parse_args()

    if args.mode == "local":
        switch_to_local()
    elif args.mode == "aws":
        switch_to_aws()

    print(f"\n{CYAN}{'─' * 50}{RESET}\n")


if __name__ == "__main__":
    main()
