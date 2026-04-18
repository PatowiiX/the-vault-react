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
        
        const ordenesConItems = ordenes.map(orden => {
            let items = [];
            
            try {
                items = JSON.parse(orden.orden_items || '[]');
                console.log(`📦 Orden #${orden.id}: ${items.length} items encontrados`);
                
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

// ✅ GET - Obtener pedidos de un USUARIO específico (NUEVO - Para el panel de usuario)
router.get("/usuario/:usuarioId", async (req, res) => {
    const { usuarioId } = req.params;
    
    console.log(`📥 GET /ordenes/usuario/${usuarioId}`);
    
    if (!usuarioId) {
        return res.status(400).json({ error: "ID de usuario requerido" });
    }
    
    try {
        const connection = await db.promise().getConnection();
        
        const [ordenes] = await connection.query(
            `SELECT 
                o.*,
                u.nombre as usuario_nombre,
                u.email
            FROM ordenes o
            LEFT JOIN usuarios u ON o.usuario_id = u.id
            WHERE o.usuario_id = ?
            ORDER BY o.created_at DESC`,
            [usuarioId]
        );
        
        const ordenesConItems = ordenes.map(orden => {
            let items = [];
            try {
                items = typeof orden.orden_items === 'string' 
                    ? JSON.parse(orden.orden_items) 
                    : (orden.orden_items || []);
            } catch (e) {
                items = [];
            }
            
            return {
                ...orden,
                items: items,
                total_items: items.length
            };
        });
        
        connection.release();
        
        console.log(`✅ ${ordenesConItems.length} órdenes encontradas para usuario ${usuarioId}`);
        
        res.json({
            ok: true,
            ordenes: ordenesConItems
        });
        
    } catch (error) {
        console.error("❌ Error obteniendo órdenes del usuario:", error);
        res.status(500).json({ error: error.message });
    }
});

// ✅ GET - Obtener una orden específica por ID
router.get("/:id", async (req, res) => {
    const { id } = req.params;
    
    console.log(`📥 GET /ordenes/${id}`);
    
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
        let items = [];
        
        try {
            items = JSON.parse(orden.orden_items || '[]');
        } catch (e) {
            items = [];
        }
        
        connection.release();
        
        res.json({
            ok: true,
            orden: {
                ...orden,
                items: items
            }
        });
        
    } catch (error) {
        console.error("❌ Error obteniendo orden:", error);
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

        for (const item of items) {
            const [rows] = await connection.query(
                "SELECT stock, titulo FROM discos WHERE id = ? FOR UPDATE",
                [item.id]
            );

            if (rows.length === 0) {
                throw new Error(`Producto "${item.title}" no encontrado`);
            }

            if (rows[0].stock < item.quantity) {
                throw new Error(`Stock insuficiente para "${item.title}". Disponible: ${rows[0].stock}`);
            }
        }

        const trackingNumber = `TRK-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
        const estimatedDelivery = new Date();
        estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

        const itemsJSON = JSON.stringify(items);

        const [resOrden] = await connection.query(
            `INSERT INTO ordenes 
             (usuario_id, total, estado, orden_items, shipping_cost, tax_amount, subtotal, 
              tracking_number, estimated_delivery, direccion_envio, metodo_pago, created_at) 
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

        for (const item of items) {
            const [rows] = await connection.query(
                "SELECT stock FROM discos WHERE id = ? FOR UPDATE",
                [item.id]
            );
            const stockNuevo = rows[0].stock - item.quantity;

            await connection.query(
                "UPDATE discos SET stock = ? WHERE id = ?",
                [stockNuevo, item.id]
            );
        }

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

// ✅ PUT - Actualizar estado de una orden (solo admin)
router.put("/:id/estado", async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    const admin = req.query.admin;

    console.log(`📥 PUT /ordenes/${id}/estado - estado: ${estado}, admin: ${admin}`);

    if (!admin) return res.status(403).json({ error: "Acceso denegado" });
    if (!estado) return res.status(400).json({ error: "Estado requerido" });

    const estadosValidos = ['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado'];
    if (!estadosValidos.includes(estado)) {
        return res.status(400).json({ error: "Estado no válido" });
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
        
        console.log(`✅ Orden ${id} actualizada a estado: ${estado}`);
        
        res.json({ 
            ok: true, 
            message: "Estado actualizado correctamente",
            estado: estado
        });
        
    } catch (error) {
        console.error("❌ Error actualizando estado:", error);
        res.status(500).json({ error: error.message });
    }
});

// ✅ DELETE - Cancelar una orden (solo admin o el propio usuario)
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    const { usuario_id, admin } = req.body;
    
    console.log(`📥 DELETE /ordenes/${id} - usuario: ${usuario_id}, admin: ${admin}`);
    
    try {
        const connection = await db.promise().getConnection();
        
        // Verificar si la orden existe
        const [ordenes] = await connection.query(
            "SELECT * FROM ordenes WHERE id = ?",
            [id]
        );
        
        if (ordenes.length === 0) {
            connection.release();
            return res.status(404).json({ error: "Orden no encontrada" });
        }
        
        const orden = ordenes[0];
        
        // Verificar permisos (admin o dueño de la orden)
        if (!admin && orden.usuario_id !== usuario_id) {
            connection.release();
            return res.status(403).json({ error: "No tienes permiso para cancelar esta orden" });
        }
        
        // Verificar que la orden esté pendiente o pagada (no enviada)
        if (orden.estado !== 'pendiente' && orden.estado !== 'pagado') {
            connection.release();
            return res.status(400).json({ error: `No se puede cancelar una orden en estado "${orden.estado}"` });
        }
        
        // Cancelar orden (cambiar estado a cancelado)
        await connection.query(
            "UPDATE ordenes SET estado = 'cancelado' WHERE id = ?",
            [id]
        );
        
        connection.release();
        
        console.log(`✅ Orden ${id} cancelada`);
        
        res.json({
            ok: true,
            message: "Orden cancelada exitosamente"
        });
        
    } catch (error) {
        console.error("❌ Error cancelando orden:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
