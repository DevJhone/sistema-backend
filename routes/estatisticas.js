const express = require("express");
const db = require("../config/db");
const router = express.Router();

// 📊 Obter estatísticas de produtores
router.get("/produtores", (req, res) => {
    const sql = "SELECT COUNT(*) AS total FROM produtores";

    db.query(sql, (err, result) => {
        if (err) {
            console.error("Erro ao buscar estatísticas de produtores:", err);
            return res.status(500).json({ error: "Erro ao buscar estatísticas de produtores." });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: "Produtor não encontrado." });
        }

        res.json({ totalProdutores: result[0].total });
    });
});

// 📊 Obter estatísticas de atendimentos
router.get("/atendimentos", (req, res) => {
    const sql = `
        SELECT COUNT(*) AS total_atendimentos, 
               SUM(CASE WHEN status = 'concluído' THEN 1 ELSE 0 END) AS concluidos,
               SUM(CASE WHEN status = 'pendente' THEN 1 ELSE 0 END) AS pendentes
        FROM atendimentos;
    `;

    db.query(sql, (err, result) => {
        if (err) {
            console.error("Erro ao buscar estatísticas de atendimentos:", err);
            return res.status(500).json({ error: "Erro ao buscar estatísticas de atendimentos." });
        }

        res.json(result[0]);
    });
});

// 📊 Obter estatísticas de agendamentos
router.get("/agendamentos", (req, res) => {
    const sql = "SELECT COUNT(*) AS total FROM agendamentos";

    db.query(sql, (err, result) => {
        if (err) {
            console.error("Erro ao buscar estatísticas de agendamentos:", err);
            return res.status(500).json({ error: "Erro ao buscar estatísticas de agendamentos." });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: "Agendamento não encontrado." });
        }

        res.json({ totalAgendamentos: result[0].total });
    });
});

// 📊 Estatísticas gerais do sistema
router.get("/", (req, res) => {
    const sql = `
        SELECT 
            (SELECT COUNT(*) FROM produtores) AS total_produtores,
            (SELECT COUNT(*) FROM atendimentos) AS total_atendimentos,
            (SELECT COUNT(*) FROM agendamentos) AS total_agendamentos
    `;

    db.query(sql, (err, result) => {
        if (err) {
            console.error("Erro ao buscar estatísticas gerais:", err);
            return res.status(500).json({ error: "Erro ao buscar estatísticas gerais." });
        }

        res.json(result[0]);
    });
});

module.exports = router;
