const express = require("express");
const router = express.Router();
const db = require("../db");
const crypto = require("crypto");
const { Resend } = require('resend');
require('dotenv').config({ path: 'C:/Users/patog/OneDrive/Desktop/the-vault-react/backend/.env' });

const resend = new Resend(process.env.RESEND_API_KEY);

// ===========================
// CREAR ORDEN DESDE CARRITO
// ===========================
router.post("/", (req, res) => {
    const { usuario_id, session_id, direccion_envio, metodo_pago, items, subtotal, shipping, tax, total } = req.body;

    if (!usuario_id && !session_id) {
        return res.status(400).json({ error: "Se requiere identificación de usuario" });
    }

    if (!items || items.length === 0) {
        return res.status(400).json({ error: "El carrito está vacío" });
    }

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ error: "Error en transacción" });

        let stockOk = true;
        let stockErrors = [];

        const checkStock = (index) => {
            if (index >= items.length) {
                if (!stockOk) {
                    return db.rollback(() => {
                        res.status(400).json({ error: "Stock insuficiente", detalles: stockErrors });
                    });
                }
                return createOrder();
            }

            const item = items[index];
            db.query(
                "SELECT titulo, stock FROM discos WHERE id = ?",
                [item.id],
                (err, results) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({ error: "Error verificando stock" });
                        });
                    }

                    if (results.length === 0) {
                        stockOk = false;
                        stockErrors.push(`Producto no encontrado: ID ${item.id}`);
                    } else {
                        const disco = results[0];
                        if (disco.stock < item.quantity) {
                            stockOk = false;
                            stockErrors.push(`"${disco.titulo}" solo tiene ${disco.stock} unidades disponibles`);
                        }
                    }
                    checkStock(index + 1);
                }
            );
        };

        const createOrder = () => {
            const ordenData = {
                usuario_id: usuario_id || null,
                session_id: session_id || null,
                total: total,
                subtotal: subtotal,
                shipping_cost: shipping,
                tax_amount: tax,
                direccion_envio: direccion_envio,
                metodo_pago: metodo_pago,
                estado: 'pendiente',
                orden_items: JSON.stringify(items.map(item => ({
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

            db.query(
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
                ],
                (err, result) => {
                    if (err) {
                        return db.rollback(() => {
                            console.error("Error creando orden:", err);
                            res.status(500).json({ error: "Error al crear orden" });
                        });
                    }

                    const ordenId = result.insertId;

                    let completed = 0;
                    let hasError = false;

                    items.forEach((item) => {
                        db.query(
                            "SELECT stock FROM discos WHERE id = ?",
                            [item.id],
                            (err, stockResults) => {
                                if (err || !stockResults.length) {
                                    hasError = true;
                                    return;
                                }

                                const stockAnterior = stockResults[0].stock;
                                const stockNuevo = stockAnterior - item.quantity;

                                db.query(
                                    "UPDATE discos SET stock = ? WHERE id = ?",
                                    [stockNuevo, item.id],
                                    (err) => {
                                        if (err) {
                                            hasError = true;
                                            return;
                                        }

                                        db.query(
                                            `INSERT INTO stock_history 
                                            (disco_id, orden_id, cambio, stock_anterior, stock_nuevo, motivo) 
                                            VALUES (?, ?, ?, ?, ?, ?)`,
                                            [item.id, ordenId, -item.quantity, stockAnterior, stockNuevo, 'compra'],
                                            (err) => {
                                                if (err) console.error("Error registrando historial:", err);

                                                completed++;
                                                if (completed === items.length && !hasError) {
                                                    db.query(
                                                        "SELECT email, nombre FROM usuarios WHERE id = ?",
                                                        [usuario_id],
                                                        async (err, users) => {
                                                            if (!err && users.length > 0) {
                                                                await sendOrderConfirmationEmail(
                                                                    ordenId, 
                                                                    ordenData, 
                                                                    items, 
                                                                    users[0].email, 
                                                                    users[0].nombre
                                                                );
                                                            }

                                                            db.commit(err => {
                                                                if (err) {
                                                                    return db.rollback(() => {
                                                                        res.status(500).json({ error: "Error al confirmar" });
                                                                    });
                                                                }
                                                                res.json({
                                                                    ok: true,
                                                                    orden_id: ordenId,
                                                                    tracking_number: ordenData.tracking_number,
                                                                    message: "Orden creada exitosamente"
                                                                });
                                                            });
                                                        }
                                                    );
                                                }
                                            }
                                        );
                                    }
                                );
                            }
                        );
                    });
                }
            );
        };

        checkStock(0);
    });
});

// ===========================
// ENVIAR EMAIL DE CONFIRMACIÓN DE PEDIDO
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
        const { data, error } = await resend.emails.send({
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
            console.error("❌ Error de Resend en confirmación:", error);
        } else {
            console.log(`✅ Email de confirmación enviado a ${userEmail}`);
        }
    } catch (error) {
        console.error("❌ Error enviando email de confirmación:", error);
    }
}

// ===========================
// OBTENER ORDEN POR ID
// ===========================
router.get("/:ordenId", (req, res) => {
    db.query(
        `SELECT o.*, u.nombre, u.email 
         FROM ordenes o
         LEFT JOIN usuarios u ON o.usuario_id = u.id
         WHERE o.id = ?`,
        [req.params.ordenId],
        (err, ordenes) => {
            if (err) return res.status(500).json({ error: "Error DB" });
            if (ordenes.length === 0) {
                return res.status(404).json({ error: "Orden no encontrada" });
            }

            const orden = ordenes[0];
            if (orden.orden_items) {
                try {
                    orden.items = JSON.parse(orden.orden_items);
                } catch (e) {
                    orden.items = [];
                }
            }
            res.json({ ok: true, orden });
        }
    );
});

module.exports = router;