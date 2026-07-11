const express = require('express');
const db = require('../conexao');
const { checkPerfil } = require('../middlewares/perfil');
const bcrypt = require('bcrypt');

const publicRouter = express.Router();
const adminRouter = express.Router();

// 2.1 POST /api/publico/solicitacao-igreja
publicRouter.post('/solicitacao-igreja', async (req, res) => {
  const {
    nome,
    slug,
    responsavel_nome,
    responsavel_email,
    cidade,
    estado,
    responsavel_telefone,
    cargo_responsavel,
    plano,
    mensagem
  } = req.body;

  if (!nome || !slug || !responsavel_nome || !responsavel_email) {
    return res.status(400).json({ error: 'Os campos nome, slug, responsavel_nome e responsavel_email são obrigatórios.' });
  }

  // Sanitizar slug: lowercase, apenas letras, números e hífen
  const sanitizedSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, '');
  if (!sanitizedSlug) {
    return res.status(400).json({ error: 'O slug informado é inválido.' });
  }

  try {
    // Verificar se o slug já existe na tabela de igrejas
    const igrejaCheck = await db.query('SELECT id FROM igrejas WHERE LOWER(slug) = LOWER($1)', [sanitizedSlug]);
    if (igrejaCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Este slug de igreja já está em uso.' });
    }

    // Verificar se o slug já possui solicitação pendente
    const solicitacaoCheck = await db.query(
      "SELECT id FROM solicitacoes_igreja WHERE LOWER(slug) = LOWER($1) AND status = 'pendente'",
      [sanitizedSlug]
    );
    if (solicitacaoCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Este slug já possui uma solicitação de cadastro pendente.' });
    }

    // Inserir solicitação no banco
    await db.query(
      `INSERT INTO solicitacoes_igreja (
        nome, slug, cidade, estado, responsavel_nome, responsavel_email, responsavel_telefone, cargo_responsavel, plano, mensagem, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pendente')`,
      [
        nome.trim(),
        sanitizedSlug,
        cidade || null,
        estado || null,
        responsavel_nome.trim(),
        responsavel_email.trim().toLowerCase(),
        responsavel_telefone || null,
        cargo_responsavel || null,
        plano || 'basico',
        mensagem || null
      ]
    );

    return res.status(201).json({ mensagem: 'Solicitação recebida. Entraremos em contato em breve.' });
  } catch (err) {
    console.error('Erro ao enviar solicitação de cadastro de igreja:', err);
    return res.status(500).json({ error: 'Erro interno ao registrar solicitação.' });
  }
});

// 2.2 GET /api/superadmin/solicitacoes
adminRouter.get('/solicitacoes', checkPerfil(['superadmin']), async (req, res) => {
  const { status, limit = 10, offset = 0 } = req.query;
  const limitNum = parseInt(limit) || 10;
  const offsetNum = parseInt(offset) || 0;

  try {
    let queryText = 'SELECT * FROM solicitacoes_igreja';
    const params = [];

    if (status) {
      queryText += ' WHERE status = $1';
      params.push(status);
    }

    queryText += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limitNum, offsetNum);

    const resultado = await db.query(queryText, params);
    return res.json(resultado.rows);
  } catch (err) {
    console.error('Erro ao listar solicitações:', err);
    return res.status(500).json({ error: 'Erro interno ao listar solicitações.' });
  }
});

// 2.3 POST /api/superadmin/solicitacoes/:id/aprovar
adminRouter.post('/solicitacoes/:id/aprovar', checkPerfil(['superadmin']), async (req, res) => {
  const { id } = req.params;
  const client = await db.pool.connect();

  try {
    // Buscar a solicitação
    const solicitacaoRes = await client.query(
      "SELECT * FROM solicitacoes_igreja WHERE id = $1",
      [id]
    );

    if (solicitacaoRes.rows.length === 0) {
      return res.status(404).json({ error: 'Solicitação não encontrada.' });
    }

    const solicitacao = solicitacaoRes.rows[0];

    if (solicitacao.status !== 'pendente') {
      return res.status(400).json({ error: `Esta solicitação já foi ${solicitacao.status}.` });
    }

    // Gerar senha temporária de 8 caracteres e seu hash
    const senhaTemporaria = Math.random().toString(36).slice(-8);
    const senhaHash = await bcrypt.hash(senhaTemporaria, 10);

    await client.query('BEGIN');

    // Criar a igreja
    const igrejaRes = await client.query(
      `INSERT INTO igrejas (nome, slug, plano, cidade, estado, status, ativa)
       VALUES ($1, $2, $3, $4, $5, 'ativa', true)
       RETURNING *`,
      [
        solicitacao.nome,
        solicitacao.slug,
        solicitacao.plano,
        solicitacao.cidade,
        solicitacao.estado
      ]
    );

    const novaIgreja = igrejaRes.rows[0];

    // Criar o usuário administrador da igreja
    const usuarioRes = await client.query(
      `INSERT INTO usuarios (nome, email, senha_hash, perfil, igreja_id, ativo)
       VALUES ($1, $2, $3, 'admin', $4, true)
       RETURNING id, nome, email, perfil, igreja_id, ativo`,
      [
        solicitacao.responsavel_nome,
        solicitacao.responsavel_email,
        senhaHash,
        novaIgreja.id
      ]
    );

    const novoUsuario = usuarioRes.rows[0];

    // Atualizar status da solicitação
    await client.query(
      `UPDATE solicitacoes_igreja
       SET status = 'aprovada', updated_at = now()
       WHERE id = $1`,
      [id]
    );

    await client.query('COMMIT');

    return res.json({
      igreja: novaIgreja,
      usuario: novoUsuario,
      senha_temporaria: senhaTemporaria
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao aprovar solicitação:', err);
    return res.status(500).json({ error: 'Erro interno ao aprovar solicitação.' });
  } finally {
    client.release();
  }
});

// 2.4 POST /api/superadmin/solicitacoes/:id/rejeitar
adminRouter.post('/solicitacoes/:id/rejeitar', checkPerfil(['superadmin']), async (req, res) => {
  const { id } = req.params;
  const { motivo } = req.body;

  try {
    const solicitacaoRes = await db.query(
      "SELECT status FROM solicitacoes_igreja WHERE id = $1",
      [id]
    );

    if (solicitacaoRes.rows.length === 0) {
      return res.status(404).json({ error: 'Solicitação não encontrada.' });
    }

    const solicitacao = solicitacaoRes.rows[0];

    if (solicitacao.status !== 'pendente') {
      return res.status(400).json({ error: `Esta solicitação já foi ${solicitacao.status}.` });
    }

    await db.query(
      `UPDATE solicitacoes_igreja
       SET status = 'rejeitada', motivo_rejeicao = $2, updated_at = now()
       WHERE id = $1`,
      [id, motivo || null]
    );

    return res.json({ mensagem: 'Solicitação rejeitada' });
  } catch (err) {
    console.error('Erro ao rejeitar solicitação:', err);
    return res.status(500).json({ error: 'Erro interno ao rejeitar solicitação.' });
  }
});

module.exports = {
  solicitacoesPublico: publicRouter,
  solicitacoesAdmin: adminRouter
};
