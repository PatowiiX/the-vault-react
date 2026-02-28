const express = require("express");
const router = express.Router();
const db = require("../db");


// ===========================
// ENVIAR MENSAJE
// ===========================
router.post("/", (req, res) => {
    const { nombre, email, mensaje } = req.body;

    // Validación mínima
    if (!nombre || !email || !mensaje) {
        return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    db.query(
        "INSERT INTO contacto (nombre,email,mensaje) VALUES (?,?,?)",
        [nombre, email, mensaje],
        (err, result) => {
            if (err) {
                console.error("Error DB:", err);
                return res.status(500).json({ error: "Error guardando mensaje" });
            }

            res.json({
                ok: true,
                id: result.insertId
            });
        }
    );
});


// ===========================
// ADMIN - VER MENSAJES
// ===========================
router.get("/", (req, res) => {

    const admin = req.query.admin; 

    if (!admin)
        return res.status(403).json({ error: "Solo admin" });

    db.query(
        "SELECT * FROM contacto ORDER BY fecha DESC",
        (err, results) => {
            if (err)
                return res.status(500).json({ error: "Error DB" });

            res.json({ mensajes: results });
        }
    );
});

module.exports = router;
