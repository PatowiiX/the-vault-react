const express = require("express");
const router = express.Router();
const db = require("../db"); 
const crypto = require("crypto");
const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

// ==========================================
// RUTA: CREAR ORDEN (POST /api/ordenes)
// ==========================================
router.post("/", async (req, res) => {
    const { usuario_id, items, subtotal, shipping, tax, total } = req.body;

    // Validaciones iniciales
    if (!usuario_id) return res.status(400).json({ error: "ID de usuario requerido" });
    if (!items || items.length === 0) return res.status(400).json({ error: "El carrito está vacío" });

    // Obtener conexión para transacción
    const connection = await db.promise().getConnection();
    
    try {
        // INICIAR TRANSACCIÓN (FORMA CORRECTA)
        await connection.beginTransaction();

        // 1. VERIFICAR STOCK Y ACTUALIZAR CADA PRODUCTO
        for (const item of items) {
            // Consultamos el stock actual
            const [rows] = await connection.query(
                "SELECT titulo, stock FROM discos WHERE id = ? FOR UPDATE", 
                [item.id]
            );

            if (rows.length === 0) throw new Error(`El producto con ID ${item.id} no existe.`);
            
            const disco = rows[0];

            if (disco.stock < item.quantity) {
                throw new Error(`Stock insuficiente para "${disco.titulo}". Disponible: ${disco.stock}`);
            }

            const stockAnterior = disco.stock;
            const stockNuevo = stockAnterior - item.quantity;

            // Actualizar stock en la tabla discos
            await connection.query(
                "UPDATE discos SET stock = ? WHERE id = ?",
                [stockNuevo, item.id]
            );

            // Registrar en stock_history
            await connection.query(
                `INSERT INTO stock_history (disco_id, cambio, stock_anterior, stock_nuevo, motivo) 
                 VALUES (?, ?, ?, ?, ?)`,
                [item.id, -item.quantity, stockAnterior, stockNuevo, 'compra']
            );
        }

        // 2. GENERAR DATOS DE LA ORDEN
        const trackingNumber = `TRK-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
        const estimatedDelivery = new Date();
        estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

        const queryOrden = `
            INSERT INTO ordenes 
            (usuario_id, total, estado, orden_items, shipping_cost, tax_amount, subtotal, tracking_number, estimated_delivery) 
            VALUES (?, ?, 'pagado', ?, ?, ?, ?, ?, ?)
        `;

        const [resOrden] = await connection.query(queryOrden, [
            usuario_id, 
            total, 
            JSON.stringify(items), 
            shipping || 0, 
            tax || 0, 
            subtotal || 0, 
            trackingNumber, 
            estimatedDelivery
        ]);

        const ordenId = resOrden.insertId;

        // 3. LIMPIAR EL CARRITO DEL USUARIO
        await connection.query("DELETE FROM carrito WHERE usuario_id = ?", [usuario_id]);

        // 4. CONFIRMAR TRANSACCIÓN
        await connection.commit();
        connection.release();

        console.log(`✅ Pedido #${ordenId} completado con éxito.`);

        // 5. ENVIAR EMAIL DE CONFIRMACIÓN (Async - no await para no bloquear)
        const [userRows] = await db.promise().query("SELECT email, nombre FROM usuarios WHERE id = ?", [usuario_id]);
        if (userRows.length > 0) {
            sendOrderConfirmationEmail(
                ordenId, 
                { tracking_number: trackingNumber, subtotal, shipping_cost: shipping, tax_amount: tax, total }, 
                items, 
                userRows[0].email, 
                userRows[0].nombre
            );
        }

        res.json({
            ok: true,
            orden_id: ordenId,
            tracking_number: trackingNumber,
            message: "Compra registrada y stock actualizado."
        });

    } catch (error) {
        // Si algo falla, revertimos todos los cambios
        await connection.rollback();
        connection.release();
        
        console.error("❌ Error procesando orden:", error.message);
        console.error("❌ Stack:", error.stack);
        res.status(400).json({ error: error.message });
    }
});

// ===========================
// FUNCIÓN: ENVIAR EMAIL
// ===========================
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
        await resend.emails.send({
            from: 'The Vault <onboarding@resend.dev>',
            to: [userEmail],
            subject: `✅ Confirmación de pedido #${ordenId} - The Vault`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; border-radius: 15px; overflow: hidden; border: 2px solid #00ff88; color: white; padding: 20px;">
                    <h1 style="text-align: center; color: #00ff88;">THE VAULT</h1>
                    <p>¡Gracias por tu compra, ${userNombre}!</p>
                    <div style="background: #0f0f1a; padding: 15px; border-radius: 10px;">
                        <h3>Orden #${ordenId}</h3>
                        <p><strong>Tracking:</strong> ${ordenData.tracking_number}</p>
                        <table style="width: 100%; color: white;">
                            ${itemsHtml}
                        </table>
                        <div style="text-align: right; margin-top: 15px;">
                            <p>Total: <span style="color: #00ff88; font-size: 1.2em;">$${ordenData.total.toFixed(2)}</span></p>
                        </div>
                    </div>
                </div>
            `
        });
    } catch (e) { console.error("Error envío email:", e); }
}

// ===========================
// OBTENER DETALLES DE ORDEN
// ===========================
router.get("/:ordenId", (req, res) => {
    db.query(
        `SELECT o.*, u.nombre, u.email FROM ordenes o
         LEFT JOIN usuarios u ON o.usuario_id = u.id
         WHERE o.id = ?`,
        [req.params.ordenId],
        (err, results) => {
            if (err || results.length === 0) return res.status(404).json({ error: "Orden no encontrada" });
            const orden = results[0];
            try { orden.items = JSON.parse(orden.orden_items); } catch (e) { orden.items = []; }
            res.json({ ok: true, orden });
        }
    );
});

module.exports = router;