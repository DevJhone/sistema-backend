const express = require("express");
const cors = require("cors");
const db = require("./config/db");
const jwt = require("jsonwebtoken");

// 🔹 Importação de Rotas
const produtoresRoutes = require("./routes/produtores");
const atendimentosRoutes = require("./routes/atendimentos");
const agendamentosRoutes = require("./routes/agendamentos");
const estatisticasRoutes = require("./routes/estatisticas");
const notificacoesRoutes = require("./routes/notificacoes");
const usuariosRoutes = require("./routes/usuarios");
const cursosRoutes = require("./routes/cursos");
const almoxarifadoRoutes = require("./routes/almoxarifado"); // ✅ Adicionado Almoxarifado

const app = express();

// 🟢 Middlewares Globais
app.use(cors());
app.use(express.json());

// 🔹 Middleware de Autenticação
const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Acesso negado. Token não fornecido." });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: "Token inválido." });
    }
};

// 🟢 Rotas da API (Autenticadas)
app.use("/api/produtores", authenticateToken, produtoresRoutes);
app.use("/api/atendimentos", authenticateToken, atendimentosRoutes);
app.use("/api/agendamentos", authenticateToken, agendamentosRoutes);
app.use("/api/estatisticas", authenticateToken, estatisticasRoutes);
app.use("/api/notificacoes", authenticateToken, notificacoesRoutes);
app.use("/api/cursos", authenticateToken, cursosRoutes);
app.use("/api/almoxarifado", authenticateToken, almoxarifadoRoutes); // ✅ Adicionada Rota do Almoxarifado

// 🟢 Rotas Públicas (Sem Autenticação)
app.use("/api/usuarios", usuariosRoutes); // Usuários podem acessar login sem token

// 🟢 Servir Arquivos Estáticos (Uploads de Atendimentos)
app.use("/uploads", express.static("uploads"));

// 📌 Middleware Global para Captura de Erros
app.use((err, req, res, next) => {
    console.error("❌ Erro Global:", err);
    res.status(500).json({ error: "Erro interno do servidor.", detalhes: err.message });
});

// 🔹 Verificar Conexão Antes de Iniciar o Servidor
db.getConnection((err, connection) => {
    if (err) {
        console.error("❌ Erro ao conectar ao banco de dados:", err);
        process.exit(1); // Encerra o servidor se a conexão falhar
    } else {
        console.log("✅ Conexão com MySQL estabelecida!");
        connection.release(); // Libera a conexão

        // 🟢 Iniciar o Servidor
        const PORT = process.env.PORT || 5001;
        app.listen(PORT, () => {
            console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
        });
    }
});
