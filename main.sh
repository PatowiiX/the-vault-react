#!/bin/bash

set -euo pipefail

# ================================
# CONFIGURACIÓN
# ================================
PORT_API=3001
PORT_FRONT=3000
ENV_FILE=".env.development"
LOG_FILE="tunnel.log"
PID_FILE=".tunnel_pids"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ================================
# VALIDAR DEPENDENCIAS
# ================================
check_dependencies() {
    for cmd in cloudflared pm2 python3 curl; do
        if ! command -v $cmd &> /dev/null; then
            echo -e "${RED}❌ Falta dependencia: $cmd${NC}"
            exit 1
        fi
    done
}

# ================================
# VERIFICAR BACKEND
# ================================
wait_for_backend() {
    echo "🔎 Verificando backend local..."
    for i in {1..10}; do
        if curl -s http://localhost:$PORT_API > /dev/null; then
            echo -e "${GREEN}✅ Backend activo localmente${NC}"
            return
        fi
        sleep 1
    done
    echo -e "${YELLOW}⚠️ Backend no respondió, continuando...${NC}"
}

# ================================
# START (SECUENCIA MAESTRA)
# ================================
start_all() {
    check_dependencies

    echo "🧹 Limpiando procesos previos (Clean Slate)..."
    ./pipeline.py stop 2>/dev/null || true
    pkill -f cloudflared 2>/dev/null || true
    rm -f "$LOG_FILE" "$PID_FILE"

    echo "🚀 Iniciando ecosistema local (PM2)..."
    ./pipeline.py start

    wait_for_backend

    echo "🌐 Levantando Túnel Permanente de Cloudflare..."
    cloudflared tunnel run vault-backend > "$LOG_FILE" 2>&1 &
    PID_API=$!

    if kill -0 $PID_API 2>/dev/null; then
        echo $PID_API >> "$PID_FILE"
    fi

    # URL ESTÁTICA DEFINITIVA
    API_URL="https://api.thevaultretrosound.page"
    echo -e "${GREEN}🌐 URL Estática Activa: $API_URL${NC}"

    # ================================
    # ACTUALIZAR ENV DEL FRONTEND
    # ================================
    echo "💾 Creando backup del .env..."
    if [ -f "$ENV_FILE" ]; then
        cp "$ENV_FILE" "${ENV_FILE}.bak"
    fi

    echo "✏️ Inyectando URL permanente al frontend..."
    if [ -f "$ENV_FILE" ]; then
        if grep -q "REACT_APP_API_URL=" "$ENV_FILE"; then
            sed -i "s|REACT_APP_API_URL=.*|REACT_APP_API_URL=$API_URL/api|g" "$ENV_FILE"
        else
            echo "REACT_APP_API_URL=$API_URL/api" >> "$ENV_FILE"
        fi
    else
        echo "REACT_APP_API_URL=$API_URL/api" > "$ENV_FILE"
    fi

    # ================================
    # VALIDACIÓN FINAL Y REINICIO
    # ================================
    # Pausa de 2 segundos para que Cloudflare agarre el tráfico
    sleep 2 
    
    echo "🔄 Reiniciando motor de React (PM2)..."
    pm2 restart vault-frontend > /dev/null 2>&1 || echo -e "${YELLOW}⚠️ Frontend no está en PM2${NC}"

    echo -e "\n=============================================="
    echo -e "🎉 ECOSISTEMA CON DOMINIO ESTATICO 99 CASI 100% OPERATIVO 🎉"
    echo -e "🌐 API DE PRODUCCIÓN: $API_URL/api"
    echo -e "📁 Variables de entorno actualizadas con éxito"
    echo -e "==============================================\n"
}

# ================================
# STOP
# ================================
stop_all() {
    echo "🛑 Deteniendo sistema..."

    ./pipeline.py stop 2>/dev/null || true

    if [ -f "$PID_FILE" ]; then
        while read pid; do
            kill $pid 2>/dev/null || true
        done < "$PID_FILE"
        rm -f "$PID_FILE"
    fi

    pkill -f cloudflared 2>/dev/null || true
    rm -f "$LOG_FILE"

    echo -e "${GREEN}✅ Sistema detenido${NC}"
}

# ================================
# STATUS
# ================================
status_all() {
    echo "📊 Estado del sistema (PM2):"
    pm2 list

    echo -e "\n🌐 Túneles activos:"
    pgrep -fl cloudflared || echo "No hay túneles activos"
}

# ================================
# ENTRY POINT
# ================================
case "${1:-start}" in
    start)
        start_all
        ;;
    stop)
        stop_all
        ;;
    restart)
        stop_all
        start_all
        ;;
    status)
        status_all
        ;;
    *)
        echo "Uso: $0 {start|stop|restart|status}"
        ;;
esac