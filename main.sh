#!/bin/bash

set -euo pipefail

# ================================
# CONFIG
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
    echo "🔎 Verificando backend..."
    for i in {1..10}; do
        if curl -s http://localhost:$PORT_API > /dev/null; then
            echo -e "${GREEN}✅ Backend activo${NC}"
            return
        fi
        sleep 1
    done
    echo -e "${YELLOW}⚠️ Backend no respondió, continuando...${NC}"
}

# ================================
# START
# ================================
start_all() {
    check_dependencies

    echo "🧹 Limpiando procesos previos..."
    ./pipeline.py stop 2>/dev/null || true
    pkill -f cloudflared 2>/dev/null || true
    rm -f "$LOG_FILE" "$PID_FILE"

    echo "🚀 Iniciando ecosistema..."
    ./pipeline.py start

    wait_for_backend

    echo "🌐 Iniciando túneles..."
    cloudflared tunnel --url http://localhost:$PORT_API > "$LOG_FILE" 2>&1 &
    PID_API=$!

    # Guardar PID si sigue vivo
    if kill -0 $PID_API 2>/dev/null; then
        echo $PID_API >> "$PID_FILE"
    fi

    echo "⏳ Esperando URL..."
    for i in {1..15}; do
        API_URL=$(grep -o 'https://[^[:space:]]*\.trycloudflare\.com' "$LOG_FILE" | head -n 1)
        if [ ! -z "$API_URL" ]; then
            break
        fi
        sleep 1
    done

    if [ -z "$API_URL" ]; then
        echo -e "${RED}❌ No se pudo obtener la URL${NC}"
        exit 1
    fi

    echo -e "${GREEN}🌐 URL detectada: $API_URL${NC}"

    # ================================
    # BACKUP .env
    # ================================
    if [ -f "$ENV_FILE" ]; then
        cp "$ENV_FILE" "$ENV_FILE.bak"
        echo "💾 Backup creado"
    fi

    # ================================
    # ACTUALIZAR ENV
    # ================================
    echo "✏️ Actualizando $ENV_FILE..."

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
    # VALIDAR API
    # ================================
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api")

    if [ "$STATUS" == "200" ]; then
        echo -e "${GREEN}✅ API pública funcionando${NC}"
    else
        echo -e "${YELLOW}⚠️ API respondió $STATUS${NC}"
    fi

    # ================================
    # REINICIAR FRONTEND
    # ================================
    echo "🔄 Reiniciando frontend..."
    pm2 restart vault-frontend

    echo -e "\n=============================="
    echo -e "🌐 API: $API_URL"
    echo -e "📁 ENV actualizado"
    echo -e "🔄 Frontend reiniciado"
    echo -e "==============================\n"
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
    echo "📊 Estado del sistema:"
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