const express = require("express");
const router = express.Router();
const fetch = require('node-fetch');
const db = require("../db");
const crypto = require("crypto");
const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

const PAYPAL_API = process.env.PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

// Obtener token de acceso
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

// Crear orden en PayPal
router.post("/create-order", async (req, res) => {
  try {
    const { cart, subtotal, tax, shipping, total, shippingAddress, usuario_id } = req.body;

    if (!cart || cart.length === 0) {
      return res.status(400).json({ error: "Carrito vacío" });
    }

    const accessToken = await getPayPalAccessToken();

    const items = cart.map(item => ({
      name: `${item.title} - ${item.artist}`,
      unit_amount: {
        currency_code: 'MXN',
        value: item.price.toFixed(2)
      },
      quantity: item.quantity,
      description: `${item.format} - ${item.genre || ''}`
    }));

    const paypalOrder = {
      intent: 'CAPTURE',
      purchase_units: [{
        items: items,
        amount: {
          currency_code: 'MXN',
          value: total.toFixed(2),
          breakdown: {
            item_total: {
              currency_code: 'MXN',
              value: subtotal.toFixed(2)
            },
            tax_total: {
              currency_code: 'MXN',
              value: tax.toFixed(2)
            },
            shipping: {
              currency_code: 'MXN',
              value: shipping.toFixed(2)
            }
          }
        },
        shipping: {
          address: {
            address_line_1: shippingAddress.address,
            admin_area_2: shippingAddress.city,
            postal_code: shippingAddress.zipCode,
            country_code: shippingAddress.country === 'México' ? 'MX' : 'US'
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
    console.error('Error creating PayPal order:', error);
    res.status(500).json({ error: 'Error al crear orden de pago' });
  }
});

// ============================================
// CAPTURAR PAGO DE PAYPAL Y CREAR ORDEN EN BD
// ============================================
router.post("/capture-order", async (req, res) => {
  const { orderId, usuario_id, cart, shippingAddress, total, subtotal, tax, shipping } = req.body;

  try {
    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    console.log('Pago capturado:', data);

    // ✅ VERIFICAR QUE EL PAGO FUE EXITOSO
    if (data.status === 'COMPLETED') {
      
      // ============================================
      // 1. VERIFICAR STOCK NUEVAMENTE (por si acaso)
      // ============================================
      let stockOk = true;
      let stockErrors = [];

      for (const item of cart) {
        const [stockResult] = await db.promise().query(
          "SELECT stock FROM discos WHERE id = ?",
          [item.id]
        );
        
        if (stockResult.length === 0) {
          stockOk = false;
          stockErrors.push(`Producto no encontrado: ${item.title}`);
        } else if (stockResult[0].stock < item.quantity) {
          stockOk = false;
          stockErrors.push(`"${item.title}" solo tiene ${stockResult[0].stock} unidades`);
        }
      }

      if (!stockOk) {
        return res.status(400).json({ 
          error: "Stock insuficiente", 
          detalles: stockErrors 
        });
      }

      // ============================================
      // 2. CREAR LA ORDEN EN BASE DE DATOS
      // ============================================
      const ordenData = {
        usuario_id: usuario_id || null,
        session_id: null,
        total: total,
        subtotal: subtotal,
        shipping_cost: shipping,
        tax_amount: tax,
        direccion_envio: `${shippingAddress.address}, ${shippingAddress.city}, ${shippingAddress.zipCode}, ${shippingAddress.country}`,
        metodo_pago: 'PayPal',
        estado: 'pagado',
        orden_items: JSON.stringify(cart.map(item => ({
          disco_id: item.id,
          titulo: item.title,
          artista: item.artist,
          formato: item.format,
          cantidad: item.quantity,
          precio_unitario: item.price,
          subtotal: item.price * item.quantity
        }))),
        tracking_number: `TRK-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
      };

      const [ordenResult] = await db.promise().query(
        `INSERT INTO ordenes 
        (usuario_id, session_id, total, subtotal, shipping_cost, tax_amount, 
         direccion_envio, metodo_pago, estado, orden_items, tracking_number) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ordenData.usuario_id,
          ordenData.session_id,
          ordenData.total,
          ordenData.subtotal,
          ordenData.shipping_cost,
          ordenData.tax_amount,
          ordenData.direccion_envio,
          ordenData.metodo_pago,
          ordenData.estado,
          ordenData.orden_items,
          ordenData.tracking_number
        ]
      );

      const ordenId = ordenResult.insertId;

      // ============================================
      // 3. ACTUALIZAR STOCK DE CADA PRODUCTO
      // ============================================
      for (const item of cart) {
        const [stockResult] = await db.promise().query(
          "SELECT stock FROM discos WHERE id = ?",
          [item.id]
        );
        
        const stockAnterior = stockResult[0].stock;
        const stockNuevo = stockAnterior - item.quantity;

        await db.promise().query(
          "UPDATE discos SET stock = ? WHERE id = ?",
          [stockNuevo, item.id]
        );

        // Registrar en historial
        await db.promise().query(
          `INSERT INTO stock_history 
          (disco_id, orden_id, cambio, stock_anterior, stock_nuevo, motivo) 
          VALUES (?, ?, ?, ?, ?, ?)`,
          [item.id, ordenId, -item.quantity, stockAnterior, stockNuevo, 'compra']
        );
      }

      // ============================================
      // 4. ENVIAR EMAIL DE CONFIRMACIÓN
      // ============================================
      if (usuario_id) {
        const [userResult] = await db.promise().query(
          "SELECT email, nombre FROM usuarios WHERE id = ?",
          [usuario_id]
        );

        if (userResult.length > 0) {
          const user = userResult[0];
          await sendOrderConfirmationEmail(ordenId, ordenData, cart, user.email, user.nombre);
        }
      }

      // ============================================
      // 5. RESPONDER AL FRONTEND
      // ============================================
      res.json({
        ok: true,
        orden_id: ordenId,
        tracking_number: ordenData.tracking_number,
        paypal_data: data
      });

    } else {
      res.status(400).json({ error: "El pago no fue completado" });
    }

  } catch (error) {
    console.error('Error capturando pago:', error);
    res.status(500).json({ error: 'Error al procesar el pago' });
  }
});

// ============================================
// FUNCIÓN PARA ENVIAR EMAIL DE CONFIRMACIÓN
// ============================================
async function sendOrderConfirmationEmail(ordenId, ordenData, items, userEmail, userNombre) {
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding:10px; border-bottom:1px solid #333;">
        <strong>${item.title}</strong><br>
        <small>${item.artist} - ${item.format}</small>
      </td>
      <td style="padding:10px; border-bottom:1px solid #333; text-align: center;">${item.quantity}</td>
      <td style="padding:10px; border-bottom:1px solid #333; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  try {
    const { error } = await resend.emails.send({
      from: 'The Vault <onboarding@resend.dev>',
      to: [userEmail],
      subject: `✅ Confirmación de pedido #${ordenId} - The Vault`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; border-radius: 15px; overflow: hidden; border: 2px solid #00ff88;">
          <div style="background: linear-gradient(45deg, #00ff88, #00cc66); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">THE VAULT</h1>
          </div>
          <div style="padding: 30px; color: white;">
            <h2>¡Gracias por tu compra, ${userNombre}!</h2>
            <p>Tu pedido ha sido recibido y está siendo procesado.</p>
            
            <div style="background: #0f0f1a; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h3>Detalles del pedido #${ordenId}</h3>
              <p><strong>Número de seguimiento:</strong> ${ordenData.tracking_number}</p>
              
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #2a2a3a;">
                    <th style="padding:10px; text-align:left;">Producto</th>
                    <th style="padding:10px;">Cant.</th>
                    <th style="padding:10px;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
              
              <hr style="border: 1px solid #333; margin: 20px 0;">
              
              <div style="text-align: right;">
                <p><strong>Subtotal:</strong> $${ordenData.subtotal.toFixed(2)}</p>
                <p><strong>Envío:</strong> $${ordenData.shipping_cost.toFixed(2)}</p>
                <p><strong>IVA:</strong> $${ordenData.tax_amount.toFixed(2)}</p>
                <p style="font-size: 20px; color: #00ff88;"><strong>TOTAL:</strong> $${ordenData.total.toFixed(2)}</p>
              </div>
              
              <div style="margin-top: 20px; padding: 15px; background: #1a1a2e; border-radius: 5px;">
                <h4>📦 Dirección de envío:</h4>
                <p>${ordenData.direccion_envio}</p>
                <p><strong>💳 Método de pago:</strong> ${ordenData.metodo_pago}</p>
              </div>
            </div>
            
            <div style="text-align: center;">
              <a href="http://localhost:3000/orden/${ordenId}" 
                 style="background: linear-gradient(45deg, #ff00ff, #ff007f); color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px;">
                VER DETALLES DEL PEDIDO
              </a>
            </div>
          </div>
        </div>
      `
    });

    if (error) {
      console.error("❌ Error de Resend:", error);
    } else {
      console.log(`✅ Email enviado a ${userEmail}`);
    }
  } catch (error) {
    console.error("❌ Error enviando email:", error);
  }
}

module.exports = router;

/////YA NO DEBERIA DAR PROBLEMA!