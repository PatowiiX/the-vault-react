const express = require("express");
const router = express.Router();
const db = require("../db"); 
const crypto = require("crypto");

// ✅ GET - Obtener todas las órdenes (solo admin) - CON ITEMS PARSEADOS
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
        
        // ✅ PARSEAR los items de cada orden (de string JSON a array)
        const ordenesConItems = ordenes.map(orden => {
            let items = [];
            try {
                // Intentar parsear orden_items
                items = JSON.parse(orden.orden_items || '[]');
                console.log(`📦 Orden #${orden.id}: ${items.length} items encontrados`);
                
                // Mostrar el primer item como ejemplo (para debug)
                if (items.length > 0) {
                    console.log(`   Primer item: ${items[0].title || items[0].titulo} - Cantidad: ${items[0].quantity || items[0].cantidad}`);
                }
            } catch (e) {
                console.error(`❌ Error parseando items de orden #${orden.id}:`, e.message);
                // Si hay error, intentar con formato alternativo
                try {
                    // A veces viene como string con comillas escapadas
                    const fixed = orden.orden_items.replace(/\\/g, '');
                    items = JSON.parse(fixed);
                    console.log(`✅ Orden #${orden.id}: Items recuperados con formato alternativo`);
                } catch (e2) {
                    console.error(`❌ No se pudieron recuperar los items de la orden #${orden.id}`);
                    items = [];
                }
            }
            
            return {
                ...orden,
                items: items,  // ✅ AHORA ES UN ARRAY, NO UN STRING
                total_items: items.length
            };
        });
        
        console.log(`✅ Total: ${ordenesConItems.length} órdenes encontradas`);
        connection.release();
        
        res.json({
            ok: true,
            ordenes: ordenesConItems  // ✅ Enviamos las órdenes con items parseados
        });
        
    } catch (error) {
        console.error("❌ Error obteniendo órdenes:", error);
        res.status(500).json({ error: error.message });
    }
});

// ✅ POST - Crear nueva orden
router.post("/", async (req, res) => {
    const { usuario_id, items, subtotal, shipping, tax, total, direccion_envio, metodo_pago } = req.body;

    console.log("📥 POST /ordenes - Creando nueva orden para usuario:", usuario_id);
    console.log("   Items:", items?.length || 0);
    console.log("   Total:", total);

    if (!usuario_id) return res.status(400).json({ error: "ID de usuario requerido" });
    if (!items || items.length === 0) return res.status(400).json({ error: "El carrito está vacío" });

    const connection = await db.promise().getConnection();
    
    try {
        await connection.beginTransaction();

        // Crear orden
        const trackingNumber = `TRK-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
        const estimatedDelivery = new Date();
        estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

        // ✅ Guardar items como JSON string
        const itemsJSON = JSON.stringify(items);
        console.log("   Items guardados en BD (JSON):", itemsJSON.substring(0, 100) + "...");

        const [resOrden] = await connection.query(
            `INSERT INTO ordenes 
             (usuario_id, total, estado, orden_items, shipping_cost, tax_amount, subtotal, tracking_number, estimated_delivery, direccion_envio, metodo_pago, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                usuario_id,
                total,
                'pagado',
                itemsJSON,  // ✅ Guardamos el string JSON
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

        console.log("✅ Orden creada exitosamente. ID:", resOrden.insertId);

        res.json({
            ok: true,
            orden_id: resOrden.insertId,
            tracking_number: trackingNumber
        });

    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error("❌ Error creando orden:", error);
        res.status(400).json({ error: error.message });
    }
});

// ✅ GET - Obtener una orden específica por ID
router.get("/:id", async (req, res) => {
    const { id } = req.params;
    
    try {
        const connection = await db.promise().getConnection();
        
        const [ordenes] = await connection.query(
            `SELECT 
                o.*,
                u.nombre as usuario_nombre,
                u.email
            FROM ordenes o
            LEFT JOIN usuarios u ON o.usuario_id = u.id
            WHERE o.id = ?`,
            [id]
        );
        
        if (ordenes.length === 0) {
            connection.release();
            return res.status(404).json({ error: "Orden no encontrada" });
        }
        
        const orden = ordenes[0];
        
        // Parsear items
        try {
            orden.items = JSON.parse(orden.orden_items || '[]');
        } catch (e) {
            console.error(`❌ Error parseando items de orden #${id}:`, e);
            orden.items = [];
        }
        
        connection.release();
        
        res.json({
            ok: true,
            orden: orden
        });
        
    } catch (error) {
        console.error("❌ Error obteniendo orden:", error);
        res.status(500).json({ error: error.message });
    }
});

// ✅ PUT - Actualizar estado de una orden
router.put("/:id/estado", async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    const admin = req.query.admin;

    console.log("📥 PUT /ordenes/:id/estado - ID:", id, "Nuevo estado:", estado);

    if (!admin) {
        return res.status(403).json({ error: "Acceso denegado" });
    }

    if (!estado) {
        return res.status(400).json({ error: "Estado requerido" });
    }

    try {
        const connection = await db.promise().getConnection();
        
        const [result] = await connection.query(
            "UPDATE ordenes SET estado = ? WHERE id = ?",
            [estado, id]
        );
        
        connection.release();
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Orden no encontrada" });
        }
        
        console.log("✅ Estado actualizado correctamente");
        
        res.json({
            ok: true,
            message: "Estado actualizado"
        });
        
    } catch (error) {
        console.error("❌ Error actualizando orden:", error);
        res.status(500).json({ error: error.message });
    }
});

// ✅ DELETE - Eliminar una orden (solo admin, con precaución)
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    const admin = req.query.admin;

    if (!admin) {
        return res.status(403).json({ error: "Acceso denegado" });
    }

    try {
        const connection = await db.promise().getConnection();
        
        const [result] = await connection.query(
            "DELETE FROM ordenes WHERE id = ?",
            [id]
        );
        
        connection.release();
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Orden no encontrada" });
        }
        
        res.json({
            ok: true,
            message: "Orden eliminada"
        });
        
    } catch (error) {
        console.error("❌ Error eliminando orden:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;