const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "yamabiko.proxy.rlwy.net",
  user: "root",
  password: "RAkToxJePsvzNffBxtMeKDEIWJWXHGnJ",
  database: "railway",
  port: 16703,
});

db.connect((err) => {
  if (err) {
    console.error("❌ Erro ao conectar ao banco de dados:", err);
    return;
  }
  console.log("✅ Conectado ao banco de dados do Railway!");
});

module.exports = db;
