const express = require("express");
const router = express.Router();
const db = require("../db");

// ✅ GET - Obtener todos los discos (con verificación de stock)
router.get("/", (req, res) => {
    db.query("SELECT * FROM discos ORDER BY id DESC", (err, results) => {
        if (err) {
            console.error("Error DB:", err);
            return res.status(500).json({ error: "Error DB" });
        }
        
        // Asegurar que stock sea un número y no null
        const discos = results.map(disco => ({
            ...disco,
            stock: disco.stock !== null ? disco.stock : 0
        }));
        
        res.json({ discos: discos });
    });
});

// ✅ GET - Obtener discos por formato (CORREGIDO)
router.get("/formato/:formato", (req, res) => {
    db.query(
        "SELECT * FROM discos WHERE formato = ? ORDER BY id DESC",
        [req.params.formato],
        (err, results) => {
            if (err) {
                console.error("Error DB:", err);
                return res.status(500).json({ error: "Error DB" });
            }
            
            const discos = results.map(disco => ({
                ...disco,
                stock: disco.stock !== null ? disco.stock : 0
            }));
            
            res.json({ discos: discos });
        }
    );
});

// ✅ GET - Obtener top 5 discos destacados
router.get("/top", (req, res) => {
    db.query(
        "SELECT * FROM discos WHERE top = 1 LIMIT 5",
        (err, results) => {
            if (err) {
                console.error("Error DB:", err);
                return res.status(500).json({ error: "Error DB" });
            }
            
            const discos = results.map(disco => ({
                ...disco,
                stock: disco.stock !== null ? disco.stock : 0
            }));
            
            res.json({ discos: discos });
        }
    );
});

// ✅ GET - Obtener discos de HERITAGE (NUEVO)
router.get("/heritage", (req, res) => {
    db.query(
        "SELECT * FROM discos WHERE heritage = 1 ORDER BY id DESC",
        (err, results) => {
            if (err) {
                console.error("Error DB:", err);
                return res.status(500).json({ error: "Error DB" });
            }
            
            const discos = results.map(disco => ({
                ...disco,
                stock: disco.stock !== null ? disco.stock : 0
            }));
            
            res.json({ discos: discos });
        }
    );
});

// ✅ GET - Obtener discos con stock bajo (NUEVO - para admin)
router.get("/low-stock", (req, res) => {
    const admin = req.query.admin;
    if (!admin) {
        return res.status(403).json({ error: "Acceso denegado" });
    }
    
    db.query(
        "SELECT * FROM discos WHERE stock <= 5 ORDER BY stock ASC",
        (err, results) => {
            if (err) {
                console.error("Error DB:", err);
                return res.status(500).json({ error: "Error DB" });
            }
            
            res.json({ discos: results });
        }
    );
});

// ✅ GET - Obtener un disco por ID (CON VERIFICACIÓN DE STOCK)
router.get("/:id", (req, res) => {
    db.query(
        "SELECT * FROM discos WHERE id = ?",
        [req.params.id],
        (err, results) => {
            if (err) {
                console.error("Error DB:", err);
                return res.status(500).json({ error: "Error DB" });
            }
            
            if (results.length === 0) {
                return res.status(404).json({ error: "Disco no encontrado" });
            }
            
            const disco = results[0];
            // Asegurar stock como número
            disco.stock = disco.stock !== null ? disco.stock : 0;
            
            res.json({ disco: disco });
        }
    );
});

// ✅ POST - Crear nuevo disco (solo admin)
router.post("/", (req, res) => {
    const { 
        titulo, 
        artista, 
        genero, 
        formato, 
        imagen_path, 
        anio, 
        descripcion, 
        top,
        precio,
        stock,
        heritage,
        tracks,
        duration,
        sku,
        edition
    } = req.body;

    const admin = req.body.admin || req.query.admin;
    if (!admin) {
        return res.status(403).json({ error: "Solo admin puede crear discos" });
    }

    if (!titulo || !artista || !formato) {
        return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    // Validar stock (no negativo)
    const stockFinal = Math.max(0, stock || 10);
    
    // Validar precio
    const precioFinal = precio && precio > 0 ? precio : 25.00;

    db.query(
        `INSERT INTO discos 
        (titulo, artista, genero, formato, imagen_path, anio, descripcion, top, precio, stock, heritage, tracks, duration, sku, edition) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            titulo,
            artista,
            genero || "",
            formato,
            imagen_path || "",
            anio || null,
            descripcion || "",
            top || 0,
            precioFinal,
            stockFinal,
            heritage || 0,
            tracks || 10,
            duration || "45:00",
            sku || `VAULT-${Date.now()}`,
            edition || null
        ],
        (err, result) => {
            if (err) {
                console.error("Error DB:", err);
                return res.status(500).json({ error: "Error al crear disco" });
            }

            res.json({
                ok: true,
                id: result.insertId,
                message: "Disco creado exitosamente"
            });
        }
    );
});

// ✅ PUT - Actualizar disco (solo admin) - CON VALIDACIÓN DE STOCK
router.put("/:id", (req, res) => {
    const { 
        titulo, 
        artista, 
        genero, 
        formato, 
        imagen_path, 
        anio, 
        descripcion, 
        top,
        precio,
        stock,
        heritage,
        tracks,
        duration,
        sku,
        edition
    } = req.body;

    const admin = req.body.admin || req.query.admin;
    if (!admin) {
        return res.status(403).json({ error: "Solo admin puede editar" });
    }

    // Validar stock (no negativo)
    const stockFinal = stock !== undefined ? Math.max(0, stock) : null;
    const precioFinal = precio && precio > 0 ? precio : null;

    // Construir query dinámica
    let query = `UPDATE discos SET 
        titulo = COALESCE(?, titulo),
        artista = COALESCE(?, artista),
        genero = COALESCE(?, genero),
        formato = COALESCE(?, formato),
        imagen_path = COALESCE(?, imagen_path),
        anio = COALESCE(?, anio),
        descripcion = COALESCE(?, descripcion),
        top = COALESCE(?, top)`;
    
    const values = [titulo, artista, genero, formato, imagen_path, anio, descripcion, top];
    
    if (precioFinal !== null) {
        query += `, precio = ?`;
        values.push(precioFinal);
    }
    
    if (stockFinal !== null) {
        query += `, stock = ?`;
        values.push(stockFinal);
    }
    
    if (heritage !== undefined) {
        query += `, heritage = ?`;
        values.push(heritage);
    }
    
    if (tracks !== undefined) {
        query += `, tracks = ?`;
        values.push(tracks);
    }
    
    if (duration !== undefined) {
        query += `, duration = ?`;
        values.push(duration);
    }
    
    if (sku !== undefined) {
        query += `, sku = ?`;
        values.push(sku);
    }
    
    if (edition !== undefined) {
        query += `, edition = ?`;
        values.push(edition);
    }
    
    query += ` WHERE id = ?`;
    values.push(req.params.id);
    
    db.query(query, values, (err, result) => {
        if (err) {
            console.error("Error DB:", err);
            return res.status(500).json({ error: "Error al actualizar" });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Disco no encontrado" });
        }
        
        res.json({ 
            ok: true, 
            message: "Disco actualizado exitosamente" 
        });
    });
});

// ✅ DELETE - Eliminar disco (solo admin)
router.delete("/:id", (req, res) => {
    const admin = req.body.admin || req.query.admin;
    if (!admin) {
        return res.status(403).json({ error: "Solo admin puede borrar" });
    }

    db.query(
        "DELETE FROM discos WHERE id = ?",
        [req.params.id],
        (err, result) => {
            if (err) {
                console.error("Error DB:", err);
                return res.status(500).json({ error: "Error DB" });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Disco no encontrado" });
            }
            
            res.json({ 
                ok: true, 
                message: "Disco eliminado exitosamente" 
            });
        }
    );
});

// ✅ PATCH - Actualizar stock específicamente (NUEVO - para compras)
router.patch("/:id/stock", (req, res) => {
    const { cantidad } = req.body;
    const admin = req.body.admin || req.query.admin;
    
    if (!admin && !req.body.sistema) {
        return res.status(403).json({ error: "Acceso denegado" });
    }
    
    if (!cantidad || typeof cantidad !== 'number') {
        return res.status(400).json({ error: "Cantidad requerida" });
    }
    
    db.query(
        "UPDATE discos SET stock = stock + ? WHERE id = ? AND stock + ? >= 0",
        [cantidad, req.params.id, cantidad],
        (err, result) => {
            if (err) {
                console.error("Error DB:", err);
                return res.status(500).json({ error: "Error DB" });
            }
            
            if (result.affectedRows === 0) {
                return res.status(400).json({ error: "Stock insuficiente o disco no encontrado" });
            }
            
            res.json({ 
                ok: true, 
                message: "Stock actualizado correctamente" 
            });
        }
    );
});

// ✅ GET - Verificar disponibilidad de stock (NUEVO - para frontend)
router.get("/:id/check-stock", (req, res) => {
    db.query(
        "SELECT id, titulo, stock FROM discos WHERE id = ?",
        [req.params.id],
        (err, results) => {
            if (err) {
                console.error("Error DB:", err);
                return res.status(500).json({ error: "Error DB" });
            }
            
            if (results.length === 0) {
                return res.status(404).json({ error: "Disco no encontrado" });
            }
            
            const disponible = results[0].stock > 0;
            res.json({ 
                id: results[0].id,
                titulo: results[0].titulo,
                stock: results[0].stock,
                disponible: disponible
            });
        }
    );
});

module.exports = router;