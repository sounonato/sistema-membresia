const express = require('express');
const db = require('../conexao');
const autenticar = require('../middlewares/autenticacao');
const { checkPerfil } = require('../middlewares/perfil');
const identificarTenant = require('../middlewares/tenant');

const router = express.Router();

router.use(autenticar);
router.use(identificarTenant);

// 8.1 GET /api/ministerios
router.get('/', checkPerfil(['admin', 'lider', 'pastor', 'discipulador']), async (req, res) => {
  try {
    const resultado = await db.query(
      `SELECT
        mn.id,
        mn.nome,
        mn.descricao,
        mn.ativo,
        mn.created_at,
        m.nome AS lider_nome,
        m.id AS lider_id,
        COUNT(mm.membro_id) FILTER (WHERE mm.ativo = true) AS total_membros
      FROM ministerios mn
      LEFT JOIN membros m ON mn.lider_id = m.id
      LEFT JOIN membro_ministerios mm ON mn.id = mm.ministerio_id
      WHERE mn.igreja_id = $1
      GROUP BY mn.id, m.id
      ORDER BY mn.ativo DESC, mn.nome ASC`,
      [req.igrejaId]
    );
    return res.json(resultado.rows);
  } catch (err) {
    console.error('Erro ao listar ministérios:', err);
    return res.status(500).json({ error: 'Erro interno ao listar ministérios' });
  }
});

// 8.2 GET /api/ministerios/:id
router.get('/:id', checkPerfil(['admin', 'lider', 'pastor', 'discipulador']), async (req, res) => {
  const { id } = req.params;
  try {
    const [minRes, membrosRes] = await Promise.all([
      db.query(
        `SELECT mn.*, m.nome AS lider_nome, m.id AS lider_id
         FROM ministerios mn
         LEFT JOIN membros m ON mn.lider_id = m.id
         WHERE mn.id = $1 AND mn.igreja_id = $2`,
        [id, req.igrejaId]
      ),
      db.query(
        `SELECT
          mm.id AS vinculo_id,
          mm.cargo,
          mm.data_entrada,
          mm.ativo,
          mb.id AS membro_id,
          mb.nome AS membro_nome,
          mb.telefone,
          mb.genero
        FROM membro_ministerios mm
        JOIN membros mb ON mm.membro_id = mb.id
        WHERE mm.ministerio_id = $1 AND mb.status = 'ativo'
        ORDER BY mm.ativo DESC, mb.nome ASC`,
        [id]
      )
    ]);

    if (minRes.rows.length === 0) {
      return res.status(404).json({ error: 'Ministério não encontrado' });
    }

    const ministeriodet = minRes.rows[0];
    const membros = membrosRes.rows;
    const totalMembros = membros.filter(m => m.ativo).length;

    return res.json({
      ...ministeriodet,
      membros,
      total_membros: totalMembros
    });
  } catch (err) {
    console.error('Erro ao buscar detalhe do ministério:', err);
    return res.status(500).json({ error: 'Erro interno ao buscar detalhe do ministério' });
  }
});

// 8.3 POST /api/ministerios
router.post('/', checkPerfil(['admin', 'lider']), async (req, res) => {
  const { nome, descricao, lider_id } = req.body;

  if (!nome || !nome.trim()) {
    return res.status(400).json({ error: 'O nome do ministério é obrigatório' });
  }

  try {
    // Se lider_id for passado, verificar se é membro da mesma igreja
    if (lider_id) {
      const membroCheck = await db.query(
        'SELECT id FROM membros WHERE id = $1 AND igreja_id = $2',
        [lider_id, req.igrejaId]
      );
      if (membroCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Líder indicado não é um membro válido desta igreja' });
      }
    }

    const resultado = await db.query(
      `INSERT INTO ministerios (igreja_id, nome, descricao, lider_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.igrejaId, nome.trim(), descricao || null, lider_id || null]
    );

    return res.status(201).json(resultado.rows[0]);
  } catch (err) {
    console.error('Erro ao criar ministério:', err);
    return res.status(500).json({ error: 'Erro interno ao criar ministério' });
  }
});

// 8.4 PUT /api/ministerios/:id
router.put('/:id', checkPerfil(['admin', 'lider']), async (req, res) => {
  const { id } = req.params;
  const { nome, descricao, lider_id, ativo } = req.body;

  try {
    // Se lider_id for alterado, verificar se é membro da mesma igreja
    if (lider_id) {
      const membroCheck = await db.query(
        'SELECT id FROM membros WHERE id = $1 AND igreja_id = $2',
        [lider_id, req.igrejaId]
      );
      if (membroCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Líder indicado não é um membro válido desta igreja' });
      }
    }

    const resultado = await db.query(
      `UPDATE ministerios
       SET
         nome = COALESCE($3, nome),
         descricao = $4,
         lider_id = $5,
         ativo = COALESCE($6, ativo)
       WHERE id = $1 AND igreja_id = $2
       RETURNING *`,
      [id, req.igrejaId, nome || null, descricao === undefined ? null : descricao, lider_id === undefined ? null : lider_id, ativo === undefined ? null : ativo]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Ministério não encontrado' });
    }

    return res.json(resultado.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar ministério:', err);
    return res.status(500).json({ error: 'Erro interno ao atualizar ministério' });
  }
});

// 8.5 DELETE /api/ministerios/:id
router.delete('/:id', checkPerfil(['admin', 'lider']), async (req, res) => {
  const { id } = req.params;
  try {
    const resultado = await db.query(
      `UPDATE ministerios SET ativo = false WHERE id = $1 AND igreja_id = $2 RETURNING id`,
      [id, req.igrejaId]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Ministério não encontrado' });
    }

    return res.json({ message: 'Ministério desativado com sucesso' });
  } catch (err) {
    console.error('Erro ao excluir ministério:', err);
    return res.status(500).json({ error: 'Erro interno ao excluir ministério' });
  }
});

module.exports = router;
