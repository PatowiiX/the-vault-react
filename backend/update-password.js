////ACTUALIZADOR DE CONTRASEÑAS A ENCRIPTADO
const bcrypt = require('bcrypt');
const db = require('./db');

const SALT_ROUNDS = 10;

async function updateAdminPassword() {
  const password = 'admin123'; 
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  
  try {
    await db.promise().query(
      "UPDATE usuarios SET password_hash = ? WHERE nombre = 'admin' OR id = 1",
      [hashedPassword]
    );
    console.log("✅ Contraseña de admin actualizada correctamente");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

updateAdminPassword();