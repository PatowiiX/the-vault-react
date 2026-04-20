const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const buildAvatarUrl = (req, avatarPath) => {
    if (!avatarPath) return null;
    if (/^https?:\/\//i.test(avatarPath)) return avatarPath;
    return `${req.protocol}://${req.get('host')}${avatarPath.startsWith('/') ? avatarPath : `/${avatarPath}`}`;
};

const SALT_ROUNDS = 10; // Nivel de encriptación (10-12 es recomendado)

// Configurar multer para subir fotos de perfil
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../public/uploads/avatars');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + req.params.id + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Solo imágenes (jpeg, jpg, png, gif)'));
        }
    }
});

// ========== ENDPOINTS EXISTENTES (ACTUALIZADOS CON BCRYPT) ==========

// ✅ REGISTRO - CONTRASEÑA ENCRIPTADA
router.post("/register", async (req, res) => {
    const { username, email, password, nombre } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
    }

    try {
        // Verificar si el usuario ya existe
        const [existing] = await db.promise().query(
            "SELECT * FROM usuarios WHERE email = ? OR nombre = ?",
            [email, username]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: "Usuario o email ya existe" });
        }

        // Encriptar la contraseña
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        console.log("✅ Contraseña encriptada correctamente");

        // Insertar usuario con contraseña encriptada
        const [result] = await db.promise().query(
            "INSERT INTO usuarios (nombre, email, password_hash, rol, avatar) VALUES (?, ?, ?, 'user', NULL)",
            [nombre || username, email, hashedPassword]
        );

        res.json({
            ok: true,
            id: result.insertId,
            message: "Usuario registrado exitosamente"
        });

    } catch (error) {
        console.error("Error en register:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// ✅ LOGIN - VERIFICAR CONTRASEÑA ENCRIPTADA
router.post("/login", async (req, res) => {
    const { username_or_email, password } = req.body;

    if (!username_or_email || !password) {
        return res.status(400).json({ error: "Faltan credenciales" });
    }

    try {
        // Buscar usuario por nombre o email
        const [users] = await db.promise().query(
            "SELECT * FROM usuarios WHERE nombre = ? OR email = ?",
            [username_or_email, username_or_email]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: "Usuario no encontrado" });
        }

        const user = users[0];

        // Comparar la contraseña ingresada con la encriptada
        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            return res.status(401).json({ error: "Contraseña incorrecta" });
        }

        // No devolver el hash de la contraseña
        res.json({
            ok: true,
            user: {
                id: user.id,
                username: user.nombre,
                email: user.email,
                nombre: user.nombre,
                avatar: buildAvatarUrl(req, user.avatar),
                isAdmin: user.rol === 'admin',
                created_at: user.created_at
            }
        });

    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// ✅ GET - Listar usuarios (solo admin)
router.get("/", (req, res) => {
    const admin = req.query.admin;
    if (!admin) return res.status(403).json({ error: "Solo admin" });

    db.query(
        "SELECT id, nombre, email, rol, avatar, created_at FROM usuarios",
        (err, results) => {
            if (err) return res.status(500).json({ error: "Error DB" });
            res.json({ usuarios: results });
        }
    );
});

// ========== ENDPOINTS PARA PANEL DE USUARIO ==========

// ✅ GET - Obtener perfil de usuario
router.get("/:id/perfil", (req, res) => {
    const { id } = req.params;
    
    db.query(
        "SELECT id, nombre, email, avatar, created_at, rol FROM usuarios WHERE id = ?",
        [id],
        (err, results) => {
            if (err) {
                console.error("Error DB:", err);
                return res.status(500).json({ error: "Error en base de datos" });
            }
            
            if (results.length === 0) {
                return res.status(404).json({ error: "Usuario no encontrado" });
            }
            
            res.json({
                ok: true,
                user: {
                    ...results[0],
                    avatar: buildAvatarUrl(req, results[0].avatar)
                }
            });
        }
    );
});

// ✅ PUT - Actualizar perfil de usuario (con foto)
router.put("/:id/perfil", upload.single('avatar'), (req, res) => {
    const { id } = req.params;
    const { nombre, email } = req.body;
    
    let query = "UPDATE usuarios SET";
    const values = [];
    
    if (nombre) {
        query += " nombre = ?,";
        values.push(nombre);
    }
    
    if (email) {
        query += " email = ?,";
        values.push(email);
    }
    
    let avatarPath = null;
    if (req.file) {
        avatarPath = `/uploads/avatars/${req.file.filename}`;
        query += " avatar = ?,";
        values.push(avatarPath);
    }
    
    if (values.length === 0) {
        return res.status(400).json({ error: "No hay datos para actualizar" });
    }
    
    query = query.slice(0, -1);
    query += " WHERE id = ?";
    values.push(id);
    
    db.query(query, values, (err, result) => {
        if (err) {
            console.error("Error DB:", err);
            return res.status(500).json({ error: "Error al actualizar perfil" });
        }
        
        db.query(
            "SELECT id, nombre, email, avatar, created_at, rol FROM usuarios WHERE id = ?",
            [id],
            (err2, results) => {
                if (err2) {
                    return res.json({ ok: true, message: "Perfil actualizado" });
                }
                
                res.json({
                    ok: true,
                    user: {
                        ...results[0],
                        avatar: buildAvatarUrl(req, results[0].avatar)
                    },
                    message: "Perfil actualizado correctamente"
                });
            }
        );
    });
});

// ✅ Cambiar contraseña (NUEVO ENDPOINT)
router.put("/:id/password", async (req, res) => {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Se requieren ambas contraseñas" });
    }
    
    if (newPassword.length < 6) {
        return res.status(400).json({ error: "La nueva contraseña debe tener al menos 6 caracteres" });
    }
    
    try {
        // Obtener usuario actual
        const [users] = await db.promise().query(
            "SELECT password_hash FROM usuarios WHERE id = ?",
            [id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        
        // Verificar contraseña actual
        const passwordMatch = await bcrypt.compare(currentPassword, users[0].password_hash);
        
        if (!passwordMatch) {
            return res.status(401).json({ error: "Contraseña actual incorrecta" });
        }
        
        // Encriptar nueva contraseña
        const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
        
        // Actualizar contraseña
        await db.promise().query(
            "UPDATE usuarios SET password_hash = ? WHERE id = ?",
            [hashedNewPassword, id]
        );
        
        res.json({
            ok: true,
            message: "Contraseña actualizada correctamente"
        });
        
    } catch (error) {
        console.error("Error cambiando contraseña:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// ========== MÉTODOS DE PAGO ==========

router.get("/:id/payment-methods", (req, res) => {
    const { id } = req.params;
    
    db.query("SHOW TABLES LIKE 'payment_methods'", (err, tables) => {
        if (err || tables.length === 0) {
            const createTable = `
                CREATE TABLE IF NOT EXISTS payment_methods (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    usuario_id INT NOT NULL,
                    type VARCHAR(50) NOT NULL,
                    last4 VARCHAR(4) NOT NULL,
                    card_holder VARCHAR(100) NOT NULL,
                    expiry_date VARCHAR(7),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    deleted BOOLEAN DEFAULT 0,
                    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
                )
            `;
            
            db.query(createTable, (err2) => {
                if (err2) {
                    console.error("Error creando tabla:", err2);
                    return res.json({ ok: true, methods: [] });
                }
                res.json({ ok: true, methods: [] });
            });
        } else {
            db.query(
                "SELECT id, type, last4, card_holder, expiry_date FROM payment_methods WHERE usuario_id = ? AND deleted = 0",
                [id],
                (err, results) => {
                    if (err) {
                        console.error("Error DB:", err);
                        return res.json({ ok: true, methods: [] });
                    }
                    
                    res.json({
                        ok: true,
                        methods: results.map(m => ({
                            id: m.id,
                            type: m.type,
                            last4: m.last4,
                            cardHolder: m.card_holder,
                            expiryDate: m.expiry_date
                        }))
                    });
                }
            );
        }
    });
});

router.post("/:id/payment-methods", (req, res) => {
    const { id } = req.params;
    const { type, cardNumber, cardHolder, expiryDate } = req.body;
    
    if (!type || !cardNumber || !cardHolder) {
        return res.status(400).json({ error: "Datos incompletos" });
    }
    
    const last4 = cardNumber.slice(-4);
    
    db.query("SHOW TABLES LIKE 'payment_methods'", (err, tables) => {
        if (err || tables.length === 0) {
            const createTable = `
                CREATE TABLE IF NOT EXISTS payment_methods (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    usuario_id INT NOT NULL,
                    type VARCHAR(50) NOT NULL,
                    last4 VARCHAR(4) NOT NULL,
                    card_holder VARCHAR(100) NOT NULL,
                    expiry_date VARCHAR(7),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    deleted BOOLEAN DEFAULT 0,
                    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
                )
            `;
            
            db.query(createTable, (err2) => {
                if (err2) {
                    console.error("Error creando tabla:", err2);
                    return res.status(500).json({ error: "Error del servidor" });
                }
                
                db.query(
                    "INSERT INTO payment_methods (usuario_id, type, last4, card_holder, expiry_date) VALUES (?, ?, ?, ?, ?)",
                    [id, type, last4, cardHolder, expiryDate],
                    (err3, result) => {
                        if (err3) {
                            console.error("Error insert:", err3);
                            return res.status(500).json({ error: "Error al guardar" });
                        }
                        
                        res.json({
                            ok: true,
                            method: {
                                id: result.insertId,
                                type,
                                last4,
                                cardHolder,
                                expiryDate
                            }
                        });
                    }
                );
            });
        } else {
            db.query(
                "INSERT INTO payment_methods (usuario_id, type, last4, card_holder, expiry_date) VALUES (?, ?, ?, ?, ?)",
                [id, type, last4, cardHolder, expiryDate],
                (err3, result) => {
                    if (err3) {
                        console.error("Error insert:", err3);
                        return res.status(500).json({ error: "Error al guardar" });
                    }
                    
                    res.json({
                        ok: true,
                        method: {
                            id: result.insertId,
                            type,
                            last4,
                            cardHolder,
                            expiryDate
                        }
                    });
                }
            );
        }
    });
});

router.delete("/:id/payment-methods/:methodId", (req, res) => {
    const { id, methodId } = req.params;
    
    db.query(
        "DELETE FROM payment_methods WHERE id = ? AND usuario_id = ?",
        [methodId, id],
        (err, result) => {
            if (err) {
                console.error("Error DB:", err);
                return res.status(500).json({ error: "Error al eliminar" });
            }
            
            res.json({
                ok: true,
                message: "Método de pago eliminado"
            });
        }
    );
});

module.exports = router;
