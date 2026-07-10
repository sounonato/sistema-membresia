const db = require('../conexao');

/**
 * Middleware para identificar e isolar o tenant (igreja_id) nas requisições.
 */
async function identificarTenant(req, res, next) {
  // 1. Se já passou pelo middleware de autenticação e temos os dados do token
  if (req.usuarioId) {
    if (req.usuarioPerfil === 'superadmin') {
      // Superadmin não é limitado a uma igreja específica por padrão, mas pode passar um header para filtrar
      const slugHeader = req.headers['x-tenant-slug'];
      if (slugHeader) {
        try {
          const resultado = await db.query('SELECT id, nome, ativa FROM igrejas WHERE slug = $1', [slugHeader]);
          if (resultado.rows.length > 0 && resultado.rows[0].ativa) {
            req.igrejaId = resultado.rows[0].id;
            req.igrejaNome = resultado.rows[0].nome;
          }
        } catch (err) {
          console.error('Erro ao buscar igreja para superadmin:', err);
        }
      } else {
        req.igrejaId = null;
      }
      return next();
    }

    // Para usuários normais, o igreja_id vem diretamente do token JWT
    req.igrejaId = req.usuarioIgrejaId;
    return next();
  }

  // 2. Para rotas públicas (login, portal público, etc.)
  // Procuramos o slug na URL (req.params.slug), no body (req.body.slug) ou no header (x-tenant-slug)
  const slug = req.params.slug || req.body.slug || req.headers['x-tenant-slug'];

  if (!slug) {
    // Sem slug, permitimos continuar. O login tratará como tentativa de superadmin.
    req.igrejaId = null;
    return next();
  }

  try {
    const resultado = await db.query('SELECT id, nome, ativa FROM igrejas WHERE slug = $1', [slug]);
    const igreja = resultado.rows[0];

    if (!igreja) {
      return res.status(404).json({ error: 'Igreja não encontrada' });
    }

    if (!igreja.ativa) {
      return res.status(403).json({ error: 'Esta igreja está inativa temporariamente' });
    }

    // Injeta o ID e Nome da igreja na requisição
    req.igrejaId = igreja.id;
    req.igrejaNome = igreja.nome;
    return next();
  } catch (err) {
    console.error('Erro ao identificar tenant pelo slug:', err);
    return res.status(500).json({ error: 'Erro interno ao identificar tenant' });
  }
}

module.exports = identificarTenant;
