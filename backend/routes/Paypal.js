const express = require("express");
const router = express.Router();
const fetch = require('node-fetch');

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
// RUTA 1: Crear orden en PayPal
// ==========================================
router.post("/create-order", async (req, res) => {
  try {
    const { cart, subtotal, tax, shipping, total } = req.body;

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

  try {
    // 1. Obtener token y capturar en PayPal
    const accessToken = await getPayPalAccessToken();
    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const paypalData = await response.json();

    // 2. VALIDACIÓN: Verificar si el pago fue exitoso
    // Si PayPal ya lo capturó o falla, status no será COMPLETED
    if (paypalData.status !== 'COMPLETED') {
      console.error("⚠️ PayPal respondió con estado:", paypalData.status);
      
      // Manejo específico si ya fue capturado (para no perder la orden)
      if (paypalData.name === 'UNPROCESSABLE_ENTITY' && paypalData.details[0].issue === 'ORDER_ALREADY_CAPTURED') {
        return res.status(400).json({ 
          error: "Esta orden ya fue procesada anteriormente.", 
          detalles: paypalData 
        });
      }

      return res.status(400).json({ error: "No se pudo completar el pago en PayPal", detalles: paypalData });
    }

    console.log("💰 PayPal: Pago COMPLETED. Procediendo a actualizar Base de Datos...");

    // 3. LLAMAR A TU API DE PEDIDOS (Donde está el descuento de stock)
    // Usamos la URL absoluta de tu servidor local
    const ordenesResponse = await fetch('http://localhost:3001/api/ordenes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuario_id: usuario_id,
        items: cart,
        subtotal: subtotal,
        shipping: shipping,
        tax: tax,
        total: total
      })
    });

    const ordenData = await ordenesResponse.json();

    // 4. RESPUESTA FINAL AL FRONTEND
    if (ordenData.ok) {
      console.log("✅ Proceso terminado con éxito: Stock actualizado y orden guardada.");
      res.json({ 
        ok: true, 
        orden_id: ordenData.orden_id,
        tracking_number: ordenData.tracking_number,
        message: "Pago y registro exitoso"
      });
    } else {
      console.error("❌ Error en registro de BD:", ordenData.error);
      res.status(500).json({ 
        error: "El pago se cobró pero hubo un error al actualizar el inventario. Contacte a soporte.",
        detalles: ordenData.error 
      });
    }

  } catch (error) {
    console.error('❌ Error crítico en /capture-order:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;