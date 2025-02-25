const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config(); // Carrega as variáveis do .env

const db = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "sistema_secretaria",
    connectionLimit: 10,
});

db.getConnection((err, connection) => {
    if (err) {
        console.error("❌ ERRO ao conectar ao MySQL:", err);
    } else {
        console.log("✅ Conexão com MySQL estabelecida!");
        connection.release();
    }
});

module.exports = db;
