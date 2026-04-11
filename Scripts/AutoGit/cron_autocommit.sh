#!/bin/bash
# Script para ejecutar auto-commit cada 30 minutos
# Instalar en crontab: */30 * * * * /ruta/a/cron_autocommit.sh

cd /ruta/de/tu/repositorio || exit 1

# Ejecutar auto-commit
python3 git_automation.py auto scan --path .

# Opcional: hacer push automático (si configuraste require_manual_push=false)
# python3 git_automation.py push --force-manual