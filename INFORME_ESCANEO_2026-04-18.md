# Informe Tecnico de Escaneo y Correccion

Fecha: 2026-04-18
Proyecto: `the-vault-react`
Alcance: frontend React, backend Express, rutas, autenticacion, pagos, recuperacion de contrasena, pruebas y validaciones tecnicas.

## 1. Objetivo

Realizar un escaneo tecnico completo del proyecto para detectar errores, bugs y riesgos funcionales reproducibles, aplicar correcciones y dejar evidencia de validacion para el informe de estabilidad del sistema.

## 2. Metodologia aplicada

Se realizo el trabajo en cuatro fases:

1. Revision de estructura del proyecto y scripts disponibles.
2. Ejecucion de validaciones reproducibles (`build`, `test`, `eslint`, chequeo de sintaxis del backend).
3. Correccion de errores funcionales y estructurales encontrados.
4. Revalidacion final para confirmar estabilidad tecnica.

## 3. Hallazgos principales detectados

### 3.1 Dependencias y compatibilidad

- El entorno no tenia `node_modules` instalado, por lo que inicialmente no era posible ejecutar `react-scripts`.
- En PowerShell, `npm.ps1` estaba bloqueado por la politica de ejecucion local; para validar se uso `npm.cmd`.
- `react-router-dom` en version 7 provocaba incompatibilidades con el stack basado en `react-scripts` y Jest.

### 3.2 Frontend

- `App` estaba envuelto en `AppProvider` dentro de `src/App.jsx` y tambien en `src/index.js`, generando doble provider.
- Faltaban rutas funcionales o estaban incompletas:
  - `/login`
  - `/pago-exitoso`
  - `/reset-password`
- Las rutas protegidas redirigian sin esperar el estado de carga del contexto.
- `MiCuenta` no respetaba correctamente el query string `?tab=orders` y `?tab=payment-methods`.
- Habia redirecciones a `/login` aun cuando la pantalla real de acceso estaba integrada en `Home` mediante modal.
- `ResetPassword` solo leia el token desde query string y no cubria el caso del parametro de ruta.
- Existian advertencias de hooks y dependencias faltantes que podian generar comportamiento inconsistente.
- El test por defecto no representaba el comportamiento real del proyecto y estaba roto.

### 3.3 Backend

- El flujo de recuperacion de contrasena actualizaba `password_hash` con texto plano en lugar de aplicar `bcrypt`.
- La ruta de password recovery estaba amarrada a una ruta absoluta local antigua de `.env`.
- Los correos de recuperacion y confirmacion usaban enlaces fijos a `http://localhost:3000`.
- Las fotos de perfil se guardaban en una ruta que no coincidia con la carpeta publica real servida por la app.
- El backend no exponia correctamente `/uploads`, por lo que los avatares podian romperse en frontend.
- El endpoint de creacion de orden normal (`/api/ordenes`) no validaba ni descontaba stock.
- El flujo de pago con tarjeta guardada estaba simulado en frontend y no generaba una orden real.

## 4. Correcciones aplicadas

### 4.1 Arquitectura y rutas

- Se elimino la duplicidad de `AppProvider` en `src/App.jsx`, dejando el provider centralizado en `src/index.js`.
- Se reforzo `ProtectedRoute` para esperar `loading` antes de redirigir.
- Se agregaron o corrigieron las rutas:
  - `/login`
  - `/pago-exitoso`
  - `/reset-password`
  - `/reset-password/:token`

### 4.2 Flujo de login y cuenta

- Se conecto la ruta `/login` con el flujo real del modal de acceso dentro de `Header`.
- Se mejoro la navegacion posterior al login para volver a la ruta solicitada originalmente.
- `MiCuenta` ahora interpreta correctamente el query param `tab` y navega entre perfil, pedidos y metodos de pago.
- Se unifico el logout para que use el contexto en lugar de limpiar almacenamiento de forma aislada.

### 4.3 Recuperacion de contrasena

- Se rehizo `backend/routes/password.js` para:
  - usar `bcrypt`
  - usar `FRONTEND_URL`
  - dejar de depender de una ruta absoluta local antigua
  - validar tokens con consultas modernas
  - marcar tokens como usados
- `ResetPassword.jsx` ahora soporta token por query string y por parametro de ruta.

### 4.4 Avatares y recursos publicos

- Se corrigio la carpeta de subida de avatar para que apunte a `public/uploads/avatars`.
- Se expuso `/uploads` desde `backend/server.js`.
- Se normalizaron las URLs de avatar tanto en backend como en frontend para evitar rutas rotas.

### 4.5 Pagos y ordenes

- El flujo de pago con tarjeta guardada ya no queda solo simulado:
  - ahora usa `processPayment`
  - crea orden real
  - limpia checkout pendiente
  - redirige con el `orderId` real
- `PagoExitoso.jsx` ahora soporta exitos tanto por retorno de PayPal como por navegacion interna con estado.
- El endpoint `backend/routes/ordenes.js` ahora:
  - valida stock antes de insertar la orden
  - bloquea filas con `FOR UPDATE`
  - descuenta stock al confirmar la compra

### 4.6 Calidad de codigo y pruebas

- Se corrigieron warnings de hooks en:
  - `Cart.jsx`
  - `SpotifyPreview.jsx`
  - `ResetPassword.jsx`
  - `AppContext.jsx`
- Se eliminaron variables no usadas y se limpio export anonimo en `src/services/api.js`.
- Se reemplazo el test base roto por un test adaptado a la estructura real de la app.
- Se ajusto `react-router-dom` a `6.30.1` para compatibilidad estable con `react-scripts` y Jest.

## 5. Validaciones ejecutadas

Validaciones tecnicas finales completadas el 2026-04-18:

- `npm.cmd test -- --watchAll=false` -> OK
- `npm.cmd run build` -> OK
- `npx.cmd eslint src backend --ext .js,.jsx --format unix` -> OK
- `node --check` sobre archivos del backend -> OK

Resultado: el proyecto queda estable a nivel de compilacion, pruebas automatizadas disponibles, lint y sintaxis del backend.

## 6. Riesgos o pendientes identificados

No quedaron errores reproducibles abiertos en las validaciones ejecutadas, pero si quedan pendientes de contexto externo:

- No se hizo prueba end-to-end real contra servicios vivos de MySQL, PayPal o Resend.
- `npm audit --omit=dev --audit-level=high` sigue reportando vulnerabilidades transitivas del stack legado de `react-scripts` y dependencias relacionadas.
- El warning de `fs.F_OK` proviene del tooling heredado del ecosistema y no del codigo funcional del proyecto.

## 7. Conclusiones

Con fecha 2026-04-18 se completo un escaneo tecnico integral del proyecto `the-vault-react`, se corrigieron los errores funcionales y estructurales reproducibles mas importantes y se dejo la base validada con pruebas, compilacion y analisis estatico satisfactorios.

Estado final del proyecto: estable para continuar desarrollo, pruebas manuales integradas y documentacion de hallazgos completada.
