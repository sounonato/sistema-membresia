const express = require('express');
const db = require('../conexao');

const router = express.Router();

// GET /api/publico/igrejas/:slug
router.get('/igrejas/:slug', async (req, res) => {
  const { slug } = req.params;

  if (!slug) {
    return res.status(400).json({ error: 'O slug da igreja é obrigatório' });
  }

  try {
    const resultado = await db.query(
      `SELECT id, nome, slug, cor_primaria, logo_url, descricao, cidade, estado 
       FROM igrejas 
       WHERE LOWER(slug) = LOWER($1) AND ativa = true`,
      [slug]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Igreja não encontrada' });
    }

    return res.json(resultado.rows[0]);
  } catch (err) {
    console.error('Erro ao buscar dados de branding da igreja:', err);
    return res.status(500).json({ error: 'Erro interno ao carregar dados da igreja' });
  }
});

// GET /api/publico/igrejas/:slug/grupos — grupos disponíveis para cadastro via QR
router.get('/igrejas/:slug/grupos', async (req, res) => {
  const { slug } = req.params;
  try {
    const igrejaRes = await db.query(
      `SELECT id FROM igrejas WHERE LOWER(slug) = LOWER($1) AND ativa = true`,
      [slug]
    );
    if (igrejaRes.rows.length === 0) {
      return res.status(404).json({ error: 'Igreja não encontrada' });
    }
    const igrejaId = igrejaRes.rows[0].id;
    const resultado = await db.query(
      `SELECT gd.id, gd.nome, d.nome as discipulador_nome, m.nome as modulo_nome
       FROM grupos_discipulado gd
       LEFT JOIN discipuladores d ON gd.discipulador_id = d.id
       LEFT JOIN modulos_discipulado m ON gd.modulo_id = m.id
       WHERE gd.igreja_id = $1 AND gd.status = 'ativo'
       ORDER BY gd.nome ASC`,
      [igrejaId]
    );
    return res.json(resultado.rows);
  } catch (err) {
    console.error('Erro ao buscar grupos públicos:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

// POST /api/publico/igrejas/:slug/cadastro — cadastro via QR público
router.post('/igrejas/:slug/cadastro', async (req, res) => {
  const { slug } = req.params;
  const {
    nome, telefone, email, data_nascimento,
    genero, estado_civil, profissao, tem_filhos,
    endereco, bairro, cidade,
    como_conheceu, batizado, quer_batismo,
    ja_frequentava_igreja, ja_fez_discipulado,
    pedido_oracao, grupo_id,
  } = req.body;

  if (!nome || !telefone) {
    return res.status(400).json({ error: 'Nome e telefone são obrigatórios' });
  }

  try {
    const igrejaRes = await db.query(
      `SELECT id FROM igrejas WHERE LOWER(slug) = LOWER($1) AND ativa = true`,
      [slug]
    );
    if (igrejaRes.rows.length === 0) {
      return res.status(404).json({ error: 'Igreja não encontrada' });
    }
    const igrejaId = igrejaRes.rows[0].id;

    const observacoes = pedido_oracao ? `Pedido de oração: ${pedido_oracao}` : null;

    const resultado = await db.query(
      `INSERT INTO novos_convertidos
         (nome, telefone, email, data_nascimento,
          genero, estado_civil, profissao, tem_filhos,
          endereco, bairro, cidade,
          como_conheceu, batizado, quer_batismo,
          ja_frequentava_igreja, ja_fez_discipulado,
          observacoes, data_conversao, igreja_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,CURRENT_DATE,$18)
       RETURNING id`,
      [
        nome, telefone, email ?? null, data_nascimento ?? null,
        genero ?? null, estado_civil ?? null, profissao ?? null, tem_filhos ?? false,
        endereco ?? null, bairro ?? null, cidade ?? null,
        como_conheceu ?? null, batizado ?? false, quer_batismo ?? false,
        ja_frequentava_igreja ?? false, ja_fez_discipulado ?? false,
        observacoes, igrejaId,
      ]
    );

    const convertidoId = resultado.rows[0].id;

    if (grupo_id) {
      await db.query(
        `INSERT INTO grupo_membros (grupo_id, convertido_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [grupo_id, convertidoId]
      );
    }

    return res.status(201).json({ id: convertidoId, message: 'Cadastro realizado com sucesso' });
  } catch (err) {
    console.error('Erro no cadastro público:', err);
    return res.status(500).json({ error: 'Erro interno ao registrar cadastro' });
  }
});

// GET /api/publico/igrejas/:slug/membros/cadastro — dados para formulário público de membro
router.get('/igrejas/:slug/membros/cadastro', async (req, res) => {
  const { slug } = req.params;
  try {
    const resultado = await db.query(
      `SELECT id, nome, slug, cor_primaria, logo_url, cidade, estado
       FROM igrejas WHERE LOWER(slug) = LOWER($1) AND ativa = true`,
      [slug]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Igreja não encontrada' });
    }
    return res.json(resultado.rows[0]);
  } catch (err) {
    console.error('Erro ao buscar dados da igreja para cadastro de membro:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

// POST /api/publico/igrejas/:slug/membros/cadastro — autocadastro público de membro
router.post('/igrejas/:slug/membros/cadastro', async (req, res) => {
  const { slug } = req.params;
  const { nome, telefone, email, data_nascimento, genero, endereco, tipo_entrada } = req.body;

  if (!nome || !nome.trim()) {
    return res.status(400).json({ error: 'O campo nome é obrigatório' });
  }
  if (!telefone || !telefone.trim()) {
    return res.status(400).json({ error: 'O campo telefone é obrigatório' });
  }

  try {
    const igrejaRes = await db.query(
      `SELECT id FROM igrejas WHERE LOWER(slug) = LOWER($1) AND ativa = true`,
      [slug]
    );
    if (igrejaRes.rows.length === 0) {
      return res.status(404).json({ error: 'Igreja não encontrada' });
    }
    const igrejaId = igrejaRes.rows[0].id;

    const resultado = await db.query(
      `INSERT INTO membros (
         igreja_id, nome, telefone, email, data_nascimento, genero,
         endereco, tipo_entrada, data_entrada, ultimo_contato, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE, CURRENT_DATE, 'ativo')
       RETURNING id, nome`,
      [
        igrejaId,
        nome.trim(),
        telefone.trim(),
        email ?? null,
        data_nascimento ?? null,
        genero ?? null,
        endereco ?? null,
        tipo_entrada ?? null
      ]
    );

    return res.status(201).json({
      id: resultado.rows[0].id,
      nome: resultado.rows[0].nome,
      mensagem: 'Bem-vindo à membresia!'
    });
  } catch (err) {
    console.error('Erro no cadastro público de membro:', err);
    return res.status(500).json({ error: 'Erro interno ao registrar cadastro' });
  }
});

module.exports = router;
