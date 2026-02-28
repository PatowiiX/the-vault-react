const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", (req, res) => {
    db.query("SELECT * FROM discos", (err, results) => {
        if (err) return res.status(500).json({ error: "Error DB" });
        res.json({ discos: results });
    });
});

router.get("/formato/:formato", (req, res) => {
    db.query(
        "SELECT * FROM discos WHERE formato=?",
        [req.params.formato],
        (err, results) => {
            if (err) return res.status(500).json({ error: "Error DB" });
            res.json({ discos: results });
        }
    );
});

router.get("/top", (req, res) => {
    db.query(
        "SELECT * FROM discos WHERE top=1 LIMIT 5",
        (err, results) => {
            if (err) return res.status(500).json({ error: "Error DB" });
            res.json({ discos: results });
        }
    );
});

router.get("/:id", (req, res) => {
    db.query(
        "SELECT * FROM discos WHERE id = ?",
        [req.params.id],
        (err, results) => {
            if (err) return res.status(500).json({ error: "Error DB" });
            if (results.length === 0) return res.status(404).json({ error: "Disco no encontrado" });
            res.json({ disco: results[0] });
        }
    );
});

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
        heritage 
    } = req.body;

    const admin = req.body.admin || req.query.admin;
    if (!admin) {
        return res.status(403).json({ error: "Solo admin puede crear discos" });
    }

    if (!titulo || !artista || !formato) {
        return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    db.query(
        `INSERT INTO discos 
        (titulo, artista, genero, formato, imagen_path, anio, descripcion, top, precio, stock, heritage) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            titulo,
            artista,
            genero || "",
            formato,
            imagen_path || "",
            anio || null,
            descripcion || "",
            top || 0,
            precio || 25.00,
            stock || 10,
            heritage || 0
        ],
        (err, result) => {
            if (err) {
                console.error("Error DB:", err);
                return res.status(500).json({ error: "Error al crear disco" });
            }

            res.json({
                ok: true,
                id: result.insertId
            });
        }
    );
});

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
        heritage 
    } = req.body;

    const admin = req.body.admin || req.query.admin;
    if (!admin) {
        return res.status(403).json({ error: "Solo admin puede editar" });
    }

    db.query(
        `UPDATE discos SET 
        titulo=?, artista=?, genero=?, formato=?, imagen_path=?, 
        anio=?, descripcion=?, top=?, precio=?, stock=?, heritage=? 
        WHERE id=?`,
        [
            titulo, artista, genero, formato, imagen_path, 
            anio, descripcion, top, precio, stock, heritage, 
            req.params.id
        ],
        (err) => {
            if (err) {
                console.error("Error DB:", err);
                return res.status(500).json({ error: "Error al actualizar" });
            }
            res.json({ ok: true });
        }
    );
});

router.delete("/:id", (req, res) => {
    const admin = req.body.admin || req.query.admin;
    if (!admin) {
        return res.status(403).json({ error: "Solo admin puede borrar" });
    }

    db.query(
        "DELETE FROM discos WHERE id=?",
        [req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: "Error DB" });
            res.json({ ok: true });
        }
    );
});

module.exports = router;