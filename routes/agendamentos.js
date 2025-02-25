const express = require("express");
const db = require("../config/db");
const router = express.Router();

// 📌 Obter todos os agendamentos com o nome do produtor
router.get("/", async (req, res) => {
    try {
        const sql = `
            SELECT ag.id, p.nome AS nome_produtor, ag.servico, ag.data_agendamento, ag.status 
            FROM agendamentos ag
            JOIN produtores p ON ag.produtor_id = p.id
        `;
        db.query(sql, (err, result) => {
            if (err) {
                console.error("❌ Erro ao buscar agendamentos:", err);
                return res.status(500).json({ error: "Erro ao buscar agendamentos." });
            }
            res.json(result);
        });
    } catch (error) {
        console.error("❌ Erro no servidor:", error);
        res.status(500).json({ error: "Erro no servidor." });
    }
});

// 📌 Criar um novo agendamento
router.post("/", async (req, res) => {
    const { produtor_id, servico, data_agendamento, status } = req.body;

    if (!produtor_id || !servico || !data_agendamento) {
        return res.status(400).json({ error: "Todos os campos obrigatórios devem ser preenchidos." });
    }

    try {
        const sql = `
            INSERT INTO agendamentos (produtor_id, servico, data_agendamento, status) 
            VALUES (?, ?, ?, ?)
        `;
        db.query(sql, [produtor_id, servico, data_agendamento, status || "pendente"], (err, result) => {
            if (err) {
                console.error("❌ Erro ao criar agendamento:", err);
                return res.status(500).json({ error: "Erro ao criar agendamento." });
            }
            res.status(201).json({ message: "✅ Agendamento criado com sucesso!", id: result.insertId });
        });
    } catch (error) {
        console.error("❌ Erro no servidor:", error);
        res.status(500).json({ error: "Erro no servidor." });
    }
});

// 📌 Atualizar apenas o status de um agendamento
router.put("/:id/status", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ error: "O status é obrigatório para atualizar o agendamento." });
    }

    try {
        const sql = "UPDATE agendamentos SET status = ? WHERE id = ?";
        db.query(sql, [status, id], (err, result) => {
            if (err) {
                console.error("❌ Erro ao atualizar status do agendamento:", err);
                return res.status(500).json({ error: "Erro ao atualizar status do agendamento." });
            }
            res.json({ message: "✅ Status do agendamento atualizado com sucesso!" });
        });
    } catch (error) {
        console.error("❌ Erro no servidor:", error);
        res.status(500).json({ error: "Erro no servidor." });
    }
});

// 📌 Atualizar serviço e data de um agendamento
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { servico, data_agendamento } = req.body;

    if (!servico || !data_agendamento) {
        return res.status(400).json({ error: "Serviço e data são obrigatórios para atualização." });
    }

    try {
        const sql = `
            UPDATE agendamentos 
            SET servico = ?, data_agendamento = ? 
            WHERE id = ?
        `;
        db.query(sql, [servico, data_agendamento, id], (err, result) => {
            if (err) {
                console.error("❌ Erro ao atualizar agendamento:", err);
                return res.status(500).json({ error: "Erro ao atualizar agendamento." });
            }
            res.json({ message: "✅ Agendamento atualizado com sucesso!" });
        });
    } catch (error) {
        console.error("❌ Erro no servidor:", error);
        res.status(500).json({ error: "Erro no servidor." });
    }
});

// 📌 Excluir um agendamento
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const sql = "DELETE FROM agendamentos WHERE id = ?";
        db.query(sql, [id], (err, result) => {
            if (err) {
                console.error("❌ Erro ao excluir agendamento:", err);
                return res.status(500).json({ error: "Erro ao excluir agendamento." });
            }
            res.json({ message: "✅ Agendamento excluído com sucesso!" });
        });
    } catch (error) {
        console.error("❌ Erro no servidor:", error);
        res.status(500).json({ error: "Erro no servidor." });
    }
});

module.exports = router;
