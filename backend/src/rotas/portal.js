const express = require('express');
const crypto = require('crypto');
const db = require('../conexao');
const autenticar = require('../middlewares/autenticacao');
const { checkPerfil } = require('../middlewares/perfil');
const identificarTenant = require('../middlewares/tenant');

const router = express.Router();

function gerarToken(igrejaId, email) {
  const segredo = process.env.PORTAL_SECRET;
  if (!segredo) return null;
  return crypto.createHmac('sha256', segredo)
    .update(`${igrejaId}:${email.trim().toLowerCase()}`)
    .digest('hex');
}

// Gera um link de portal para um convertido sem expor a informação por e-mail.
router.post('/link', autenticar, identificarTenant, checkPerfil(['admin', 'lider', 'pastor']), async (req, res) => {
  const { email } = req.body;
  if (!email || !req.igrejaId) return res.status(400).json({ error: 'E-mail e igreja são obrigatórios' });
  const token = gerarToken(req.igrejaId, email);
  if (!token) return res.status(503).json({ error: 'Portal indisponível: PORTAL_SECRET não configurado' });
  const igrejaRes = await db.query('SELECT slug FROM igrejas WHERE id = $1', [req.igrejaId]);
  const slug = igrejaRes.rows[0]?.slug;
  if (!slug) return res.status(404).json({ error: 'Igreja não encontrada' });
  const baseUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
  return res.json({ url: `${baseUrl}/portal/${slug}/${encodeURIComponent(email)}?token=${token}` });
});

// GET /api/portal/:slug/:email - Portal público do convertido filtrado por igreja (slug) e e-mail
router.get('/:slug/:email', identificarTenant, async (req, res) => {
  const { email } = req.params;
  const token = req.query.token;

  if (!email) {
    return res.status(400).json({ error: 'E-mail é obrigatório' });
  }

  const igrejaId = req.igrejaId;

  if (!igrejaId) {
    return res.status(404).json({ error: 'Igreja não encontrada ou inativa' });
  }

  const esperado = gerarToken(igrejaId, email);
  if (!esperado || typeof token !== 'string' || token.length !== esperado.length ||
      !crypto.timingSafeEqual(Buffer.from(token), Buffer.from(esperado))) {
    // Resposta indistinguível de cadastro inexistente reduz enumeração de dados pastorais.
    return res.status(404).json({ error: 'Portal não encontrado' });
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
