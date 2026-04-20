# ================================
# CONFIG
# ================================
PORT=3001
ENV_FILE=".env.production"
LOG_FILE="tunnel_api.log"
PID_FILE=".cloudflared.pid"

# ================================
# INICIAR TUNNEL
# ================================
start_tunnel() {
    echo "🚀 Iniciando túnel de Cloudflare..."

    # Limpiar log previo
    rm -f "$LOG_FILE"

    # Lanzar túnel en background
    cloudflared tunnel --url http://localhost:$PORT > "$LOG_FILE" 2>&1 &
    TUNNEL_PID=$!

    # Guardar PID
    echo $TUNNEL_PID > "$PID_FILE"

    echo "⏳ Esperando URL del túnel..."

    # Espera inteligente (máx 15s)
    for i in {1..15}; do
        API_URL=$(grep -o 'https://[^[:space:]]*\.trycloudflare\.com' "$LOG_FILE" | head -n 1)

        if [ ! -z "$API_URL" ]; then
            break
        fi

        sleep 1
    done

    if [ -z "$API_URL" ]; then
        echo "❌ Error: No se pudo obtener la URL del túnel"
        exit 1
    fi

    echo "🌐 URL detectada: $API_URL"

    # ================================
    # VALIDAR API
    # ================================
    echo "🔎 Validando API..."
    echo "⏳ Dando tiempo a la red para propagar la URL (5s)..."
    sleep 5

    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api")

    if [ "$STATUS" == "200" ]; then
        echo "✅ API activa"
    elif [ "$STATUS" == "404" ]; then
        # 404 también es bueno, significa que Node contestó pero la ruta no existe
        echo "✅ API activa (Respondió 404, backend en línea)"
    else
        echo "⚠️ API respondió $STATUS"
    fi

    # ================================
    # BACKUP .env
    # ================================
    if [ -f "$ENV_FILE" ]; then
        cp "$ENV_FILE" "$ENV_FILE.bak"
        echo "💾 Backup creado: $ENV_FILE.bak"
    fi

    # ================================
    # ACTUALIZAR .env.production
    # ================================
    echo "✏️ Actualizando $ENV_FILE..."

    if [ -f "$ENV_FILE" ]; then
        if grep -q "REACT_APP_API_URL=" "$ENV_FILE"; then
        #te luciste con este comando marco
            sed -i "s|REACT_APP_API_URL=.*|REACT_APP_API_URL=$API_URL/api|g" "$ENV_FILE"
        else
            echo "REACT_APP_API_URL=$API_URL/api" >> "$ENV_FILE"
        fi
    else
        echo "REACT_APP_API_URL=$API_URL/api" > "$ENV_FILE"
    fi

    # ================================
    # REINICIAR FRONTEND
    # ================================
    echo "🔄 Reiniciando frontend..."
    pm2 restart vault-frontend 2>/dev/null || echo "⚠️ PM2: Frontend no detectado (ignorando reinicio)"

    # ================================
    # OUTPUT FINAL
    # ================================
    echo -e "\n=============================="
    echo -e "🌐 API: $API_URL"
    echo -e "📁 ENV actualizado"
    echo -e "🔄 Frontend reiniciado"
    echo -e "==============================\n"
}

# ================================
# DETENER TUNNEL
# ================================
stop_tunnel() {
    echo "🛑 Deteniendo túnel..."

    # Por PID
    if [ -f "$PID_FILE" ]; then
        kill $(cat "$PID_FILE") 2>/dev/null
        rm -f "$PID_FILE"
        echo "✅ Túnel detenido (PID)"
    fi

    # Kill global por seguridad
    if pgrep -f cloudflared > /dev/null; then
        pkill -f cloudflared
        echo "✅ Todos los túneles detenidos"
    fi

    rm -f "$LOG_FILE"
}

# ================================
# ENTRY POINT (CLI)
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