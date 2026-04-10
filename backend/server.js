// ===============================
// server.js - Backend The Vault
// ===============================
const express = require("express");
const cors = require("cors");
const db = require("./db");
const discosRoutes = require("./routes/discos");
const usuariosRoutes = require("./routes/usuarios");
const contactoRoutes = require("./routes/contacto");
const paypalRoutes = require("./routes/Paypal");
const ordenesRoutes = require("./routes/ordenes");
const passwordRoutes = require("./routes/password");
const spotifyRoutes = require("./routes/Spotify"); // Spotify API

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use("/images", express.static("images"));

// RUTAS
app.use("/api/discos", discosRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/contacto", contactoRoutes);
app.use("/api/paypal", paypalRoutes);
app.use("/api/ordenes", ordenesRoutes);
app.use("/api/password", passwordRoutes);
app.use("/api/spotify", spotifyRoutes); //  Ruta para Spotify

// RUTA DE PRUEBA
app.get("/api", (req, res) => {
    res.json({ ok: true, mensaje: "Backend The Vault funcionando" });
});

app.listen(PORT, () => {
    console.log(`Servidor listo en http://localhost:${PORT}`);  
});