const express = require("express");
const router = express.Router();
const db = require("../db");

const getOrCreateCart = (usuario_id, session_id, callback) => {
    let query = "SELECT * FROM carritos WHERE ";
    let params = [];

    if (usuario_id) {
        query += "usuario_id = ?";
        params.push(usuario_id);
    } else {
        query += "session_id = ?";
        params.push(session_id);
    }

    db.query(query, params, (err, results) => {
        if (err) return callback(err);
        
        if (results.length > 0) {
            return callback(null, results[0]);
        }

        db.query(
            "INSERT INTO carritos (usuario_id, session_id) VALUES (?, ?)",
            [usuario_id || null, session_id || null],
            (err, result) => {
                if (err) return callback(err);
                callback(null, { id: result.insertId, usuario_id, session_id });
            }
        );
    });
};


router.get("/", (req, res) => {
    const usuario_id = req.query.usuario_id;
    const session_id = req.query.session_id;

    if (!usuario_id && !session_id) {
        return res.status(400).json({ error: "Se requiere usuario_id o session_id" });
    }

    getOrCreateCart(usuario_id, session_id, (err, carrito) => {
        if (err) {
            console.error("Error con carrito:", err);
            return res.status(500).json({ error: "Error al obtener carrito" });
        }

        // Obtener items del carrito
        db.query(
            `SELECT ci.*, d.titulo, d.artista, d.formato, d.imagen_path 
             FROM carrito_items ci 
             JOIN discos d ON ci.disco_id = d.id 
             WHERE ci.carrito_id = ?`,
            [carrito.id],
            (err, items) => {
                if (err) {
                    console.error("Error al obtener items:", err);
                    return res.status(500).json({ error: "Error al obtener items" });
                }

                // Calcular total
                const total = items.reduce((sum, item) => 
                    sum + (item.precio_unitario * item.cantidad), 0
                );

                res.json({
                    ok: true,
                    carrito: {
                        id: carrito.id,
                        items: items,
                        total: total
                    }
                });
            }
        );
    });
});

// ===========================
// AGREGAR ITEM AL CARRITO
// ===========================
router.post("/items", (req, res) => {
    const { disco_id, cantidad, usuario_id, session_id } = req.body;

    if (!disco_id || !cantidad || cantidad < 1) {
        return res.status(400).json({ error: "Datos inválidos" });
    }

    if (!usuario_id && !session_id) {
        return res.status(400).json({ error: "Se requiere identificación de usuario" });
    }

    // Verificar que el disco existe y obtener precio
    db.query("SELECT * FROM discos WHERE id = ?", [disco_id], (err, discos) => {
        if (err) return res.status(500).json({ error: "Error DB" });
        if (discos.length === 0) {
            return res.status(404).json({ error: "Disco no encontrado" });
        }

        const disco = discos[0];
        
        // Verificar stock
        if (disco.stock < cantidad) {
            return res.status(400).json({ error: "Stock insuficiente" });
        }

        getOrCreateCart(usuario_id, session_id, (err, carrito) => {
            if (err) return res.status(500).json({ error: "Error con carrito" });

            // Verificar si el item ya existe en el carrito
            db.query(
                "SELECT * FROM carrito_items WHERE carrito_id = ? AND disco_id = ?",
                [carrito.id, disco_id],
                (err, items) => {
                    if (err) return res.status(500).json({ error: "Error DB" });

                    if (items.length > 0) {
                        // Actualizar cantidad
                        const nuevaCantidad = items[0].cantidad + cantidad;
                        db.query(
                            "UPDATE carrito_items SET cantidad = ? WHERE id = ?",
                            [nuevaCantidad, items[0].id],
                            (err) => {
                                if (err) return res.status(500).json({ error: "Error al actualizar" });
                                res.json({ ok: true, message: "Cantidad actualizada" });
                            }
                        );
                    } else {
                        // Insertar nuevo item
                        db.query(
                            "INSERT INTO carrito_items (carrito_id, disco_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)",
                            [carrito.id, disco_id, cantidad, disco.precio],
                            (err) => {
                                if (err) return res.status(500).json({ error: "Error al agregar" });
                                res.json({ ok: true, message: "Item agregado al carrito" });
                            }
                        );
                    }
                }
            );
        });
    });
});

// ===========================
// ACTUALIZAR CANTIDAD
// ===========================
router.put("/items/:itemId", (req, res) => {
    const { cantidad } = req.body;
    const itemId = req.params.itemId;

    if (!cantidad || cantidad < 1) {
        return res.status(400).json({ error: "Cantidad inválida" });
    }

    db.query(
        "UPDATE carrito_items SET cantidad = ? WHERE id = ?",
        [cantidad, itemId],
        (err) => {
            if (err) return res.status(500).json({ error: "Error al actualizar" });
            res.json({ ok: true });
        }
    );
});

// ===========================
// ELIMINAR ITEM DEL CARRITO
// ===========================
router.delete("/items/:itemId", (req, res) => {
    db.query(
        "DELETE FROM carrito_items WHERE id = ?",
        [req.params.itemId],
        (err) => {
            if (err) return res.status(500).json({ error: "Error al eliminar" });
            res.json({ ok: true });
        }
    );
});

// ===========================
// VACIAR CARRITO
// ===========================
router.delete("/:cartId", (req, res) => {
    db.query(
        "DELETE FROM carrito_items WHERE carrito_id = ?",
        [req.params.cartId],
        (err) => {
            if (err) return res.status(500).json({ error: "Error al vaciar carrito" });
            res.json({ ok: true });
        }
    );
});

module.exports = router;