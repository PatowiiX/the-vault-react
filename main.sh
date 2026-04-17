#!/bin/bash

# ==============================
#   THE VAULT - MAIN ENTRY
# ==============================

# Configuración estricta para mejor manejo de errores
set -euo pipefail
IFS=$'\n\t'

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Variables de entorno
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="${SCRIPT_DIR}/logs"
LOG_FILE="${LOG_DIR}/vault.log"
PID_FILE="${SCRIPT_DIR}/vault.pid"
PYTHON_SCRIPT="${SCRIPT_DIR}/pipeline.py"

# Crear directorio de logs si no existe
mkdir -p "$LOG_DIR"

# ==============================
#   FUNCIONES AUXILIARES
# ==============================

log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo -e "${timestamp} [${level}] ${message}" >> "$LOG_FILE"
    
    case $level in
        "INFO") echo -e "${GREEN}✓${NC} $message" ;;
        "WARN") echo -e "${YELLOW}⚠${NC} $message" ;;
        "ERROR") echo -e "${RED}✗${NC} $message" ;;
        "DEBUG") echo -e "${CYAN}🔍${NC} $message" ;;
        *) echo "$message" ;;
    esac
}

print_banner() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║         🔐 THE VAULT SYSTEM 🔐            ║${NC}"
    echo -e "${CYAN}║         Gestión del Ecosistema            ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════╝${NC}"
    echo ""
}

check_python() {
    if ! command -v python3 &> /dev/null; then
        log "ERROR" "Python3 no está instalado"
        echo -e "${RED}❌ Error: Python3 no está instalado${NC}"
        echo "Por favor instala Python3: sudo apt install python3"
        exit 1
    fi
    
    if [ ! -f "$PYTHON_SCRIPT" ]; then
        log "ERROR" "No se encuentra $PYTHON_SCRIPT"
        echo -e "${RED}❌ Error: No se encuentra pipeline.py${NC}"
        exit 1
    fi
    
    log "DEBUG" "Python3 encontrado en: $(which python3)"
}

check_pm2() {
    if ! command -v pm2 &> /dev/null; then
        log "WARN" "PM2 no está instalado globalmente"
        echo -e "${YELLOW}⚠️  PM2 no encontrado. El pipeline lo instalará automáticamente.${NC}"
    else
        log "DEBUG" "PM2 encontrado: $(pm2 --version)"
    fi
}

check_process() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0 # Proceso corriendo
        else
            rm -f "$PID_FILE"
            return 1 # Proceso no corriendo
        fi
    fi
    return 1
}

run_pipeline_command() {
    local cmd=$1
    log "INFO" "Ejecutando pipeline command: $cmd"
    
    # Ejecutar pipeline.py y capturar salida
    if python3 "$PYTHON_SCRIPT" "$cmd"; then
        log "INFO" "Comando '$cmd' ejecutado exitosamente"
        return 0
    else
        local exit_code=$?
        log "ERROR" "Comando '$cmd' falló con código $exit_code"
        return $exit_code
    fi
}

start_vault() {
    log "INFO" "🚀 Iniciando The Vault..."
    echo ""
    
    if check_process; then
        log "WARN" "The Vault ya está corriendo (PID: $(cat $PID_FILE))"
        echo -e "${YELLOW}⚠️  El sistema ya está en ejecución${NC}"
        return 1
    fi
    
    # Ejecutar el pipeline
    if run_pipeline_command "start"; then
        # Guardar PID del proceso principal de PM2 o del pipeline
        echo "$$" > "$PID_FILE"
        log "INFO" "✅ The Vault iniciado correctamente"
        echo -e "${GREEN}✅ Sistema iniciado exitosamente${NC}"
        return 0
    else
        log "ERROR" "❌ Fallo al iniciar The Vault"
        echo -e "${RED}❌ Error al iniciar el sistema${NC}"
        rm -f "$PID_FILE"
        return 1
    fi
}

stop_vault() {
    log "INFO" "🛑 Deteniendo The Vault..."
    echo ""
    
    if ! check_process; then
        log "WARN" "The Vault no está corriendo"
        echo -e "${YELLOW}⚠️  El sistema no está en ejecución${NC}"
    fi
    
    # Ejecutar el pipeline
    if run_pipeline_command "stop"; then
        rm -f "$PID_FILE"
        log "INFO" "💤 The Vault detenido"
        echo -e "${GREEN}✅ Sistema detenido exitosamente${NC}"
        return 0
    else
        log "ERROR" "❌ Fallo al detener The Vault"
        echo -e "${RED}❌ Error al detener el sistema${NC}"
        return 1
    fi
}

restart_vault() {
    log "INFO" "🔄 Reiniciando The Vault..."
    echo ""
    echo -e "${CYAN}🔄 Reiniciando el ecosistema...${NC}"
    
    if run_pipeline_command "restart"; then
        log "INFO" "✅ The Vault reiniciado correctamente"
        echo -e "${GREEN}✅ Sistema reiniciado exitosamente${NC}"
        return 0
    else
        log "ERROR" "❌ Fallo al reiniciar The Vault"
        echo -e "${RED}❌ Error al reiniciar el sistema${NC}"
        return 1
    fi
}

status_vault() {
    log "INFO" "📊 Consultando estado del sistema..."
    echo ""
    run_pipeline_command "status"
}

health_vault() {
    log "INFO" "🏥 Verificando salud del sistema..."
    echo ""
    run_pipeline_command "health"
}

show_logs() {
    if [ -f "$LOG_FILE" ]; then
        log "INFO" "Mostrando logs en tiempo real (Ctrl+C para salir)"
        echo -e "${CYAN}📝 Mostrando logs del sistema...${NC}"
        echo -e "${YELLOW}Presiona Ctrl+C para salir${NC}"
        echo ""
        tail -f "$LOG_FILE"
    else
        log "ERROR" "No existe archivo de log"
        echo -e "${RED}❌ No se encontró el archivo de log${NC}"
    fi
}

show_pipeline_logs() {
    local pipeline_log="${LOG_DIR}/pipeline.log"
    if [ -f "$pipeline_log" ]; then
        log "INFO" "Mostrando logs del pipeline"
        tail -50 "$pipeline_log"
    else
        log "WARN" "No hay logs del pipeline aún"
        echo -e "${YELLOW}⚠️  No se encontraron logs del pipeline${NC}"
    fi
}

clean_logs() {
    log "INFO" "🧹 Limpiando logs antiguos..."
    echo -e "${CYAN}🧹 Limpiando logs de más de 30 días...${NC}"
    
    local cleaned=0
    if [ -d "$LOG_DIR" ]; then
        cleaned=$(find "$LOG_DIR" -name "*.log" -type f -mtime +30 -delete -print | wc -l)
        log "INFO" "Se eliminaron $cleaned archivos de log antiguos"
        echo -e "${GREEN}✅ Se eliminaron $cleaned logs antiguos${NC}"
    else
        echo -e "${YELLOW}⚠️  Directorio de logs no existe${NC}"
    fi
}

show_help() {
    echo ""
    echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}                    COMANDOS DISPONIBLES                  ${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${GREEN}Gestión del Sistema:${NC}"
    echo "  start      - Iniciar todo el ecosistema (Frontend + Backend + Scripts)"
    echo "  stop       - Detener todo el ecosistema"
    echo "  restart    - Reiniciar todo el ecosistema"
    echo ""
    echo -e "${GREEN}Monitoreo:${NC}"
    echo "  status     - Ver estado detallado de todos los servicios"
    echo "  health     - Verificar salud del sistema (health check)"
    echo "  logs       - Ver logs del sistema en tiempo real"
    echo "  pipeline-logs - Ver logs específicos del pipeline"
    echo ""
    echo -e "${GREEN}Mantenimiento:${NC}"
    echo "  clean-logs - Limpiar logs antiguos (más de 30 días)"
    echo "  help       - Mostrar esta ayuda"
    echo ""
    echo -e "${GREEN}Ejemplos:${NC}"
    echo "  ./main.sh start"
    echo "  ./main.sh status"
    echo "  ./main.sh health"
    echo "  ./main.sh logs"
    echo ""
}

# ==============================
#   MAIN
# ==============================

# Verificar argumentos
ACTION=${1:-help}

# Mostrar banner
print_banner

# Verificar dependencias básicas
check_python
check_pm2

# Procesar comando
case "$ACTION" in
    start)
        start_vault
        ;;
    stop)
        stop_vault
        ;;
    restart)
        restart_vault
        ;;
    status)
        status_vault
        ;;
    health)
        health_vault
        ;;
    logs)
        show_logs
        ;;
    pipeline-logs)
        show_pipeline_logs
        ;;
    clean-logs)
        clean_logs
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log "ERROR" "Comando inválido: $ACTION"
        echo ""
        echo -e "${RED}❌ Error: '$ACTION' no es un comando válido${NC}"
        show_help
        exit 1
        ;;
esac

exit 0