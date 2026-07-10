const express = require('express');
const db = require('../conexao');
const autenticar = require('../middlewares/autenticacao');
const { checkPerfil } = require('../middlewares/perfil');
const identificarTenant = require('../middlewares/tenant');

const router = express.Router();

router.use(autenticar);
router.use(identificarTenant);

// GET /api/modulos - Listar módulos de discipulado
router.get('/', checkPerfil(['admin', 'lider', 'pastor', 'discipulador']), async (req, res) => {
  try {
    let queryText = 'SELECT * FROM modulos_discipulado';
    const params = [];

    if (req.igrejaId) {
      queryText += ' WHERE igreja_id = $1';
      params.push(req.igrejaId);
    }

    queryText += ' ORDER BY ordem ASC, nome ASC';

    const resultado = await db.query(queryText, params);
    return res.json(resultado.rows);
  } catch (err) {
    console.error('Erro ao listar módulos:', err);
    return res.status(500).json({ error: 'Erro interno ao listar módulos' });
  }
});

// GET /api/modulos/:id - Detalhes do módulo
router.get('/:id', checkPerfil(['admin', 'lider', 'pastor', 'discipulador']), async (req, res) => {
  const { id } = req.params;

  try {
    let queryText = 'SELECT * FROM modulos_discipulado WHERE id = $1';
    const params = [id];

    if (req.igrejaId) {
      queryText += ' AND igreja_id = $2';
      params.push(req.igrejaId);
    }

    const resultado = await db.query(queryText, params);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Módulo não encontrado nesta igreja' });
    }
    return res.json(resultado.rows[0]);
  } catch (err) {
    console.error('Erro ao obter módulo:', err);
    return res.status(500).json({ error: 'Erro interno ao obter módulo' });
  }
});

// POST /api/modulos - Criar módulo (Apenas admin e lider)
router.post('/', checkPerfil(['admin', 'lider']), async (req, res) => {
  const { nome, descricao, ordem, total_aulas } = req.body;

  if (!nome) {
    return res.status(400).json({ error: 'Nome é obrigatório' });
  }

  const novoModuloIgrejaId = req.usuarioPerfil === 'superadmin' ? (req.body.igreja_id || req.igrejaId) : req.igrejaId;

  if (!novoModuloIgrejaId) {
    return res.status(400).json({ error: 'É necessário selecionar uma igreja (tenant)' });
  }

  try {
    const resultado = await db.query(
      `INSERT INTO modulos_discipulado (igreja_id, nome, descricao, ordem, total_aulas) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [novoModuloIgrejaId, nome, descricao || null, ordem || 0, total_aulas || 0]
    );

    return res.status(201).json(resultado.rows[0]);
  } catch (err) {
    console.error('Erro ao criar módulo:', err);
    return res.status(500).json({ error: 'Erro interno ao criar módulo' });
  }
});

// PUT /api/modulos/:id - Editar módulo (Apenas admin e lider)
router.put('/:id', checkPerfil(['admin', 'lider']), async (req, res) => {
  const { id } = req.params;
  const { nome, descricao, ordem, total_aulas } = req.body;

  if (!nome) {
    return res.status(400).json({ error: 'Nome é obrigatório' });
  }

  try {
    let queryText = `
      UPDATE modulos_discipulado 
      SET nome = $1, descricao = $2, ordem = $3, total_aulas = $4 
      WHERE id = $5
    `;
    const valores = [nome, descricao || null, ordem || 0, total_aulas || 0, id];

    if (req.igrejaId) {
      queryText += ' AND igreja_id = $6';
      valores.push(req.igrejaId);
    }

    queryText += ' RETURNING *';

    const resultado = await db.query(queryText, valores);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Módulo não encontrado nesta igreja' });
    }

    return res.json(resultado.rows[0]);
  } catch (err) {
    console.error('Erro ao editar módulo:', err);
    return res.status(500).json({ error: 'Erro interno ao editar módulo' });
  }
});

// DELETE /api/modulos/:id - Excluir módulo (Apenas admin e lider)
router.delete('/:id', checkPerfil(['admin', 'lider']), async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar se existem grupos vinculados a este módulo
    let checkGruposQuery = 'SELECT id FROM grupos_discipulado WHERE modulo_id = $1';
    const checkParams = [id];

    if (req.igrejaId) {
      checkGruposQuery += ' AND igreja_id = $2';
      checkParams.push(req.igrejaId);
    }
    checkGruposQuery += ' LIMIT 1';

    const gruposVinculados = await db.query(checkGruposQuery, checkParams);
    if (gruposVinculados.rows.length > 0) {
      return res.status(400).json({ error: 'Não é possível excluir o módulo, pois existem grupos vinculados a ele' });
    }

    let queryText = 'DELETE FROM modulos_discipulado WHERE id = $1';
    const deleteParams = [id];

    if (req.igrejaId) {
      queryText += ' AND igreja_id = $2';
      deleteParams.push(req.igrejaId);
    }

    queryText += ' RETURNING id';

    const resultado = await db.query(queryText, deleteParams);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Módulo não encontrado nesta igreja' });
    }
    return res.json({ message: 'Módulo removido com sucesso', id });
  } catch (err) {
    console.error('Erro ao excluir módulo:', err);
    return res.status(500).json({ error: 'Erro interno ao excluir módulo' });
  }
});

module.exports = router;
