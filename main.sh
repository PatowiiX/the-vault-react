#!/bin/bash

# ==============================
#   THE VAULT - MAIN ENTRY
# ==============================

echo "========================================"
echo "        🔐 THE VAULT SYSTEM 🔐         "
echo "========================================"
echo ""

ACTION=$1

if [ -z "$ACTION" ]; then
    echo "⚠️  No se proporcionó ningún argumento."
    echo "Uso: ./main.sh [start|stop]"
    exit 1
fi

if [ "$ACTION" == "start" ]; then
    echo "🚀 Iniciando The Vault..."
elif [ "$ACTION" == "stop" ]; then
    echo "🛑 Deteniendo The Vault..."
else
    echo "❌ Argumento inválido: $ACTION"
    exit 1
fi

echo ""

# CORRECCIÓN: Llamando al pipeline.py
python3 pipeline.py $ACTION

echo ""
if [ "$ACTION" == "start" ]; then
    echo "✅ The Vault está ENCENDIDO"
else
    echo "💤 The Vault está APAGADO"
fi