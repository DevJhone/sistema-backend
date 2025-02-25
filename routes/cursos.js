const express = require("express");
const db = require("../config/db");
const router = express.Router();

// 📚 1️⃣ Rota: Obter todos os cursos (ordenados por data)
router.get("/", (req, res) => {
    const sql = "SELECT * FROM cursos ORDER BY data_inicio DESC";
    db.query(sql, (err, result) => {
        if (err) {
            console.error("❌ Erro ao buscar cursos:", err);
            return res.status(500).json({ error: "Erro ao buscar cursos no banco de dados." });
        }
        res.json(result);
    });
});

// 📚 2️⃣ Rota: Criar um novo curso
router.post("/", (req, res) => {
    const { nome, descricao, data_inicio, data_fim } = req.body;

    if (!nome || !data_inicio || !data_fim) {
        return res.status(400).json({ error: "Nome e datas são obrigatórios." });
    }

    const sql = "INSERT INTO cursos (nome, descricao, data_inicio, data_fim) VALUES (?, ?, ?, ?)";
    db.query(sql, [nome, descricao, data_inicio, data_fim], (err, result) => {
        if (err) {
            console.error("❌ Erro ao criar curso:", err);
            return res.status(500).json({ error: "Erro ao cadastrar o curso no banco de dados." });
        }
        res.status(201).json({ message: "✅ Curso criado com sucesso!", curso_id: result.insertId });
    });
});

// 📚 3️⃣ Rota: Obter um curso específico pelo ID
router.get("/:id", (req, res) => {
    const { id } = req.params;

    const sql = "SELECT * FROM cursos WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("❌ Erro ao buscar curso:", err);
            return res.status(500).json({ error: "Erro ao buscar o curso no banco de dados." });
        }
        if (result.length === 0) {
            return res.status(404).json({ error: "Curso não encontrado." });
        }
        res.json(result[0]);
    });
});

// 📚 4️⃣ Rota: Atualizar um curso existente
router.put("/:id", (req, res) => {
    const { id } = req.params;
    const { nome, descricao, data_inicio, data_fim } = req.body;

    const sql = "UPDATE cursos SET nome = ?, descricao = ?, data_inicio = ?, data_fim = ? WHERE id = ?";
    db.query(sql, [nome, descricao, data_inicio, data_fim, id], (err, result) => {
        if (err) {
            console.error("❌ Erro ao atualizar curso:", err);
            return res.status(500).json({ error: "Erro ao atualizar o curso." });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Curso não encontrado." });
        }
        res.json({ message: "✅ Curso atualizado com sucesso!" });
    });
});

// 📚 5️⃣ Rota: Excluir um curso
router.delete("/:id", (req, res) => {
    const { id } = req.params;

    const sql = "DELETE FROM cursos WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("❌ Erro ao excluir curso:", err);
            return res.status(500).json({ error: "Erro ao excluir o curso." });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Curso não encontrado." });
        }
        res.json({ message: "✅ Curso excluído com sucesso!" });
    });
});

// 📚 Cadastrar um participante em um curso (usando Nome, sem ID de usuário)
router.post("/:id/participantes", (req, res) => {
    const { id } = req.params;
    const { nome_aluno } = req.body;

    if (!nome_aluno) {
        return res.status(400).json({ error: "O nome do aluno é obrigatório." });
    }

    // 🟡 Verifica se o curso existe antes de cadastrar o participante
    db.query("SELECT * FROM cursos WHERE id = ?", [id], (err, result) => {
        if (err) {
            console.error("❌ Erro ao verificar curso:", err);
            return res.status(500).json({ error: "Erro ao verificar curso." });
        }
        if (result.length === 0) {
            return res.status(404).json({ error: "Curso não encontrado." });
        }

        // ✅ Insere o participante no curso apenas com o nome
        const sql = "INSERT INTO participantes_curso (curso_id, nome_aluno) VALUES (?, ?)";
        db.query(sql, [id, nome_aluno], (err, result) => {
            if (err) {
                console.error("❌ Erro ao cadastrar participante:", err);
                return res.status(500).json({ error: "Erro ao cadastrar participante." });
            }
            res.status(201).json({ message: "✅ Participante cadastrado com sucesso!" });
        });
    });
});

// 📚 Obter participantes de um curso
router.get("/:id/participantes", (req, res) => {
    const { id } = req.params;

    const sql = "SELECT id, nome_aluno FROM participantes_curso WHERE curso_id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("❌ Erro ao buscar participantes:", err);
            return res.status(500).json({ error: "Erro ao buscar participantes." });
        }
        res.json(result);
    });
});

module.exports = router;

