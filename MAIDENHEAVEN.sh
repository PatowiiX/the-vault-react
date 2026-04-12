#!/bin/bash

echo "🔄 Iniciando Hard Reset de The Vault..."

# 1. Matar procesos viejos en PM2
pm2 delete all

# 2. Limpiar caché de Node (opcional pero ayuda)
# rm -rf backend/node_modules frontend/node_modules

# 3. Levantar el Backend
cd backend
npm install # Por si agregaste librerías nuevas
pm2 start server.js --name vault-backend

# 4. Levantar el Frontend
cd ..
# npm install
pm2 start npm --name vault-frontend -- start

# 5. Guardar estado
pm2 save

echo "✅ Todo apagado y reiniciado desde cero. ¡A darle!"
pm2 status