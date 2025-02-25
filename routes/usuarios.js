const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const router = express.Router();

// 🔐 Chave secreta para JWT (deve estar no .env)
const JWT_SECRET = process.env.JWT_SECRET;

// 🛡 Middleware para proteger rotas
const verificarToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(403).json({ error: "Token não fornecido." });
    }

    const token = authHeader.split(" ")[1]; // 🔹 Agora trata corretamente o formato "Bearer token"
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: "Token inválido." });
        }
        req.usuarioId = decoded.id;
        req.usuarioTipo = decoded.tipo;
        next();
    });
};

// 🛡 Middleware para verificar permissões de admin
const verificarAdmin = (req, res, next) => {
    if (req.usuarioTipo !== "admin") {
        return res.status(403).json({ error: "Acesso restrito a administradores." });
    }
    next();
};

// 📌 Rota de cadastro de usuário
router.post("/cadastro", async (req, res) => {
    const { nome, email, senha, tipo } = req.body;

    if (!nome || !email || !senha || !tipo) {
        return res.status(400).json({ error: "Todos os campos são obrigatórios." });
    }

    try {
        // Criptografando a senha com bcrypt
        const hashedPassword = await bcrypt.hash(senha, 10);

        const sql = "INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)";
        db.query(sql, [nome, email, hashedPassword, tipo], (err, result) => {
            if (err) {
                console.error("Erro ao cadastrar usuário:", err);
                return res.status(500).json({ error: "Erro ao cadastrar usuário." });
            }
            res.status(201).json({ message: "Usuário cadastrado com sucesso." });
        });
    } catch (error) {
        console.error("Erro ao criptografar a senha:", error);
        res.status(500).json({ error: "Erro no servidor." });
    }
});

// 📌 Rota de login de usuário
router.post("/login", (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ error: "Email e senha são obrigatórios." });
    }

    const sql = "SELECT * FROM usuarios WHERE email = ?";
    db.query(sql, [email], async (err, results) => {
        if (err) {
            console.error("Erro ao buscar usuário:", err);
            return res.status(500).json({ error: "Erro no servidor." });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: "Email ou senha inválidos." });
        }

        const usuario = results[0];
        const senhaValida = await bcrypt.compare(senha, usuario.senha);

        if (!senhaValida) {
            return res.status(401).json({ error: "Email ou senha inválidos." });
        }

        const token = jwt.sign({ id: usuario.id, tipo: usuario.tipo }, JWT_SECRET, { expiresIn: "8h" });

        res.json({
            message: "Login bem-sucedido.",
            token,
            usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, tipo: usuario.tipo }
        });
    });
});

// 📌 Rota para obter dados do usuário autenticado
router.get("/me", verificarToken, (req, res) => {
    const sql = "SELECT id, nome, email, tipo FROM usuarios WHERE id = ?";
    db.query(sql, [req.usuarioId], (err, results) => {
        if (err) {
            console.error("Erro ao buscar usuário:", err);
            return res.status(500).json({ error: "Erro ao buscar usuário." });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: "Usuário não encontrado." });
        }
        res.json(results[0]);
    });
});

// 📌 Rota para atualizar perfil do usuário autenticado
router.put("/:id", verificarToken, (req, res) => {
    const { id } = req.params;
    const { nome, email, senha } = req.body;
    const usuarioId = req.usuarioId; // ID do usuário autenticado

    if (parseInt(id) !== usuarioId) {
        return res.status(403).json({ error: "Você só pode editar sua própria conta." });
    }

    let sql = "UPDATE usuarios SET nome = ?, email = ? WHERE id = ?";
    let values = [nome, email, id];

    // Se o usuário deseja alterar a senha, criptografa a nova senha
    if (senha) {
        bcrypt.hash(senha, 10, (err, hashedPassword) => {
            if (err) {
                console.error("Erro ao criptografar senha:", err);
                return res.status(500).json({ error: "Erro ao atualizar senha." });
            }

            sql = "UPDATE usuarios SET nome = ?, email = ?, senha = ? WHERE id = ?";
            values = [nome, email, hashedPassword, id];

            db.query(sql, values, (err, result) => {
                if (err) {
                    console.error("Erro ao atualizar usuário:", err);
                    return res.status(500).json({ error: "Erro ao atualizar usuário." });
                }
                res.json({ message: "Perfil atualizado com sucesso." });
            });
        });
    } else {
        db.query(sql, values, (err, result) => {
            if (err) {
                console.error("Erro ao atualizar usuário:", err);
                return res.status(500).json({ error: "Erro ao atualizar usuário." });
            }
            res.json({ message: "Perfil atualizado com sucesso." });
        });
    }
});

// 📌 Rota para listar todos os usuários (somente admin)
router.get("/", verificarToken, verificarAdmin, (req, res) => {
    const sql = "SELECT id, nome, email, tipo FROM usuarios";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Erro ao buscar usuários:", err);
            return res.status(500).json({ error: "Erro ao buscar usuários." });
        }
        res.json(results);
    });
});

// 📌 Rota para atualizar o tipo de um usuário (somente admin)
router.put("/:id/tipo", verificarToken, verificarAdmin, (req, res) => {
    const { id } = req.params;
    const { tipo } = req.body;

    const sql = "UPDATE usuarios SET tipo = ? WHERE id = ?";
    db.query(sql, [tipo, id], (err, result) => {
        if (err) {
            console.error("Erro ao atualizar usuário:", err);
            return res.status(500).json({ error: "Erro ao atualizar usuário." });
        }
        res.json({ message: "Tipo de usuário atualizado com sucesso." });
    });
});

module.exports = router;
