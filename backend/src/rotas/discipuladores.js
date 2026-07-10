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

module.exports = router;
