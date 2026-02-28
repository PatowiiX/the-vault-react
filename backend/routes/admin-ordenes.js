const express = require("express");
const router = express.Router();
const db = require("../db");

// ===========================
// OBTENER TODAS LAS ÓRDENES (ADMIN)
// ===========================
router.get("/ordenes", (req, res) => {
    const admin = req.query.admin;
    
    if (!admin) {
        return res.status(403).json({ error: "Acceso no autorizado" });
    }

    db.query(
        `SELECT o.*, u.nombre as usuario_nombre, u.email 
         FROM ordenes o
         LEFT JOIN usuarios u ON o.usuario_id = u.id
         ORDER BY o.fecha DESC`,
        (err, ordenes) => {
            if (err) {
                console.error("Error obteniendo órdenes:", err);
                return res.status(500).json({ error: "Error DB" });
            }

            // Parsear items si existen
            const ordenesConItems = ordenes.map(orden => {
                if (orden.orden_items) {
                    try {
                        orden.items = JSON.parse(orden.orden_items);
                    } catch (e) {
                        orden.items = [];
                    }
                }
                return orden;
            });

            res.json({ ok: true, ordenes: ordenesConItems });
        }
    );
});

// ===========================
// OBTENER DETALLE DE UNA ORDEN (ADMIN)
// ===========================
router.get("/ordenes/:id", (req, res) => {
    const admin = req.query.admin;
    
    if (!admin) {
        return res.status(403).json({ error: "Acceso no autorizado" });
    }

    db.query(
        `SELECT o.*, u.nombre, u.email 
         FROM ordenes o
         LEFT JOIN usuarios u ON o.usuario_id = u.id
         WHERE o.id = ?`,
        [req.params.id],
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

// ===========================
// ACTUALIZAR ESTADO DE ORDEN (ADMIN)
// ===========================
router.put("/ordenes/:id/estado", (req, res) => {
    const admin = req.query.admin;
    const { estado } = req.body;
    
    if (!admin) {
        return res.status(403).json({ error: "Acceso no autorizado" });
    }

    const estadosValidos = ['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado'];
    if (!estadosValidos.includes(estado)) {
        return res.status(400).json({ error: "Estado no válido" });
    }

    db.query(
        "UPDATE ordenes SET estado = ? WHERE id = ?",
        [estado, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: "Error DB" });
            res.json({ ok: true });
        }
    );
});

// ===========================
 //VER HISTORIAL DE STOCK (ADMIN)
// ===========================
router.get("/stock-history", (req, res) => {
    const admin = req.query.admin;
    
    if (!admin) {
        return res.status(403).json({ error: "Acceso no autorizado" });
    }

    db.query(
        `SELECT sh.*, d.titulo, d.artista 
         FROM stock_history sh
         JOIN discos d ON sh.disco_id = d.id
         ORDER BY sh.created_at DESC
         LIMIT 100`,
        (err, history) => {
            if (err) return res.status(500).json({ error: "Error DB" });
            res.json({ ok: true, history });
        }
    );
});

module.exports = router;