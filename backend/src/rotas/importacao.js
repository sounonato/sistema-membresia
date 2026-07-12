const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const db = require('../conexao');
const autenticar = require('../middlewares/autenticacao');
const { checkPerfil } = require('../middlewares/perfil');
const identificarTenant = require('../middlewares/tenant');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Auxiliar para parsing de datas do Excel
function parseExcelDate(val) {
  if (!val) return null;
  
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  
  if (typeof val === 'number') {
    // Converte o número de data serial do Excel (dias desde 30/12/1899)
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  
  if (typeof val === 'string') {
    const clean = val.trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
      const [d, m, y] = clean.split('/');
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
      return clean.substring(0, 10);
    }
  }
  
  return null;
}

// Auxiliar para normalizar Gênero
function parseGenero(val) {
  if (!val) return null;
  const clean = String(val).trim().toLowerCase();
  if (clean.startsWith('fem')) return 'feminino';
  if (clean.startsWith('masc')) return 'masculino';
  return 'outro';
}

// Auxiliar para normalizar Estado Civil
function parseEstadoCivil(val) {
  if (!val) return null;
  const clean = String(val).trim().toLowerCase();
  if (clean.includes('casado')) return 'casado';
  if (clean.includes('solteiro')) return 'solteiro';
  if (clean.includes('divorciado')) return 'divorciado';
  if (clean.includes('viúvo') || clean.includes('viuvo')) return 'viuvo';
  if (clean.includes('união') || clean.includes('uniao') || clean.includes('estável') || clean.includes('estavel')) return 'uniao_estavel';
  return null;
}

// Auxiliar para normalizar Tipo de Entrada
function parseTipoEntrada(val) {
  if (!val) return null;
  const clean = String(val).trim().toLowerCase();
  if (clean.includes('batismo') || clean.includes('batizado')) return 'batismo';
  if (clean.includes('transferência') || clean.includes('transferencia')) return 'transferencia';
  if (clean.includes('aclamação') || clean.includes('aclamacao')) return 'aclamacao';
  if (clean.includes('reconciliação') || clean.includes('reconciliacao')) return 'reconciliacao';
  return null;
}

// Auxiliar para normalizar Status
function parseStatus(row) {
  const val = row['Status'] || row['Situação na igreja'];
  if (!val) return 'ativo';
  const clean = String(val).trim().toLowerCase();
  if (clean.includes('aprovad') || clean.includes('ativ')) return 'ativo';
  if (clean.includes('inativ')) return 'inativo';
  if (clean.includes('transferid')) return 'transferido';
  if (clean.includes('falecid') || clean.includes('mort')) return 'falecido';
  if (clean.includes('excluid')) return 'excluido';
  return 'ativo';
}

// Auxiliar para normalizar Batizado(a)?
function parseBatizado(val) {
  if (!val) return false;
  const clean = String(val).trim().toUpperCase();
  return clean === 'S' || clean === 'SIM' || clean === 'TRUE' || clean === '1';
}

// Endpoint de Importação
router.post('/membros/importar', autenticar, checkPerfil(['admin', 'lider']), identificarTenant, upload.single('arquivo'), async (req, res) => {
  try {
    const { sistema } = req.body;
    if (sistema !== 'inchurch') {
      return res.status(400).json({ error: 'Sistema de origem não suportado. Atualmente apenas "inchurch" é suportado.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }

    const igrejaId = req.igrejaId;
    if (!igrejaId) {
      return res.status(400).json({ error: 'Identificação da igreja é obrigatória.' });
    }

    // 1. Verificar limites do plano
    const planoResult = await db.query(
      `SELECT i.plano, COUNT(m.id) AS total
       FROM igrejas i
       LEFT JOIN membros m ON m.igreja_id = i.id AND m.status = 'ativo'
       WHERE i.id = $1
       GROUP BY i.plano`,
      [igrejaId]
    );

    if (planoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Igreja não encontrada.' });
    }

    const { plano, total } = planoResult.rows[0];
    const LIMITES = { basico: 100, pro: Infinity };
    const limiteMaximo = LIMITES[plano] ?? 100;
    let totalAtivos = parseInt(total);

    // 2. Ler planilha excel do buffer
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet);

    if (rows.length === 0) {
      return res.status(400).json({ error: 'A planilha enviada está vazia.' });
    }

    // 3. Obter membros existentes para deduplicação em memória
    const existingResult = await db.query(
      `SELECT nome, telefone FROM membros WHERE igreja_id = $1 AND status != 'excluido'`,
      [igrejaId]
    );
    const existing = new Set(
      existingResult.rows.map(r => `${(r.nome || '').trim().toLowerCase()}|${(r.telefone || '').trim().toLowerCase()}`)
    );

    let importados = 0;
    let ignorados = 0;
    const erros = [];

    // 4. Processar cada linha da planilha
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const linhaNum = i + 2; // Linha 1 são os cabeçalhos, logo primeira linha de dados é 2

      const nomeVal = row['Nome Completo'];
      if (!nomeVal) {
        erros.push({ linha: linhaNum, erro: 'Coluna "Nome Completo" está vazia.' });
        continue;
      }

      const nome = String(nomeVal).trim();
      const phoneVal = row['Celular/Telefone'] || row['Telefone'] || '';
      const telefone = String(phoneVal).trim();

      // Deduplicação
      const dupKey = `${nome.toLowerCase()}|${telefone.toLowerCase()}`;
      if (existing.has(dupKey)) {
        ignorados++;
        continue;
      }

      const email = row['E-mail'] ? String(row['E-mail']).trim() : null;
      const data_nascimento = parseExcelDate(row['Data de nascimento']);
      const genero = parseGenero(row['Gênero']);
      const estado_civil = parseEstadoCivil(row['Estado civil']);
      const profissao = row['Ocupação'] ? String(row['Ocupação']).trim() : null;

      // Endereço concatenado
      let endereco = '';
      if (row['Endereço']) {
        endereco += String(row['Endereço']).trim();
        if (row['Número']) {
          endereco += `, ${String(row['Número']).trim()}`;
        }
      }
      endereco = endereco.trim() || null;

      const bairro = row['Bairro'] ? String(row['Bairro']).trim() : null;
      const cidade = row['Cidade'] ? String(row['Cidade']).trim() : null;
      const estado = row['UF'] ? String(row['UF']).trim() : null;
      const cep = row['CEP'] ? String(row['CEP']).trim() : null;

      const entryDateVal = row['Data de entrada'] || row['Data de Criação'];
      const data_entrada = parseExcelDate(entryDateVal) || new Date().toISOString().substring(0, 10);

      const tipo_entrada = parseTipoEntrada(row['Forma de entrada']);
      const status = parseStatus(row);
      const batizado = parseBatizado(row['Batizado(a)?']);
      const data_batismo = parseExcelDate(row['Data de Batismo']);

      // Validar limites
      if (status === 'ativo') {
        if (totalAtivos >= limiteMaximo) {
          erros.push({
            linha: linhaNum,
            erro: `Limite de membros ativos (${limiteMaximo}) do plano ${plano} atingido. Não foi possível importar como ativo.`
          });
          continue;
        }
        totalAtivos++;
      }

      try {
        await db.query(
          `INSERT INTO membros (
            igreja_id, nome, telefone, email, data_nascimento, genero,
            estado_civil, profissao, endereco, bairro, cidade, estado,
            data_entrada, tipo_entrada, data_batismo, batizado, status, ultimo_contato
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, CURRENT_DATE
          )`,
          [
            igrejaId, nome, telefone, email, data_nascimento, genero,
            estado_civil, profissao, endereco, bairro, cidade, estado,
            data_entrada, tipo_entrada, data_batismo, batizado, status
          ]
        );

        existing.add(dupKey);
        importados++;
      } catch (err) {
        console.error(`Erro ao inserir membro na linha ${linhaNum}:`, err);
        erros.push({ linha: linhaNum, erro: `Erro de banco de dados: ${err.message || err}` });
      }
    }

    return res.status(200).json({
      importados,
      ignorados,
      erros
    });

  } catch (err) {
    console.error('Erro na rota de importação de membros:', err);
    return res.status(500).json({ error: 'Erro interno ao processar a importação de membros.' });
  }
});

module.exports = router;
