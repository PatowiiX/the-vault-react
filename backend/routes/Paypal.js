const express = require("express");
const router = express.Router();
const fetch = require('node-fetch');
const db = require("../db"); //  AGREGAR ESTO

// Configuración de URL según el modo (Sandbox o Live)
const PAYPAL_API = process.env.PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

// ==========================================
// FUNCIÓN: Obtener Token de Acceso de PayPal
// ==========================================
async function getPayPalAccessToken() {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
  ).toString('base64');

  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  const data = await response.json();
  return data.access_token;
}

// ==========================================
// RUTA 1: Crear orden en PayPal (CON VERIFICACIÓN DE STOCK)
// ==========================================
router.post("/create-order", async (req, res) => {
  try {
    const { cart, subtotal, tax, shipping, total } = req.body;

    // VERIFICAR STOCK ANTES DE CREAR ORDEN PAYPAL
    for (const item of cart) {
      const [rows] = await db.promise().query(
        "SELECT stock FROM discos WHERE id = ?",
        [item.id]
      );
      
      if (rows.length === 0) {
        return res.status(400).json({ 
          error: `Producto "${item.title}" no encontrado` 
        });
      }
      
      if (rows[0].stock < item.quantity) {
        return res.status(400).json({ 
          error: `Stock insuficiente para "${item.title}". Disponible: ${rows[0].stock}` 
        });
      }
    }

    console.log("Stock verificado, creando orden PayPal...");

    const accessToken = await getPayPalAccessToken();

    const items = cart.map(item => ({
      name: `${item.title} - ${item.artist}`,
      unit_amount: {
        currency_code: 'MXN',
        value: parseFloat(item.price).toFixed(2)
      },
      quantity: item.quantity
    }));

    const paypalOrder = {
      intent: 'CAPTURE',
      purchase_units: [{
        items: items,
        amount: {
          currency_code: 'MXN',
          value: parseFloat(total).toFixed(2),
          breakdown: {
            item_total: {
              currency_code: 'MXN',
              value: parseFloat(subtotal).toFixed(2)
            },
            tax_total: {
              currency_code: 'MXN',
              value: parseFloat(tax).toFixed(2)
            },
            shipping: {
              currency_code: 'MXN',
              value: parseFloat(shipping).toFixed(2)
            }
          }
        }
      }],
      application_context: {
        brand_name: 'The Vault',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        return_url: 'http://localhost:3000/pago-exitoso',
        cancel_url: 'http://localhost:3000/carrito'
      }
    };

    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(paypalOrder),
    });

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('❌ Error al crear orden PayPal:', error);
    res.status(500).json({ error: 'Error al crear orden' });
  }
});

// ==========================================
// RUTA 2: Capturar Pago y Registrar en BD
// ==========================================
router.post("/capture-order", async (req, res) => {
  console.log("\n--- INICIANDO CAPTURA DE PAGO ---");
  
  const { orderId, usuario_id, cart, total, subtotal, tax, shipping } = req.body;

  //  INICIAR CONEXIÓN PARA TRANSACCIÓN
  const connection = await db.promise().getConnection();
  
  try {
    // INICIAR TRANSACCIÓN
    await connection.beginTransaction();

    // 1. VERIFICAR STOCK NUEVAMENTE (por si acaso)
    for (const item of cart) {
      const [rows] = await connection.query(
        "SELECT id, titulo, stock FROM discos WHERE id = ? FOR UPDATE",
        [item.id]
      );
      
      if (rows.length === 0) {
        throw new Error(`Producto "${item.title}" no encontrado`);
      }
      
      if (rows[0].stock < item.quantity) {
        throw new Error(`Stock insuficiente para "${item.title}". Disponible: ${rows[0].stock}`);
      }
    }

    // 2. Obtener token y capturar en PayPal
    const accessToken = await getPayPalAccessToken();
    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const paypalData = await response.json();

    // 3. VALIDACIÓN: Verificar si el pago fue exitoso
    if (paypalData.status !== 'COMPLETED') {
      console.error("⚠️ PayPal respondió con estado:", paypalData.status);
      
      await connection.rollback();
      connection.release();
      
      if (paypalData.name === 'UNPROCESSABLE_ENTITY' && paypalData.details?.[0]?.issue === 'ORDER_ALREADY_CAPTURED') {
        return res.status(400).json({ 
          error: "Esta orden ya fue procesada anteriormente.", 
          detalles: paypalData 
        });
      }

      return res.status(400).json({ error: "No se pudo completar el pago en PayPal", detalles: paypalData });
    }

    console.log("💰 PayPal: Pago COMPLETED. Actualizando stock...");

    // 4. ACTUALIZAR STOCK DIRECTAMENTE (más seguro que llamar a otra API)
    for (const item of cart) {
      const [rows] = await connection.query(
        "SELECT stock FROM discos WHERE id = ? FOR UPDATE",
        [item.id]
      );
      
      const stockAnterior = rows[0].stock;
      const stockNuevo = stockAnterior - item.quantity;
      
      await connection.query(
        "UPDATE discos SET stock = ? WHERE id = ?",
        [stockNuevo, item.id]
      );
      
      // Registrar en stock_history
      await connection.query(
        `INSERT INTO stock_history (disco_id, cambio, stock_anterior, stock_nuevo, motivo) 
         VALUES (?, ?, ?, ?, ?)`,
        [item.id, -item.quantity, stockAnterior, stockNuevo, 'paypal_compra']
      );
      
      console.log(`📦 Stock actualizado: ${item.title} (${stockAnterior} → ${stockNuevo})`);
    }

    // 5. CREAR ORDEN EN BASE DE DATOS
    const trackingNumber = `TRK-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

    const [ordenResult] = await connection.query(
      `INSERT INTO ordenes 
       (usuario_id, total, estado, orden_items, shipping_cost, tax_amount, subtotal, tracking_number, estimated_delivery) 
       VALUES (?, ?, 'pagado', ?, ?, ?, ?, ?, ?)`,
      [
        usuario_id, 
        total, 
        JSON.stringify(cart), 
        shipping || 0, 
        tax || 0, 
        subtotal || 0, 
        trackingNumber, 
        estimatedDelivery
      ]
    );

    const ordenId = ordenResult.insertId;

    // 6. LIMPIAR CARRITO DEL USUARIO
    if (usuario_id) {
      await connection.query("DELETE FROM carrito WHERE usuario_id = ?", [usuario_id]);
    }

    // 7. CONFIRMAR TRANSACCIÓN
    await connection.commit();
    connection.release();

    console.log(`✅ Orden #${ordenId} creada con éxito. Tracking: ${trackingNumber}`);

    // 8. RESPUESTA FINAL AL FRONTEND
    res.json({ 
      ok: true, 
      orden_id: ordenId,
      tracking_number: trackingNumber,
      message: "Pago procesado, stock actualizado y orden registrada"
    });

  } catch (error) {
    // SI ALGO FALLA, REVERTIR TODO
    await connection.rollback();
    connection.release();
    
    console.error('❌ Error crítico en /capture-order:', error);
    res.status(500).json({ 
      error: error.message || "Error al procesar el pago",
      detalles: "La transacción ha sido revertida. No se ha cobrado ni descontado stock."
    });
  }
});

module.exports = router;