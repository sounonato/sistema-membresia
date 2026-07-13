const express = require('express');
const db = require('../conexao');
const autenticar = require('../middlewares/autenticacao');
const { checkPerfil } = require('../middlewares/perfil');
const identificarTenant = require('../middlewares/tenant');

const router = express.Router();

router.use(autenticar);
router.use(identificarTenant);

// GET /api/discipuladores - Listar discipuladores
router.get('/', checkPerfil(['admin', 'lider', 'pastor', 'discipulador']), async (req, res) => {
  try {
    let queryText = `
      SELECT d.*, u.nome as usuario_nome, u.email as usuario_email 
      FROM discipuladores d 
      LEFT JOIN usuarios u ON d.usuario_id = u.id 
    `;
    const params = [];

    if (req.igrejaId) {
      queryText += ' WHERE d.igreja_id = $1';
      params.push(req.igrejaId);
    }

    queryText += ' ORDER BY d.nome ASC';

    const resultado = await db.query(queryText, params);
    return res.json(resultado.rows);
  } catch (err) {
    console.error('Erro ao listar discipuladores:', err);
    return res.status(500).json({ error: 'Erro interno ao listar discipuladores' });
  }
});

// GET /api/discipuladores/:id - Detalhes do discipulador
router.get('/:id', checkPerfil(['admin', 'lider', 'pastor', 'discipulador']), async (req, res) => {
  const { id } = req.params;

  try {
    let queryText = `
      SELECT d.*, u.nome as usuario_nome, u.email as usuario_email 
      FROM discipuladores d 
      LEFT JOIN usuarios u ON d.usuario_id = u.id 
      WHERE d.id = $1
    `;
    const params = [id];

    if (req.igrejaId) {
      queryText += ' AND d.igreja_id = $2';
      params.push(req.igrejaId);
    }

    const resultado = await db.query(queryText, params);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Discipulador não encontrado nesta igreja' });
    }

    return res.json(resultado.rows[0]);
  } catch (err) {
    console.error('Erro ao obter discipulador:', err);
    return res.status(500).json({ error: 'Erro interno ao obter discipulador' });
  }
});

// POST /api/discipuladores - Criar discipulador (Apenas admin e lider)
router.post('/', checkPerfil(['admin', 'lider']), async (req, res) => {
  const { nome, telefone, email, usuario_id, ativo } = req.body;

  if (!nome) {
    return res.status(400).json({ error: 'Nome é obrigatório' });
  }

  const novoDiscipuladorIgrejaId = req.usuarioPerfil === 'superadmin' ? (req.body.igreja_id || req.igrejaId) : req.igrejaId;

  if (!novoDiscipuladorIgrejaId) {
    return res.status(400).json({ error: 'É necessário selecionar uma igreja (tenant)' });
  }

  try {
    // Se passar usuario_id, validar se ele pertence à mesma igreja
    if (usuario_id) {
      const usuarioValido = await db.query('SELECT 1 FROM usuarios WHERE id = $1 AND igreja_id = $2', [usuario_id, novoDiscipuladorIgrejaId]);
      if (usuarioValido.rows.length === 0) {
        return res.status(400).json({ error: 'Usuário fornecido é inválido para esta igreja' });
      }
    }

    const resultado = await db.query(
      `INSERT INTO discipuladores (igreja_id, nome, telefone, email, usuario_id, ativo) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [novoDiscipuladorIgrejaId, nome, telefone || null, email || null, usuario_id || null, ativo === undefined ? true : ativo]
    );

    return res.status(201).json(resultado.rows[0]);
  } catch (err) {
    console.error('Erro ao criar discipulador:', err);
    return res.status(500).json({ error: 'Erro interno ao criar discipulador' });
  }
});

// PUT /api/discipuladores/:id - Editar discipulador (Apenas admin e lider)
router.put('/:id', checkPerfil(['admin', 'lider']), async (req, res) => {
  const { id } = req.params;
  const { nome, telefone, email, usuario_id, ativo } = req.body;

  if (!nome) {
    return res.status(400).json({ error: 'Nome é obrigatório' });
  }

  try {
    // Se passar usuario_id, validar se ele pertence à mesma igreja
    if (usuario_id && req.igrejaId) {
      const usuarioValido = await db.query('SELECT 1 FROM usuarios WHERE id = $1 AND igreja_id = $2', [usuario_id, req.igrejaId]);
      if (usuarioValido.rows.length === 0) {
        return res.status(400).json({ error: 'Usuário fornecido é inválido para esta igreja' });
      }
    }

    let queryText = `
      UPDATE discipuladores 
      SET nome = $1, telefone = $2, email = $3, usuario_id = $4, ativo = $5 
      WHERE id = $6
    `;
    const valores = [nome, telefone || null, email || null, usuario_id || null, ativo === undefined ? true : ativo, id];

    if (req.igrejaId) {
      queryText += ' AND igreja_id = $7';
      valores.push(req.igrejaId);
    }

    queryText += ' RETURNING *';

    const resultado = await db.query(queryText, valores);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Discipulador não encontrado nesta igreja' });
    }

    return res.json(resultado.rows[0]);
  } catch (err) {
    console.error('Erro ao editar discipulador:', err);
    return res.status(500).json({ error: 'Erro interno ao editar discipulador' });
  }
});

// DELETE /api/discipuladores/:id - Excluir discipulador (Apenas admin e lider)
router.delete('/:id', checkPerfil(['admin', 'lider']), async (req, res) => {
  const { id } = req.params;

  try {
    let queryText = 'DELETE FROM discipuladores WHERE id = $1';
    const params = [id];

    if (req.igrejaId) {
      queryText += ' AND igreja_id = $2';
      params.push(req.igrejaId);
    }

    queryText += ' RETURNING id';

    const resultado = await db.query(queryText, params);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Discipulador não encontrado nesta igreja' });
    }
    return res.json({ message: 'Discipulador removido com sucesso', id });
  } catch (err) {
    console.error('Erro ao excluir discipulador:', err);
    return res.status(500).json({ error: 'Erro interno ao excluir discipulador' });
  }
});

// POST /api/discipuladores/:id/acesso — Criar login para discipulador (admin/lider)
router.post('/:id/acesso', checkPerfil(['admin', 'lider']), async (req, res) => {
  const { id } = req.params;
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  try {
    // Verificar se o discipulador existe na igreja
    const discResult = await db.query(
      'SELECT * FROM discipuladores WHERE id = $1 AND igreja_id = $2',
      [id, req.igrejaId]
    );
    if (discResult.rows.length === 0) {
      return res.status(404).json({ error: 'Discipulador não encontrado' });
    }
    const disc = discResult.rows[0];

    // Verificar se já tem conta
    if (disc.usuario_id) {
      return res.status(409).json({ error: 'Discipulador já possui uma conta de acesso' });
    }

    // Verificar se email já está em uso
    const emailCheck = await db.query(
      'SELECT id FROM usuarios WHERE email = $1 AND igreja_id = $2',
      [email, req.igrejaId]
    );
    if (emailCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Email já está em uso nesta igreja' });
    }

    const bcrypt = require('bcrypt');
    const senhaHash = await bcrypt.hash(senha, 10);

    // Criar usuário com perfil discipulador
    const usuarioResult = await db.query(
      `INSERT INTO usuarios (nome, email, senha_hash, perfil, igreja_id)
       VALUES ($1, $2, $3, 'discipulador', $4)
       RETURNING id, nome, email, perfil, ativo`,
      [disc.nome, email, senhaHash, req.igrejaId]
    );
    const usuario = usuarioResult.rows[0];

    // Vincular usuário ao discipulador
    await db.query(
      'UPDATE discipuladores SET usuario_id = $1 WHERE id = $2',
      [usuario.id, id]
    );

    return res.status(201).json({
      message: 'Acesso criado com sucesso',
      usuario: { id: usuario.id, email: usuario.email, perfil: usuario.perfil }
    });
  } catch (err) {
    console.error('Erro ao criar acesso do discipulador:', err);
    return res.status(500).json({ error: 'Erro interno ao criar acesso' });
  }
});

// DELETE /api/discipuladores/:id/acesso — Revogar login do discipulador (admin/lider)
router.delete('/:id/acesso', checkPerfil(['admin', 'lider']), async (req, res) => {
  const { id } = req.params;
  try {
    const discResult = await db.query(
      'SELECT usuario_id FROM discipuladores WHERE id = $1 AND igreja_id = $2',
      [id, req.igrejaId]
    );
    if (discResult.rows.length === 0) return res.status(404).json({ error: 'Discipulador não encontrado' });
    const { usuario_id } = discResult.rows[0];
    if (!usuario_id) return res.status(404).json({ error: 'Discipulador não possui acesso' });

    // Desativar a conta (não deleta)
    await db.query('UPDATE usuarios SET ativo = false WHERE id = $1', [usuario_id]);
    // Desvincular
    await db.query('UPDATE discipuladores SET usuario_id = NULL WHERE id = $1', [id]);

    return res.json({ message: 'Acesso revogado com sucesso' });
  } catch (err) {
    console.error('Erro ao revogar acesso:', err);
    return res.status(500).json({ error: 'Erro interno ao revogar acesso' });
  }
});

// GET /api/discipuladores/:id/convertidos — Convertidos de um discipulador (admin/lider/pastor/discipulador)
router.get('/:id/convertidos', checkPerfil(['admin', 'lider', 'pastor', 'discipulador']), async (req, res) => {
  const { id } = req.params;
  try {
    const resultado = await db.query(
      `SELECT DISTINCT nc.id, nc.nome, nc.telefone, nc.data_conversao, nc.status, nc.como_conheceu,
              gd.nome as grupo_nome, gd.id as grupo_id
       FROM novos_convertidos nc
       JOIN grupo_membros gm ON nc.id = gm.convertido_id
       JOIN grupos_discipulado gd ON gm.grupo_id = gd.id
       WHERE gd.discipulador_id = $1 AND nc.igreja_id = $2
       ORDER BY nc.nome ASC`,
      [id, req.igrejaId]
    );
    return res.json(resultado.rows);
  } catch (err) {
    console.error('Erro ao listar convertidos do discipulador:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = router;
