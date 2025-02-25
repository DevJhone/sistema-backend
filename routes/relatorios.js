const express = require("express");
const db = require("../config/db");
const router = express.Router();
const PDFDocument = require("pdfkit");
const excel = require("exceljs");

// 📌 Função de formatação de datas
const formatDate = (date) => new Date(date).toLocaleDateString("pt-BR");

// 📌 Gerar relatório com filtros avançados
router.get("/", async (req, res) => {
    const { tipo, setor, dataInicio, dataFim, status, nome } = req.query;
    let sql = "";
    let params = [];

    if (tipo === "atendimentos") {
        sql = `SELECT a.id, p.nome AS produtor, a.tipo_servico, a.servidor_responsavel, a.data_atendimento, a.status 
               FROM atendimentos a 
               JOIN produtores p ON a.produtor_id = p.id
               WHERE 1=1`;
        if (dataInicio && dataFim) {
            sql += " AND a.data_atendimento BETWEEN ? AND ?";
            params.push(dataInicio, dataFim);
        }
        if (status) {
            sql += " AND a.status = ?";
            params.push(status);
        }
        if (nome) {
            sql += " AND p.nome LIKE ?";
            params.push(`%${nome}%`);
        }
    } else if (tipo === "almoxarifado") {
        sql = `SELECT e.id, i.nome AS item, e.nome_usuario, e.data_emprestimo, e.data_devolucao, e.status 
               FROM emprestimos e
               JOIN itens_almoxarifado i ON e.item_id = i.id
               WHERE 1=1`;
        if (nome) {
            sql += " AND e.nome_usuario LIKE ?";
            params.push(`%${nome}%`);
        }
    }

    db.query(sql, params, (err, result) => {
        if (err) {
            console.error("❌ Erro ao buscar relatório:", err);
            return res.status(500).json({ error: "Erro ao buscar relatório." });
        }
        res.json(result);
    });
});

// 📌 Exportação para PDF
router.get("/pdf", (req, res) => {
    const { tipo } = req.query;
    let sql = `SELECT * FROM ${tipo}`;

    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: "Erro ao gerar PDF." });

        const doc = new PDFDocument({ size: "A4", layout: "landscape" });
        res.setHeader("Content-Disposition", "attachment; filename=relatorio.pdf");
        res.setHeader("Content-Type", "application/pdf");
        doc.pipe(res);

        doc.fontSize(16).text("Relatório Completo", { align: "center" }).moveDown();
        result.forEach((row) => {
            doc.fontSize(12).text(Object.values(row).join(" | "));
        });

        doc.end();
    });
});

// 📌 Exportação para Excel
router.get("/excel", async (req, res) => {
    const { tipo } = req.query;
    let sql = `SELECT * FROM ${tipo}`;

    db.query(sql, async (err, result) => {
        if (err) return res.status(500).json({ error: "Erro ao gerar Excel." });

        const workbook = new excel.Workbook();
        const worksheet = workbook.addWorksheet("Relatório");
        worksheet.columns = Object.keys(result[0]).map((key) => ({ header: key.toUpperCase(), key, width: 20 }));
        result.forEach((row) => worksheet.addRow(row));

        res.setHeader("Content-Disposition", "attachment; filename=relatorio.xlsx");
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        await workbook.xlsx.write(res);
        res.end();
    });
});

module.exports = router;
