const express = require("express");
const router = express.Router();
const db = require("../config/db");

// 🔹 Função para criar uma nova notificação
const criarNotificacao = (mensagem) => {
    const sql = "INSERT INTO notificacoes (mensagem, lida) VALUES (?, 0)";
    db.query(sql, [mensagem], (err, result) => {
        if (err) {
            console.error("❌ Erro ao criar notificação:", err);
        } else {
            console.log("✅ Notificação criada com sucesso!");
        }
    });
};

// 🔹 Rota para listar todas as notificações
router.get("/", (req, res) => {
    const sql = "SELECT * FROM notificacoes ORDER BY criada_em DESC";

    db.query(sql, (err, result) => {
        if (err) {
            console.error("❌ Erro ao buscar notificações:", err);
            return res.status(500).json({ error: "Erro ao buscar notificações." });
        }
        res.status(200).json(result);
    });
});

// 🔹 Rota para marcar uma notificação como lida
router.put("/:id", (req, res) => {
    const { id } = req.params;

    // Verificação se o ID é um número válido
    if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido." });
    }

    const sql = "UPDATE notificacoes SET lida = 1 WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("❌ Erro ao marcar notificação como lida:", err);
            return res.status(500).json({ error: "Erro ao atualizar notificação." });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Notificação não encontrada." });
        }

        res.status(200).json({ message: "✅ Notificação marcada como lida." });
    });
});

// 🔹 Exportando corretamente
module.exports = router;
module.exports.criarNotificacao = criarNotificacao;
