const express = require('express');
const db = require('../conexao');
const autenticar = require('../middlewares/autenticacao');
const { checkPerfil } = require('../middlewares/perfil');
const identificarTenant = require('../middlewares/tenant');

const router = express.Router();

// Middlewares aplicados a todas as rotas de métricas
router.use(autenticar);
router.use(identificarTenant);

router.get('/membros/metricas', checkPerfil(['admin', 'lider', 'pastor']), async (req, res) => {
  try {
    const igrejaId = req.igrejaId;

    // 1. KPIs gerais
    const kpisRes = await db.query(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'ativo') as ativos,
        COUNT(*) FILTER (WHERE status = 'inativo') as inativos,
        COUNT(*) FILTER (WHERE status = 'transferido') as transferidos,
        COUNT(*) FILTER (WHERE status = 'falecido') as falecidos,
        COUNT(*) FILTER (WHERE batizado = true AND status = 'ativo') as batizados,
        COUNT(*) FILTER (WHERE fez_discipulado = true AND status = 'ativo') as fez_discipulado
      FROM membros WHERE igreja_id = $1 AND status != 'excluido'`,
      [igrejaId]
    );

    // 2. Crescimento mensal (últimos 12 meses)
    const crescimentoRes = await db.query(
      `SELECT
        TO_CHAR(data_entrada, 'YYYY-MM') as mes,
        COUNT(*) as entradas
      FROM membros
      WHERE igreja_id = $1
        AND data_entrada >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY mes ORDER BY mes ASC`,
      [igrejaId]
    );

    // 3. Distribuição por gênero (ativos)
    const generoRes = await db.query(
      `SELECT COALESCE(genero, 'nao_informado') as genero, COUNT(*) as quantidade
      FROM membros WHERE igreja_id = $1 AND status = 'ativo'
      GROUP BY genero`,
      [igrejaId]
    );

    // 4. Distribuição por faixa etária (ativos)
    const faixaEtariaRes = await db.query(
      `SELECT faixa, quantidade FROM (
        SELECT
          CASE
            WHEN data_nascimento IS NULL THEN 'Não informado'
            WHEN EXTRACT(YEAR FROM AGE(data_nascimento)) < 18 THEN '0-17'
            WHEN EXTRACT(YEAR FROM AGE(data_nascimento)) BETWEEN 18 AND 24 THEN '18-24'
            WHEN EXTRACT(YEAR FROM AGE(data_nascimento)) BETWEEN 25 AND 34 THEN '25-34'
            WHEN EXTRACT(YEAR FROM AGE(data_nascimento)) BETWEEN 35 AND 44 THEN '35-44'
            WHEN EXTRACT(YEAR FROM AGE(data_nascimento)) BETWEEN 45 AND 54 THEN '45-54'
            WHEN EXTRACT(YEAR FROM AGE(data_nascimento)) BETWEEN 55 AND 64 THEN '55-64'
            ELSE '65+'
          END as faixa,
          COUNT(*) as quantidade,
          MIN(COALESCE(data_nascimento, '9999-01-01')) as sort_key
        FROM membros WHERE igreja_id = $1 AND status = 'ativo'
        GROUP BY faixa
      ) sub ORDER BY sort_key`,
      [igrejaId]
    );

    // 5. Distribuição por estado civil (ativos)
    const estadoCivilRes = await db.query(
      `SELECT COALESCE(estado_civil, 'nao_informado') as estado_civil, COUNT(*) as quantidade
      FROM membros WHERE igreja_id = $1 AND status = 'ativo'
      GROUP BY estado_civil`,
      [igrejaId]
    );

    // 6. Por ministério (ativos)
    const ministerioRes = await db.query(
      `SELECT mn.nome as ministerio, COUNT(mm.membro_id) as quantidade
      FROM ministerios mn
      LEFT JOIN membro_ministerios mm ON mn.id = mm.ministerio_id AND mm.ativo = true
      LEFT JOIN membros m ON mm.membro_id = m.id AND m.status = 'ativo'
      WHERE mn.igreja_id = $1 AND mn.ativo = true
      GROUP BY mn.id, mn.nome ORDER BY quantidade DESC`,
      [igrejaId]
    );

    // 7. Sem contato por período
    const semContatoRes = await db.query(
      `SELECT
        COUNT(*) FILTER (WHERE ultimo_contato < CURRENT_DATE - INTERVAL '30 days') as sem_contato_30,
        COUNT(*) FILTER (WHERE ultimo_contato < CURRENT_DATE - INTERVAL '60 days') as sem_contato_60,
        COUNT(*) FILTER (WHERE ultimo_contato < CURRENT_DATE - INTERVAL '90 days') as sem_contato_90
      FROM membros WHERE igreja_id = $1 AND status = 'ativo'`,
      [igrejaId]
    );

    // 8. Por cidade (top 10)
    const cidadeRes = await db.query(
      `SELECT COALESCE(cidade, 'Não informado') as cidade, COUNT(*) as quantidade
      FROM membros WHERE igreja_id = $1 AND status = 'ativo'
      GROUP BY cidade ORDER BY quantidade DESC LIMIT 10`,
      [igrejaId]
    );

    // 9. Aniversariantes do mês atual
    const aniversariantesRes = await db.query(
      `SELECT nome, telefone, data_nascimento,
        EXTRACT(YEAR FROM AGE(data_nascimento))::integer as idade
      FROM membros
      WHERE igreja_id = $1 AND status = 'ativo'
        AND data_nascimento IS NOT NULL
        AND EXTRACT(MONTH FROM data_nascimento) = EXTRACT(MONTH FROM CURRENT_DATE)
      ORDER BY EXTRACT(DAY FROM data_nascimento)`,
      [igrejaId]
    );

    // Formatar KPIs
    const kpisRow = kpisRes.rows[0] || {};
    const kpis = {
      ativos: parseInt(kpisRow.ativos || 0),
      inativos: parseInt(kpisRow.inativos || 0),
      transferidos: parseInt(kpisRow.transferidos || 0),
      falecidos: parseInt(kpisRow.falecidos || 0),
      batizados: parseInt(kpisRow.batizados || 0),
      fez_discipulado: parseInt(kpisRow.fez_discipulado || 0)
    };

    // Formatar Sem Contato
    const semContatoRow = semContatoRes.rows[0] || {};
    const sem_contato = {
      sem_contato_30: parseInt(semContatoRow.sem_contato_30 || 0),
      sem_contato_60: parseInt(semContatoRow.sem_contato_60 || 0),
      sem_contato_90: parseInt(semContatoRow.sem_contato_90 || 0)
    };

    return res.status(200).json({
      kpis,
      crescimento_mensal: crescimentoRes.rows.map(r => ({ mes: r.mes, entradas: parseInt(r.entradas) })),
      por_genero: generoRes.rows.map(r => ({ genero: r.genero, quantidade: parseInt(r.quantidade) })),
      por_faixa_etaria: faixaEtariaRes.rows.map(r => ({ faixa: r.faixa, quantidade: parseInt(r.quantidade) })),
      por_estado_civil: estadoCivilRes.rows.map(r => ({ estado_civil: r.estado_civil, quantidade: parseInt(r.quantidade) })),
      por_ministerio: ministerioRes.rows.map(r => ({ ministerio: r.ministerio, quantidade: parseInt(r.quantidade) })),
      sem_contato,
      por_cidade: cidadeRes.rows.map(r => ({ cidade: r.cidade, quantidade: parseInt(r.quantidade) })),
      aniversariantes_mes: aniversariantesRes.rows
    });

  } catch (err) {
    console.error('Erro ao buscar métricas de membros:', err);
    return res.status(500).json({ error: 'Erro interno ao buscar métricas de membros', detalhe: err.message });
  }
});

module.exports = router;
