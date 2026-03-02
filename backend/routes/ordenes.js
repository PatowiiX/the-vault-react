const express = require("express");
const router = express.Router();
const db = require("../db"); 
const crypto = require("crypto");

// ✅ GET - Obtener todas las órdenes (solo admin)
router.get("/", async (req, res) => {
    const admin = req.query.admin;
    console.log("📥 GET /ordenes - admin:", admin);
    
    if (!admin) {
        return res.status(403).json({ error: "Acceso denegado" });
    }

    try {
        const connection = await db.promise().getConnection();
        
        const [ordenes] = await connection.query(`
            SELECT 
                o.*,
                u.nombre as usuario_nombre,
                u.email
            FROM ordenes o
            LEFT JOIN usuarios u ON o.usuario_id = u.id
            ORDER BY o.created_at DESC
        `);
        
        // ✅ PARSEAR LOS ITEMS (TUS DATOS YA SON VÁLIDOS)
        const ordenesConItems = ordenes.map(orden => {
            let items = [];
            
            try {
                // Tus datos ya son JSON válidos
                items = JSON.parse(orden.orden_items || '[]');
                console.log(`📦 Orden #${orden.id}: ${items.length} items encontrados`);
                
                // Mostrar primer item como ejemplo
                if (items.length > 0) {
                    console.log(`   → ${items[0].title} - Cantidad: ${items[0].quantity || 1}`);
                }
            } catch (e) {
                console.error(`❌ Error parseando orden #${orden.id}:`, e.message);
                items = [];
            }
            
            return {
                ...orden,
                items: items,
                total_items: items.length
            };
        });
        
        console.log(`✅ Total: ${ordenesConItems.length} órdenes procesadas`);
        connection.release();
        
        res.json({
            ok: true,
            ordenes: ordenesConItems
        });
        
    } catch (error) {
        console.error("❌ Error obteniendo órdenes:", error);
        res.status(500).json({ error: error.message });
    }
});

// ✅ POST - Crear nueva orden
router.post("/", async (req, res) => {
    const { usuario_id, items, subtotal, shipping, tax, total, direccion_envio, metodo_pago } = req.body;

    console.log("📥 POST /ordenes - Creando nueva orden");

    if (!usuario_id) return res.status(400).json({ error: "ID de usuario requerido" });
    if (!items || items.length === 0) return res.status(400).json({ error: "El carrito está vacío" });

    const connection = await db.promise().getConnection();
    
    try {
        await connection.beginTransaction();

        const trackingNumber = `TRK-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
        const estimatedDelivery = new Date();
        estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

        // Guardar como JSON string
        const itemsJSON = JSON.stringify(items);

        const [resOrden] = await connection.query(
            `INSERT INTO ordenes 
             (usuario_id, total, estado, orden_items, shipping_cost, tax_amount, subtotal, tracking_number, estimated_delivery, direccion_envio, metodo_pago, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                usuario_id,
                total,
                'pagado',
                itemsJSON,
                shipping || 0,
                tax || 0,
                subtotal || 0,
                trackingNumber,
                estimatedDelivery,
                direccion_envio || '',
                metodo_pago || 'paypal'
            ]
        );

        await connection.commit();
        connection.release();

        console.log("✅ Orden creada. ID:", resOrden.insertId);

        res.json({
            ok: true,
            orden_id: resOrden.insertId,
            tracking_number: trackingNumber
        });

    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error("❌ Error:", error);
        res.status(400).json({ error: error.message });
    }
});

// ✅ PUT - Actualizar estado
router.put("/:id/estado", async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    const admin = req.query.admin;

    if (!admin) return res.status(403).json({ error: "Acceso denegado" });
    if (!estado) return res.status(400).json({ error: "Estado requerido" });

    try {
        const connection = await db.promise().getConnection();
        
        await connection.query(
            "UPDATE ordenes SET estado = ? WHERE id = ?",
            [estado, id]
        );
        
        connection.release();
        
        res.json({ ok: true, message: "Estado actualizado" });
        
    } catch (error) {
        console.error("❌ Error:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;