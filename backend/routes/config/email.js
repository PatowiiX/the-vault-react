// backend/config/email.js
const nodemailer = require('nodemailer');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// Crear transporter según configuración
const createTransporter = () => {
    // Verificar qué servicio estamos usando
    if (process.env.EMAIL_SERVICE === 'gmail') {
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    } else {
        // Configuración SMTP genérica (para Brevo, Mailgun, etc.)
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT || 587,
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }
};

const transporter = createTransporter();

// Verificar conexión
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Error de conexión SMTP:', error.message);
    } else {
        console.log('✅ Servidor de email listo');
    }
});

// Template para email de recuperación
const getRecoveryEmailTemplate = (nombre, resetLink) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; background: #0a0a0f; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: #1a1a2e; border-radius: 15px; overflow: hidden; border: 2px solid #ff00ff; }
        .header { background: linear-gradient(45deg, #ff00ff, #ff007f); padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-family: 'Bungee', cursive; }
        .content { padding: 30px; color: white; }
        .button { display: inline-block; padding: 15px 30px; background: linear-gradient(45deg, #ff00ff, #ff007f); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .footer { background: #0f0f1a; padding: 20px; text-align: center; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>THE VAULT</h1>
        </div>
        <div class="content">
            <h2>¡Hola ${nombre}!</h2>
            <p>Has solicitado recuperar tu contraseña en The Vault.</p>
            <p>Haz clic en el siguiente botón para restablecerla:</p>
            <div style="text-align: center;">
                <a href="${resetLink}" class="button">RESTABLECER CONTRASEÑA</a>
            </div>
            <p>Este enlace expira en <strong>1 hora</strong>.</p>
            <p>Si no solicitaste este cambio, ignora este correo.</p>
        </div>
        <div class="footer">
            © 2025 The Vault - Tienda de música física
        </div>
    </div>
</body>
</html>
`;

// Template para email de confirmación de pedido
const getOrderConfirmationTemplate = (nombre, orden) => {
    const itemsHtml = orden.items.map(item => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #333;">
                <strong>${item.titulo || item.title}</strong><br>
                <small>${item.artista || item.artist} - ${item.formato || item.format}</small>
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #333; text-align: center;">${item.cantidad || item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #333; text-align: right;">$${((item.precio_unitario || item.price) * (item.cantidad || item.quantity)).toFixed(2)}</td>
        </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; background: #0a0a0f; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: #1a1a2e; border-radius: 15px; overflow: hidden; border: 2px solid #00ff88; }
        .header { background: linear-gradient(45deg, #00ff88, #00cc66); padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-family: 'Bungee', cursive; }
        .content { padding: 30px; color: white; }
        .order-details { background: #0f0f1a; padding: 20px; border-radius: 10px; margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 10px; background: #2a2a3a; }
        td { padding: 10px; }
        .total { font-size: 20px; color: #00ff88; font-weight: bold; }
        .footer { background: #0f0f1a; padding: 20px; text-align: center; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>THE VAULT</h1>
        </div>
        <div class="content">
            <h2>¡Gracias por tu compra, ${nombre}!</h2>
            <p>Tu pedido ha sido recibido y está siendo procesado.</p>
            
            <div class="order-details">
                <h3>Detalles del pedido #${orden.id}</h3>
                <p><strong>Número de seguimiento:</strong> ${orden.tracking_number || 'TRK-' + Date.now()}</p>
                
                <table>
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Cant.</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
                
                <hr style="border: 1px solid #333; margin: 20px 0;">
                
                <div style="text-align: right;">
                    <p><strong>Subtotal:</strong> $${orden.subtotal?.toFixed(2)}</p>
                    <p><strong>Envío:</strong> $${orden.shipping_cost?.toFixed(2)}</p>
                    <p><strong>IVA:</strong> $${orden.tax_amount?.toFixed(2)}</p>
                    <p class="total"><strong>TOTAL:</strong> $${orden.total?.toFixed(2)}</p>
                </div>
                
                <p><strong>Dirección de envío:</strong><br>${orden.direccion_envio}</p>
                <p><strong>Método de pago:</strong> ${orden.metodo_pago}</p>
            </div>
            
            <p style="text-align: center;">
                <a href="http://localhost:3000/orden/${orden.id}" 
                   style="background: linear-gradient(45deg, #ff00ff, #ff007f); color: white; padding: 12px 25px; 
                          text-decoration: none; border-radius: 5px; display: inline-block;">
                    VER DETALLES DEL PEDIDO
                </a>
            </p>
        </div>
        <div class="footer">
            © 2025 The Vault - Tienda de música física
        </div>
    </div>
</body>
</html>
`;
};

module.exports = {
    transporter,
    getRecoveryEmailTemplate,
    getOrderConfirmationTemplate
};