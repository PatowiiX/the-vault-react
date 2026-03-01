const express = require("express");
const router = express.Router();
const fetch = require('node-fetch');
const db = require("../db");

const PAYPAL_API = process.env.PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getPayPalAccessToken() {
  try {
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

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('PayPal no devolvió JSON:', text.substring(0, 200));
      throw new Error('PayPal API error: Respuesta no es JSON');
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`PayPal Auth Error: ${errorData.error_description || errorData.error}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error obteniendo token de PayPal:', error);
    throw error;
  }
}

router.post("/create-order", async (req, res) => {
  try {
    const { cart, subtotal, tax, shipping, total } = req.body;

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: "Carrito vacío o inválido" });
    }

    const connection = await db.promise().getConnection();
    
    try {
      for (const item of cart) {
        const [rows] = await connection.query(
          "SELECT stock, titulo FROM discos WHERE id = ?", 
          [item.id]
        );
        
        if (rows.length === 0) {
          return res.status(400).json({ error: `Producto "${item.title}" no encontrado` });
        }
        
        console.log(`📦 Producto ${item.title}: Stock en BD = ${rows[0].stock}, Solicitado = ${item.quantity}`);
        
        if (rows[0].stock < item.quantity) {
          return res.status(400).json({ 
            error: `Stock insuficiente para "${item.title}". Disponible: ${rows[0].stock}, Solicitado: ${item.quantity}` 
          });
        }
      }
    } finally {
      connection.release();
    }

    const accessToken = await getPayPalAccessToken();

    const items = cart.map(item => ({
      name: `${item.title} - ${item.artist}`.substring(0, 127),
      unit_amount: { 
        currency_code: 'MXN', 
        value: parseFloat(item.price).toFixed(2) 
      },
      quantity: item.quantity.toString()
    }));

    const paypalOrder = {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: `ORDER_${Date.now()}`,
        description: 'Compra en The Vault',
        items,
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
              value: parseFloat(tax || 0).toFixed(2) 
            },
            shipping: { 
              currency_code: 'MXN', 
              value: parseFloat(shipping || 0).toFixed(2) 
            }
          }
        }
      }],
      application_context: {
        brand_name: 'The Vault',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        shipping_preference: 'NO_SHIPPING',
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pago-exitoso`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/cart`
      }
    };

    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        Authorization: `Bearer ${accessToken}`,
        'PayPal-Request-Id': `req-${Date.now()}`
      },
      body: JSON.stringify(paypalOrder),
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('PayPal create-order no devolvió JSON:', text.substring(0, 500));
      return res.status(500).json({ error: 'Error en comunicación con PayPal' });
    }

    const data = await response.json();
    
    if (!response.ok) {
      console.error('PayPal error:', data);
      return res.status(400).json({ 
        error: data.details?.[0]?.description || data.message || 'Error creando orden en PayPal' 
      });
    }

    res.json(data);
    
  } catch (error) {
    console.error('Error en create-order:', error);
    res.status(500).json({ error: error.message || 'Error al crear orden' });
  }
});

router.post("/capture-order", async (req, res) => {
  const { orderId, usuario_id, cart, total, subtotal, tax, shipping } = req.body;

  console.log("📥 Recibido en /capture-order:", { 
    orderId, 
    usuario_id, 
    cartLength: cart?.length,
    total 
  });

  if (!orderId) {
    return res.status(400).json({ error: "ID de orden de PayPal requerido" });
  }

  if (!usuario_id) {
    return res.status(400).json({ error: "ID de usuario requerido" });
  }

  if (!cart || !Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ error: "Carrito inválido" });
  }

  const connection = await db.promise().getConnection();
  
  try {
    await connection.beginTransaction();

    console.log("🔒 Iniciando verificación de stock con bloqueo...");
    
    for (const item of cart) {
      const [rows] = await connection.query(
        "SELECT stock, titulo FROM discos WHERE id = ? FOR UPDATE", 
        [item.id]
      );
      
      if (rows.length === 0) {
        throw new Error(`Producto "${item.title}" no encontrado`);
      }
      
      console.log(`🔍 Producto ${item.title}: Stock actual = ${rows[0].stock}, Solicitado = ${item.quantity}`);
      
      if (rows[0].stock < item.quantity) {
        throw new Error(`Stock insuficiente para "${item.title}". Disponible: ${rows[0].stock}, Solicitado: ${item.quantity}`);
      }
    }

    console.log("💳 Capturando pago en PayPal...");
    
    const accessToken = await getPayPalAccessToken();
    
    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        Authorization: `Bearer ${accessToken}`,
        'PayPal-Request-Id': `capture-${orderId}-${Date.now()}`
      },
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('PayPal capture no devolvió JSON:', text.substring(0, 500));
      throw new Error('Error en respuesta de PayPal');
    }

    const paypalData = await response.json();
    
    if (!response.ok) {
      console.error('PayPal capture error:', paypalData);
      
      // ✅ VERIFICAR SI EL ERROR ES PORQUE YA FUE CAPTURADA
      if (paypalData.name === 'ORDER_ALREADY_CAPTURED') {
        console.log("⚠️ La orden ya fue capturada anteriormente");
        
        // ✅ VERIFICAR SI YA CREAMOS LA ORDEN EN NUESTRA BD
        const [ordenExistente] = await connection.query(
          "SELECT id FROM ordenes WHERE paypal_order_id = ?",
          [orderId]
        );
        
        if (ordenExistente.length > 0) {
          console.log("✅ Orden ya existe en BD, devolviendo datos existentes");
          await connection.commit();
          return res.json({
            ok: true,
            orden_id: ordenExistente[0].id,
            message: "Orden ya procesada anteriormente"
          });
        }
      }
      
      throw new Error(paypalData.message || 'No se pudo completar el pago en PayPal');
    }

    if (paypalData.status !== 'COMPLETED') {
      throw new Error(`Estado inesperado de PayPal: ${paypalData.status}`);
    }

    console.log("✅ Pago capturado en PayPal:", paypalData.status);

    console.log("📦 Actualizando stock...");
    
    for (const item of cart) {
      const [rows] = await connection.query(
        "SELECT stock FROM discos WHERE id = ? FOR UPDATE", 
        [item.id]
      );
      const stockNuevo = rows[0].stock - item.quantity;
      
      await connection.query(
        "UPDATE discos SET stock = ? WHERE id = ?", 
        [stockNuevo, item.id]
      );
      
      console.log(`✅ Stock actualizado: ${item.title} = ${stockNuevo}`);
      
      // ✅ VERIFICAR SI EXISTE LA TABLA stock_history
      try {
        await connection.query(
          `INSERT INTO stock_history 
           (disco_id, cambio, stock_anterior, stock_nuevo, motivo, created_at) 
           VALUES (?, ?, ?, ?, ?, NOW())`,
          [item.id, -item.quantity, rows[0].stock, stockNuevo, 'paypal_compra']
        );
      } catch (err) {
        console.log("⚠️ No se pudo insertar en stock_history (tabla no existe)");
      }
    }

    const trackingNumber = `TRK-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const estimatedDelivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

    const [ordenResult] = await connection.query(
      `INSERT INTO ordenes 
       (usuario_id, total, estado, orden_items, shipping_cost, tax_amount, subtotal, 
        tracking_number, estimated_delivery, paypal_order_id, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        usuario_id,
        total,
        'pagado',
        JSON.stringify(cart),
        shipping || 0,
        tax || 0,
        subtotal || 0,
        trackingNumber,
        estimatedDelivery,
        orderId
      ]
    );

    // ✅ INTENTAR ELIMINAR CARRITO (CON VERIFICACIÓN)
    try {
      const [tablas] = await connection.query("SHOW TABLES LIKE 'carrito_items'");
      if (tablas.length > 0) {
        await connection.query(
          "DELETE FROM carrito_items WHERE carrito_id IN (SELECT id FROM carritos WHERE usuario_id = ?)",
          [usuario_id]
        );
        console.log("✅ Carrito items eliminados");
      }
    } catch (err) {
      console.log("⚠️ No se pudo eliminar carrito_items:", err.message);
    }

    try {
      const [tablas] = await connection.query("SHOW TABLES LIKE 'carritos'");
      if (tablas.length > 0) {
        await connection.query(
          "DELETE FROM carritos WHERE usuario_id = ?",
          [usuario_id]
        );
        console.log("✅ Carrito eliminado");
      }
    } catch (err) {
      console.log("⚠️ No se pudo eliminar carritos:", err.message);
    }

    await connection.commit();
    console.log("✅ Transacción completada exitosamente");

    res.json({
      ok: true,
      orden_id: ordenResult.insertId,
      tracking_number: trackingNumber,
      paypal_status: paypalData.status,
      message: "Pago procesado exitosamente"
    });

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error en capture-order (rollback ejecutado):', error);
    res.status(500).json({ error: error.message || 'Error procesando pago' });
  } finally {
    connection.release();
  }
});

module.exports = router;