// db.js
const mysql = require("mysql2");

// Pool = múltiples conexiones estables
const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "0000",
    database: "thevault",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Probar conexión al iniciar
db.getConnection((err, connection) => {
    if (err) {
        console.error("❌ Error conectando a MySQL:", err.message);
    } else {
        console.log("✅ Conectado a MySQL (vault)");
        connection.release();
    }
});

module.exports = db;
