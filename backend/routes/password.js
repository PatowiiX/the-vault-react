const express = require("express");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { Resend } = require("resend");
const db = require("../db");

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const SALT_ROUNDS = 10;

router.post("/forgot", async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: "Email requerido" });
    }

    try {
        const [users] = await db.promise().query(
            "SELECT id, nombre, email FROM usuarios WHERE email = ?",
            [email]
        );

        if (users.length === 0) {
            return res.json({
                ok: true,
                message: "Si el email existe, recibiras instrucciones"
            });
        }

        const usuario = users[0];
        const token = crypto.randomBytes(32).toString("hex");
        const expires = new Date();
        expires.setHours(expires.getHours() + 1);

        await db.promise().query(
            "INSERT INTO password_resets (usuario_id, token, expires_at) VALUES (?, ?, ?)",
            [usuario.id, token, expires]
        );

        const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`;
        const { error } = await resend.emails.send({
            from: "The Vault <onboarding@resend.dev>",
            to: [usuario.email],
            subject: "Recuperacion de contrasena - The Vault",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; border-radius: 15px; overflow: hidden; border: 2px solid #ff00ff;">
                    <div style="background: linear-gradient(45deg, #ff00ff, #ff007f); padding: 30px; text-align: center;">
                        <h1 style="color: white; margin: 0;">THE VAULT</h1>
                    </div>
                    <div style="padding: 30px; color: white;">
                        <h2>Hola ${usuario.nombre}!</h2>
                        <p>Has solicitado recuperar tu contrasena.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetLink}"
                               style="background: linear-gradient(45deg, #ff00ff, #ff007f); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                                RESTABLECER CONTRASENA
                            </a>
                        </div>
                        <p>Este enlace expira en 1 hora.</p>
                        <p>Si no solicitaste esto, ignora este correo.</p>
                    </div>
                </div>
            `
        });

        if (error) {
            console.error("Error de Resend:", error);
            return res.status(500).json({ error: "Error al enviar email" });
        }

        return res.json({
            ok: true,
            message: "Si el email existe, recibiras instrucciones"
        });
    } catch (error) {
        console.error("Error en /password/forgot:", error);
        return res.status(500).json({ error: "Error al generar recuperacion" });
    }
});

router.post("/verify-token", async (req, res) => {
    const { token } = req.body;

    try {
        const [results] = await db.promise().query(
            `SELECT pr.*, u.email, u.nombre
             FROM password_resets pr
             JOIN usuarios u ON pr.usuario_id = u.id
             WHERE pr.token = ? AND pr.used = FALSE AND pr.expires_at > NOW()`,
            [token]
        );

        if (results.length === 0) {
            return res.status(400).json({ error: "Token invalido o expirado" });
        }

        return res.json({
            ok: true,
            email: results[0].email,
            nombre: results[0].nombre
        });
    } catch (error) {
        console.error("Error verificando token:", error);
        return res.status(500).json({ error: "Error DB" });
    }
});

router.post("/reset", async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password || password.length < 6) {
        return res.status(400).json({ error: "Contrasena invalida (minimo 6 caracteres)" });
    }

    try {
        const [results] = await db.promise().query(
            `SELECT pr.*, u.id AS usuario_id, u.email, u.nombre
             FROM password_resets pr
             JOIN usuarios u ON pr.usuario_id = u.id
             WHERE pr.token = ? AND pr.used = FALSE AND pr.expires_at > NOW()`,
            [token]
        );

        if (results.length === 0) {
            return res.status(400).json({ error: "Token invalido o expirado" });
        }

        const reset = results[0];
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        await db.promise().query(
            "UPDATE usuarios SET password_hash = ? WHERE id = ?",
            [hashedPassword, reset.usuario_id]
        );

        await db.promise().query(
            "UPDATE password_resets SET used = TRUE WHERE id = ?",
            [reset.id]
        );

        try {
            await resend.emails.send({
                from: "The Vault <onboarding@resend.dev>",
                to: [reset.email],
                subject: "Contrasena actualizada - The Vault",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; border-radius: 15px; overflow: hidden; border: 2px solid #00ff88;">
                        <div style="background: linear-gradient(45deg, #00ff88, #00cc66); padding: 30px; text-align: center;">
                            <h1 style="color: white; margin: 0;">THE VAULT</h1>
                        </div>
                        <div style="padding: 30px; color: white;">
                            <h2>Hola ${reset.nombre}!</h2>
                            <p>Tu contrasena ha sido <strong style="color: #00ff88;">actualizada exitosamente</strong>.</p>
                            <p>Si no realizaste este cambio, contacta a soporte inmediatamente.</p>
                            <div style="text-align: center; margin-top: 30px;">
                                <a href="${FRONTEND_URL}/login"
                                   style="background: linear-gradient(45deg, #ff00ff, #ff007f); color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px;">
                                    INICIAR SESION
                                </a>
                            </div>
                        </div>
                    </div>
                `
            });
        } catch (emailError) {
            console.error("Error enviando confirmacion:", emailError);
        }

        return res.json({
            ok: true,
            message: "Contrasena actualizada correctamente"
        });
    } catch (error) {
        console.error("Error en /password/reset:", error);
        return res.status(500).json({ error: "Error al actualizar contrasena" });
    }
});

module.exports = router;
