const express = require("express");
const router = express.Router();
const db = require("../config/db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// 🟡 Configuração do multer para upload de arquivos (Anexos)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, "../uploads");
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = multer({ storage });

// ✅ 1️⃣ Rota: Buscar todos os produtores (para o dropdown)
router.get("/produtores", (req, res) => {
    const sql = `SELECT id, nome FROM produtores ORDER BY nome ASC`;
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Erro ao buscar produtores:", err);
            return res.status(500).json({ error: "Erro ao buscar produtores." });
        }
        res.status(200).json(results);
    });
});

// ✅ 2️⃣ Rota: Cadastrar Atendimento (Usuário automático, produtor via dropdown)
router.post("/cadastro", upload.single("anexo"), (req, res) => {
    const {
        produtor_id,
        tipo_servico,
        servidor_responsavel,
        data_atendimento,
        status,
        observacoes,
        descricao
    } = req.body;

    // 🟡 Usuário é capturado automaticamente a partir do login (req.user)
    const usuario_id = req.user?.id || null;
    const nome_usuario = req.user?.nome || 'Usuário Desconhecido';
    const anexo = req.file ? req.file.filename : null;

    // 🛑 Verifica se o produtor foi selecionado
    if (!produtor_id) {
        return res.status(400).json({ error: "O produtor é obrigatório." });
    }

    const sql = `
        INSERT INTO atendimentos 
        (usuario_id, nome_usuario, tipo_servico, servidor_responsavel, data_atendimento, status, observacoes, produtor_id, descricao)
        VALUES (?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, 'pendente'), ?, ?, ?)
    `;

    db.query(
        sql,
        [
            usuario_id, 
            nome_usuario,
            tipo_servico || 'Serviço não informado',
            servidor_responsavel || 'Servidor não informado',
            data_atendimento,
            status,
            observacoes,
            produtor_id,
            descricao || 'Sem descrição'
        ],
        (err, result) => {
            if (err) {
                console.error("Erro ao cadastrar atendimento:", err);
                return res.status(500).json({ error: "Erro ao cadastrar atendimento." });
            }

            // 📌 Se houver anexo, insere na tabela anexos_atendimentos
            if (anexo) {
                const anexoSql = `
                    INSERT INTO anexos_atendamentos 
                    (atendimento_id, nome_arquivo, caminho_arquivo)
                    VALUES (?, ?, ?)
                `;
                db.query(anexoSql, [result.insertId, req.file.originalname, anexo], (err) => {
                    if (err) {
                        console.error("Erro ao salvar anexo:", err);
                    }
                });
            }

            res.status(201).json({ 
                message: "✅ Atendimento cadastrado com sucesso!", 
                atendimento_id: result.insertId 
            });
        }
    );
});

// ✅ 3️⃣ Rota: Listar Atendimentos
router.get("/", (req, res) => {
    const sql = `
        SELECT a.*, 
               p.nome AS produtor, 
               an.nome_arquivo, 
               an.caminho_arquivo 
        FROM atendimentos a
        LEFT JOIN produtores p ON a.produtor_id = p.id
        LEFT JOIN anexos_atendimentos an ON a.id = an.atendimento_id
        ORDER BY a.data_atendimento DESC;
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Erro ao buscar atendimentos:", err);
            return res.status(500).json({ error: "Erro ao buscar atendimentos." });
        }
        res.status(200).json(results);
    });
});

// ✅ 4️⃣ Rota: Atualizar Atendimento (status, observações, descrição)
router.put("/:id", (req, res) => {
    const { id } = req.params;
    const { status, observacoes, descricao } = req.body;

    const sql = `
        UPDATE atendimentos
        SET status = COALESCE(?, status),
            observacoes = COALESCE(?, observacoes),
            descricao = COALESCE(?, descricao)
        WHERE id = ?
    `;

    db.query(sql, [status, observacoes, descricao, id], (err, result) => {
        if (err) {
            console.error("Erro ao atualizar atendimento:", err);
            return res.status(500).json({ error: "Erro ao atualizar atendimento." });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Atendimento não encontrado." });
        }

        res.status(200).json({ message: "✅ Atendimento atualizado com sucesso!" });
    });
});

// ✅ 5️⃣ Rota: Excluir Atendimento (e anexos relacionados)
router.delete("/:id", (req, res) => {
    const { id } = req.params;

    const deleteAnexos = `DELETE FROM anexos_atendimentos WHERE atendimento_id = ?`;
    db.query(deleteAnexos, [id], (err) => {
        if (err) {
            console.error("Erro ao excluir anexos:", err);
            return res.status(500).json({ error: "Erro ao excluir anexos." });
        }

        const deleteAtendimento = `DELETE FROM atendimentos WHERE id = ?`;
        db.query(deleteAtendimento, [id], (err, result) => {
            if (err) {
                console.error("Erro ao excluir atendimento:", err);
                return res.status(500).json({ error: "Erro ao excluir atendimento." });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Atendimento não encontrado." });
            }

            res.status(200).json({ message: "✅ Atendimento excluído com sucesso!" });
        });
    });
});

// ✅ 6️⃣ Rota: Listar Anexos por Atendimento
router.get("/:id/anexos", (req, res) => {
    const { id } = req.params;

    const sql = `SELECT * FROM anexos_atendimentos WHERE atendimento_id = ?`;

    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error("Erro ao buscar anexos:", err);
            return res.status(500).json({ error: "Erro ao buscar anexos." });
        }

        res.status(200).json(results);
    });
});

// ✅ 7️⃣ Rota: Baixar Anexo
router.get("/anexos/download/:filename", (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(__dirname, "../uploads", filename);

    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).json({ error: "Arquivo não encontrado" });
    }
});

// 🔹 Exporta o router
module.exports = router;
