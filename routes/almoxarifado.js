const express = require("express");
const db = require("../config/db");
const router = express.Router();

// 📦 Obter todos os itens do almoxarifado
router.get("/itens", (req, res) => {
    const sql = "SELECT * FROM itens_almoxarifado";
    db.query(sql, (err, result) => {
        if (err) {
            console.error("❌ Erro ao buscar itens:", err);
            return res.status(500).json({ error: "Erro ao buscar itens." });
        }
        res.json(result);
    });
});

// 📦 Registrar um novo item no almoxarifado
router.post("/itens", (req, res) => {
    const { nome, descricao, quantidade } = req.body;

    if (!nome || quantidade == null) {
        return res.status(400).json({ error: "Nome e quantidade são obrigatórios." });
    }

    const sql = "INSERT INTO itens_almoxarifado (nome, descricao, quantidade) VALUES (?, ?, ?)";
    db.query(sql, [nome, descricao, quantidade], (err, result) => {
        if (err) {
            console.error("❌ Erro ao adicionar item:", err);
            return res.status(500).json({ error: "Erro ao adicionar item." });
        }
        res.status(201).json({ message: "✅ Item adicionado com sucesso!" });
    });
});

// 📦 Excluir um item do almoxarifado
router.delete("/itens/:id", (req, res) => {
    const { id } = req.params;

    const sql = "DELETE FROM itens_almoxarifado WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("❌ Erro ao excluir item:", err);
            return res.status(500).json({ error: "Erro ao excluir item." });
        }
        res.json({ message: "✅ Item excluído com sucesso!" });
    });
});

// 📦 Registrar um empréstimo (Somente com Nome do Usuário)
router.post("/emprestimos", (req, res) => {
    const { item_id, nome_usuario } = req.body;

    if (!item_id || !nome_usuario) {
        return res.status(400).json({ error: "Item e nome do usuário são obrigatórios." });
    }

    // 🔹 Verificar se o item tem estoque disponível
    db.query("SELECT quantidade FROM itens_almoxarifado WHERE id = ?", [item_id], (err, result) => {
        if (err) {
            console.error("❌ Erro ao verificar item:", err);
            return res.status(500).json({ error: "Erro ao verificar item." });
        }
        if (result.length === 0) {
            return res.status(404).json({ error: "Item não encontrado." });
        }
        if (result[0].quantidade <= 0) {
            return res.status(400).json({ error: "Este item está sem estoque para empréstimo." });
        }

        // 🔹 Registrar o empréstimo
        const sql = "INSERT INTO emprestimos (item_id, nome_usuario, status) VALUES (?, ?, 'pendente')";
        db.query(sql, [item_id, nome_usuario], (err, result) => {
            if (err) {
                console.error("❌ Erro ao registrar empréstimo:", err);
                return res.status(500).json({ error: "Erro ao registrar empréstimo." });
            }

            // 🔹 Reduzir a quantidade do item emprestado
            db.query("UPDATE itens_almoxarifado SET quantidade = quantidade - 1 WHERE id = ?", [item_id]);

            res.status(201).json({ message: "✅ Empréstimo registrado com sucesso!" });
        });
    });
});

// 📦 Atualizar status do empréstimo (Marcar como devolvido e atualizar estoque)
router.put("/emprestimos/:id/devolver", (req, res) => {
    const { id } = req.params;

    // 🔹 Buscar item emprestado
    db.query("SELECT item_id FROM emprestimos WHERE id = ?", [id], (err, result) => {
        if (err) {
            console.error("❌ Erro ao buscar empréstimo:", err);
            return res.status(500).json({ error: "Erro ao buscar empréstimo." });
        }
        if (result.length === 0) {
            return res.status(404).json({ error: "Empréstimo não encontrado." });
        }

        const item_id = result[0].item_id;

        // 🔹 Marcar como devolvido
        db.query("UPDATE emprestimos SET status = 'devolvido', data_devolucao = NOW() WHERE id = ?", [id], (err) => {
            if (err) {
                console.error("❌ Erro ao atualizar empréstimo:", err);
                return res.status(500).json({ error: "Erro ao atualizar empréstimo." });
            }

            // 🔹 Repor a quantidade do item devolvido
            db.query("UPDATE itens_almoxarifado SET quantidade = quantidade + 1 WHERE id = ?", [item_id]);

            res.json({ message: "✅ Item devolvido com sucesso!" });
        });
    });
});

// 📦 Obter todos os empréstimos
router.get("/emprestimos", (req, res) => {
    const sql = `
        SELECT e.id, i.nome AS item, e.nome_usuario, e.data_emprestimo, e.data_devolucao, e.status
        FROM emprestimos e
        JOIN itens_almoxarifado i ON e.item_id = i.id
        ORDER BY e.data_emprestimo DESC
    `;
    db.query(sql, (err, result) => {
        if (err) {
            console.error("❌ Erro ao buscar empréstimos:", err);
            return res.status(500).json({ error: "Erro ao buscar empréstimos." });
        }
        res.json(result);
    });
});

// 📦 Excluir um empréstimo
router.delete("/emprestimos/:id", (req, res) => {
    const { id } = req.params;

    const sql = "DELETE FROM emprestimos WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("❌ Erro ao excluir empréstimo:", err);
            return res.status(500).json({ error: "Erro ao excluir empréstimo." });
        }
        res.json({ message: "✅ Empréstimo excluído com sucesso!" });
    });
});

module.exports = router;
