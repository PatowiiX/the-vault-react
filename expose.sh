#!/bin/bash

# ================================
# CONFIGURACIÓN
# ================================
PORT_API=3001
PORT_WEB=3000
ENV_FILE=".env.development"
LOG_API="tunnel_api.log"
LOG_WEB="tunnel_web.log"
PID_FILE=".cloudflared.pid"

# ================================
# OBTENER URL DEL TÚNEL
# ================================
get_tunnel_url() {
    local log_file=$1
    local url=""
    
    for i in {1..15}; do
        url=$(grep -o 'https://[^[:space:]]*\.trycloudflare\.com' "$log_file" | head -n 1)
        if [ ! -z "$url" ]; then
            echo "$url"
            return 0
        fi
        sleep 1
    done
    return 1
}

# ================================
# INICIAR TÚNELES
# ================================
start_tunnel() {
    echo "========================================"
    echo "🚀 INICIANDO DESPLIEGUE (THE VAULT)"
    echo "========================================"

    # Limpiar
    rm -f "$LOG_API" "$LOG_WEB" "$PID_FILE"

    # 1. Túnel del BACKEND
    echo "⚙️ Levantando API (puerto $PORT_API)..."
    cloudflared tunnel --url http://localhost:$PORT_API > "$LOG_API" 2>&1 &
    echo $! > "$PID_FILE"

    API_URL=$(get_tunnel_url "$LOG_API")
    if [ -z "$API_URL" ]; then
        echo "❌ Error: No se pudo obtener URL del backend"
        exit 1
    fi
    echo "✅ API: $API_URL"

    # 2. Actualizar .env y reiniciar frontend
    echo "✏️ Actualizando $ENV_FILE..."
    if [ -f "$ENV_FILE" ]; then
        sed -i "s|REACT_APP_API_URL=.*|REACT_APP_API_URL=$API_URL/api|g" "$ENV_FILE"
    else
        echo "REACT_APP_API_URL=$API_URL/api" > "$ENV_FILE"
    fi

    echo "🔄 Reiniciando frontend..."
    pm2 restart vault-frontend 2>/dev/null || echo "⚠️ Frontend no está en PM2, ignorando"

    # Pequeña pausa para que el frontend reinicie
    sleep 2

    # 3. Túnel del FRONTEND
    echo "🎨 Levantando Web (puerto $PORT_WEB)..."
    cloudflared tunnel --url http://localhost:$PORT_WEB > "$LOG_WEB" 2>&1 &
    echo $! >> "$PID_FILE"

    WEB_URL=$(get_tunnel_url "$LOG_WEB")
    if [ -z "$WEB_URL" ]; then
        echo "❌ Error: No se pudo obtener URL del frontend"
        exit 1
    fi

    # ================================
    # OUTPUT FINAL
    # ================================
    echo -e "\n========================================"
    echo -e "🎉 DESPLIEGUE COMPLETADO 🎉"
    echo -e "========================================"
    echo -e "🌐 WEB (para la maestra):"
    echo -e "👉 \033[1;32m$WEB_URL\033[0m"
    echo -e "----------------------------------------"
    echo -e "🔧 API (backend):"
    echo -e "👉 $API_URL"
    echo -e "========================================\n"
}

# ================================
# DETENER TÚNELES
# ================================
stop_tunnel() {
    echo "🛑 Deteniendo túneles..."
    
    if [ -f "$PID_FILE" ]; then
        while read pid; do
            kill "$pid" 2>/dev/null
        done < "$PID_FILE"
        rm -f "$PID_FILE"
    fi
    
    # Por si acaso
    pkill -f cloudflared 2>/dev/null
    
    rm -f "$LOG_API" "$LOG_WEB"
    echo "✅ Túneles detenidos"
}

# ================================
# CLI
# ================================
case "$1" in
    stop)
        stop_tunnel
        ;;
    restart)
        stop_tunnel
        start_tunnel
        ;;
    *)
        start_tunnel
        ;;
esac