const express = require("express");
const router = express.Router();
const db = require("../config/db");

// 🔹 Rota para cadastrar produtores
router.post("/cadastro", (req, res) => {
    const { nome, cpf_cnpj, endereco, tipo_producao, latitude, longitude } = req.body;

    if (!nome || !cpf_cnpj || !endereco || !tipo_producao || !latitude || !longitude) {
        return res.status(400).json({ error: "Todos os campos são obrigatórios!" });
    }

    const sql = "INSERT INTO produtores (nome, cpf_cnpj, endereco, tipo_producao, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(sql, [nome, cpf_cnpj, endereco, tipo_producao, latitude, longitude], (err, result) => {
        if (err) {
            console.error("Erro ao salvar no banco de dados:", err);
            return res.status(500).json({ error: "Erro ao salvar no banco de dados." });
        }
        res.status(201).json({ message: "Produtor cadastrado com sucesso!" });
    });
});

// 🔹 Rota para listar todos os produtores
router.get("/", (req, res) => {
    const sql = "SELECT * FROM produtores";
    db.query(sql, (err, result) => {
        if (err) {
            console.error("Erro ao buscar produtores:", err);
            return res.status(500).json({ error: "Erro ao buscar produtores." });
        }
        res.status(200).json(result);
    });
});

// 🔹 Rota para buscar um produtor pelo ID
router.get("/:id", (req, res) => {
    const { id } = req.params;
    const sql = "SELECT * FROM produtores WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Erro ao buscar produtor:", err);
            return res.status(500).json({ error: "Erro ao buscar produtor." });
        }
        if (result.length === 0) {
            return res.status(404).json({ error: "Produtor não encontrado." });
        }
        res.status(200).json(result[0]);
    });
});

module.exports = router;


// 📌 Rota para atualizar um produtor pelo ID
router.put("/:id", (req, res) => {
    const { id } = req.params;
    const { nome, cpf_cnpj, endereco, tipo_producao, latitude, longitude } = req.body;

    if (!nome || !cpf_cnpj || !endereco || !tipo_producao || !latitude || !longitude) {
        return res.status(400).json({ error: "Todos os campos são obrigatórios!" });
    }

    const sql = "UPDATE produtores SET nome = ?, cpf_cnpj = ?, endereco = ?, tipo_producao = ?, latitude = ?, longitude = ? WHERE id = ?";
    db.query(sql, [nome, cpf_cnpj, endereco, tipo_producao, latitude, longitude, id], (err, result) => {
        if (err) {
            console.error("Erro ao atualizar produtor:", err);
            return res.status(500).json({ error: "Erro ao atualizar produtor." });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Produtor não encontrado." });
        }
        res.status(200).json({ message: "Produtor atualizado com sucesso!" });
    });
});

// 📌 Rota para excluir um produtor pelo ID
router.delete("/:id", (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM produtores WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Erro ao excluir produtor:", err);
            return res.status(500).json({ error: "Erro ao excluir produtor." });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Produtor não encontrado." });
        }
        res.status(200).json({ message: "Produtor excluído com sucesso!" });
    });
});

// 📌 Rota para obter estatísticas dos produtores
router.get("/estatisticas", (req, res) => {
    const sql = `
        SELECT 
            COUNT(*) AS total_produtores,
            COALESCE(SUM(CASE WHEN tipo_producao = 'pecuaria' THEN 1 ELSE 0 END), 0) AS total_pecuaria,
            COALESCE(SUM(CASE WHEN tipo_producao = 'agricultura' THEN 1 ELSE 0 END), 0) AS total_agricultura,
            COALESCE(SUM(CASE WHEN tipo_producao = 'horticultura' THEN 1 ELSE 0 END), 0) AS total_horticultura
        FROM produtores;
    `;

    db.query(sql, (err, result) => {
        if (err) {
            console.error("Erro ao obter estatísticas:", err);
            return res.status(500).json({ error: "Erro ao obter estatísticas." });
        }
        res.status(200).json(result[0]);
    });
});

module.exports = router;
