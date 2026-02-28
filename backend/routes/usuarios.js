const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/register", (req, res) => {
    const { username, email, password, nombre } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    db.query(
        "SELECT * FROM usuarios WHERE email = ? OR nombre = ?",
        [email, username],
        (err, results) => {
            if (err) {
                console.error("Error DB:", err);
                return res.status(500).json({ error: "Error en base de datos" });
            }
            
            if (results.length > 0) {
                return res.status(400).json({ error: "Usuario o email ya existe" });
            }

            db.query(
                "INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, 'user')",
                [nombre || username, email, password],
                (err, result) => {
                    if (err) {
                        console.error("Error insert:", err);
                        return res.status(500).json({ error: "Error al registrar" });
                    }

                    res.json({
                        ok: true,
                        id: result.insertId,
                        message: "Usuario registrado exitosamente"
                    });
                }
            );
        }
    );
});

router.post("/login", (req, res) => {
    const { username_or_email, password } = req.body;

    if (!username_or_email || !password) {
        return res.status(400).json({ error: "Faltan credenciales" });
    }

    db.query(
        "SELECT * FROM usuarios WHERE nombre = ? OR email = ?",
        [username_or_email, username_or_email],
        (err, results) => {
            if (err) {
                console.error("Error DB:", err);
                return res.status(500).json({ error: "Error en base de datos" });
            }

            if (results.length === 0) {
                return res.status(401).json({ error: "Usuario no encontrado" });
            }

            const user = results[0];

            if (user.password_hash !== password) {
                return res.status(401).json({ error: "Contraseña incorrecta" });
            }

            res.json({
                ok: true,
                user: {
                    id: user.id,
                    username: user.nombre,
                    email: user.email,
                    isAdmin: user.rol === 'admin'
                }
            });
        }
    );
});

router.get("/", (req, res) => {
    const admin = req.query.admin;
    if (!admin) return res.status(403).json({ error: "Solo admin" });

    db.query(
        "SELECT id, nombre, email, rol FROM usuarios",
        (err, results) => {
            if (err) return res.status(500).json({ error: "Error DB" });
            res.json({ usuarios: results });
        }
    );
});

module.exports = router;