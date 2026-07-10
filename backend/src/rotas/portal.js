const express = require('express');
const db = require('../conexao');
const identificarTenant = require('../middlewares/tenant');

const router = express.Router();

// GET /api/portal/:slug/:email - Portal público do convertido filtrado por igreja (slug) e e-mail
router.get('/:slug/:email', identificarTenant, async (req, res) => {
  const { email } = req.params;

  if (!email) {
    return res.status(400).json({ error: 'E-mail é obrigatório' });
  }

  const igrejaId = req.igrejaId;

  if (!igrejaId) {
    return res.status(404).json({ error: 'Igreja não encontrada ou inativa' });
  }

  try {
    // Buscar convertido pelo e-mail e pela igreja_id resolvida
    const convertidoRes = await db.query(
      'SELECT id, nome, email, telefone, data_conversao, status, batizado FROM novos_convertidos WHERE LOWER(email) = LOWER($1) AND igreja_id = $2',
      [email, igrejaId]
    );

    if (convertidoRes.rows.length === 0) {
      return res.status(404).json({ error: 'Nenhum cadastro encontrado com este e-mail nesta igreja' });
    }

    const convertido = convertidoRes.rows[0];

    // Buscar informações de discipulado (grupo, módulo, discipulador) pertencentes à igreja
    const discipuladoRes = await db.query(
      `SELECT gd.id as grupo_id, gd.nome as grupo_nome, md.nome as modulo_nome, md.total_aulas, d.nome as discipulador_nome
       FROM grupo_membros gm
       JOIN grupos_discipulado gd ON gm.grupo_id = gd.id
       JOIN modulos_discipulado md ON gd.modulo_id = md.id
       LEFT JOIN discipuladores d ON gd.discipulador_id = d.id
       WHERE gm.convertido_id = $1 AND gm.igreja_id = $2`,
      [convertido.id, igrejaId]
    );

    let discipulado = null;
    let aulas = [];

    if (discipuladoRes.rows.length > 0) {
      discipulado = discipuladoRes.rows[0];

      // Buscar progresso das aulas do grupo da igreja
      const aulasRes = await db.query(
        'SELECT aula_numero, data_aula, concluida, observacoes FROM progresso_aulas WHERE grupo_id = $1 AND igreja_id = $2 ORDER BY aula_numero ASC',
        [discipulado.grupo_id, igrejaId]
      );
      aulas = aulasRes.rows;
    }

    return res.json({
      convertido,
      discipulado,
      aulas
    });
  } catch (err) {
    console.error('Erro no portal do convertido:', err);
    return res.status(500).json({ error: 'Erro interno ao carregar dados do portal' });
  }
});

module.exports = router;
