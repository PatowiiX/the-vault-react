const express = require("express");
const router = express.Router();
const db = require("../db");
const crypto = require("crypto");
const { Resend } = require('resend');
require('dotenv').config({ path: 'C:/Users/patog/OneDrive/Desktop/the-vault-react/backend/.env' });

// Inicializar Resend
const resend = new Resend(process.env.RESEND_API_KEY);

console.log("✅ Resend configurado para recuperación de contraseña");

// ===========================
// SOLICITAR RECUPERACIÓN
// ===========================
router.post("/forgot", (req, res) => {
    const { email } = req.body;
    
    console.log("📩 Solicitud de recuperación para:", email);

    if (!email) {
        return res.status(400).json({ error: "Email requerido" });
    }

    db.query(
        "SELECT id, nombre, email FROM usuarios WHERE email = ?",
        [email],
        (err, results) => {
            if (err) {
                console.error("Error DB:", err);
                return res.status(500).json({ error: "Error en la base de datos" });
            }

            console.log("Resultados búsqueda:", results);

            if (results.length === 0) {
                return res.json({ 
                    ok: true, 
                    message: "Si el email existe, recibirás instrucciones" 
                });
            }

            const usuario = results[0];
            
            const token = crypto.randomBytes(32).toString('hex');
            const expires = new Date();
            expires.setHours(expires.getHours() + 1);

            console.log("Token generado para usuario:", usuario.id);

            db.query(
                "INSERT INTO password_resets (usuario_id, token, expires_at) VALUES (?, ?, ?)",
                [usuario.id, token, expires],
                async (err) => {
                    if (err) {
                        console.error("Error guardando token:", err);
                        return res.status(500).json({ error: "Error al generar recuperación" });
                    }

                    const resetLink = `http://localhost:3000/reset-password?token=${token}`;
                    
                    try {
                        const { data, error } = await resend.emails.send({
                            from: 'The Vault <onboarding@resend.dev>',
                            to: [usuario.email],
                            subject: '🔐 Recuperación de contraseña - The Vault',
                            html: `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; border-radius: 15px; overflow: hidden; border: 2px solid #ff00ff;">
                                    <div style="background: linear-gradient(45deg, #ff00ff, #ff007f); padding: 30px; text-align: center;">
                                        <h1 style="color: white; margin: 0;">THE VAULT</h1>
                                    </div>
                                    <div style="padding: 30px; color: white;">
                                        <h2>¡Hola ${usuario.nombre}!</h2>
                                        <p>Has solicitado recuperar tu contraseña.</p>
                                        <div style="text-align: center; margin: 30px 0;">
                                            <a href="${resetLink}" 
                                               style="background: linear-gradient(45deg, #ff00ff, #ff007f); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                                                RESTABLECER CONTRASEÑA
                                            </a>
                                        </div>
                                        <p>Este enlace expira en 1 hora.</p>
                                        <p>Si no solicitaste esto, ignora este correo.</p>
                                    </div>
                                </div>
                            `
                        });

                        if (error) {
                            console.error("❌ Error de Resend:", error);
                            return res.status(500).json({ error: "Error al enviar email" });
                        }

                        console.log("✅ Email de recuperación enviado a:", usuario.email);
                        
                        res.json({ 
                            ok: true, 
                            message: "Si el email existe, recibirás instrucciones" 
                        });

                    } catch (emailError) {
                        console.error("❌ Error:", emailError);
                        res.status(500).json({ error: "Error al enviar email" });
                    }
                }
            );
        }
    );
});

// ===========================
// VERIFICAR TOKEN
// ===========================
router.post("/verify-token", (req, res) => {
    const { token } = req.body;

    console.log("🔍 Verificando token:", token);

    db.query(
        `SELECT pr.*, u.email, u.nombre 
         FROM password_resets pr
         JOIN usuarios u ON pr.usuario_id = u.id
         WHERE pr.token = ? AND pr.used = FALSE AND pr.expires_at > NOW()`,
        [token],
        (err, results) => {
            if (err) {
                console.error("Error DB:", err);
                return res.status(500).json({ error: "Error DB" });
            }
            
            console.log("Resultados verificación:", results);

            if (results.length === 0) {
                return res.status(400).json({ error: "Token inválido o expirado" });
            }

            res.json({ 
                ok: true, 
                email: results[0].email,
                nombre: results[0].nombre
            });
        }
    );
});

// ===========================
// RESTABLECER CONTRASEÑA
// ===========================
router.post("/reset", (req, res) => {
    const { token, password } = req.body;

    console.log("🔑 Intentando reset con token:", token);

    if (!token || !password || password.length < 6) {
        return res.status(400).json({ error: "Contraseña inválida (mínimo 6 caracteres)" });
    }

    db.query(
        `SELECT pr.*, u.id as usuario_id, u.email, u.nombre 
         FROM password_resets pr
         JOIN usuarios u ON pr.usuario_id = u.id
         WHERE pr.token = ? AND pr.used = FALSE AND pr.expires_at > NOW()`,
        [token],
        (err, results) => {
            if (err) {
                console.error("❌ Error verificando token:", err);
                return res.status(500).json({ error: "Error en base de datos" });
            }

            if (results.length === 0) {
                return res.status(400).json({ error: "Token inválido o expirado" });
            }

            const reset = results[0];
            console.log("✅ Token válido para usuario ID:", reset.usuario_id);

            db.query(
                "UPDATE usuarios SET password_hash = ? WHERE id = ?",
                [password, reset.usuario_id],
                (err, updateResult) => {
                    if (err) {
                        console.error("❌ Error actualizando contraseña:", err);
                        return res.status(500).json({ error: "Error al actualizar contraseña" });
                    }

                    console.log("✅ Contraseña actualizada");

                    db.query(
                        "UPDATE password_resets SET used = TRUE WHERE id = ?",
                        [reset.id],
                        async (err) => {
                            if (err) console.error("⚠️ Error marcando token:", err);

                            // Enviar email de confirmación de cambio
                            try {
                                await resend.emails.send({
                                    from: 'The Vault <onboarding@resend.dev>',
                                    to: [reset.email],
                                    subject: '🔒 Contraseña actualizada - The Vault',
                                    html: `
                                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; border-radius: 15px; overflow: hidden; border: 2px solid #00ff88;">
                                            <div style="background: linear-gradient(45deg, #00ff88, #00cc66); padding: 30px; text-align: center;">
                                                <h1 style="color: white; margin: 0;">THE VAULT</h1>
                                            </div>
                                            <div style="padding: 30px; color: white;">
                                                <h2>¡Hola ${reset.nombre}!</h2>
                                                <p>Tu contraseña ha sido <strong style="color: #00ff88;">actualizada exitosamente</strong>.</p>
                                                <p>Si no realizaste este cambio, contacta a soporte inmediatamente.</p>
                                                <div style="text-align: center; margin-top: 30px;">
                                                    <a href="http://localhost:3000/login" 
                                                       style="background: linear-gradient(45deg, #ff00ff, #ff007f); color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px;">
                                                        INICIAR SESIÓN
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    `
                                });
                                console.log("✅ Email de confirmación de cambio enviado");
                            } catch (emailError) {
                                console.error("❌ Error enviando confirmación:", emailError);
                            }

                            res.json({ 
                                ok: true, 
                                message: "Contraseña actualizada correctamente" 
                            });
                        }
                    );
                }
            );
        }
    );
});

module.exports = router;