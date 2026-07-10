const db = require('../conexao');

/**
 * Middleware para verificar se o perfil do usuário está autorizado.
 * @param {string[]} perfisPermitidos - Lista de perfis permitidos para a rota
 */
const checkPerfil = (perfisPermitidos) => {
  return async (req, res, next) => {
    const { usuarioPerfil, usuarioId, igrejaId } = req;

    // 1. Se for superadmin, ele tem acesso livre a todas as rotas (bypass de perfil)
    if (usuarioPerfil === 'superadmin') {
      return next();
    }

    // 2. Se o perfil do usuário não estiver na lista de perfis permitidos
    if (!perfisPermitidos.includes(usuarioPerfil)) {
      // Se for pastor, ele pode ter acesso apenas leitura (GET) em rotas de visualização
      if (usuarioPerfil === 'pastor' && req.method === 'GET') {
        return next();
      }
      return res.status(403).json({ error: 'Acesso negado: perfil não autorizado' });
    }

    // 3. Se for discipulador, precisamos verificar se ele possui um cadastro ativo naquela igreja específica
    if (usuarioPerfil === 'discipulador') {
      try {
        const resultado = await db.query(
          'SELECT id FROM discipuladores WHERE usuario_id = $1 AND ativo = true AND igreja_id = $2',
          [usuarioId, igrejaId]
        );

        if (resultado.rows.length === 0) {
          return res.status(403).json({ error: 'Acesso negado: discipulador não encontrado ou inativo nesta igreja' });
        }

        // Vincula o id do discipulador na requisição para facilitar filtros futuros
        req.discipuladorId = resultado.rows[0].id;
      } catch (err) {
        console.error('Erro ao verificar discipulador:', err);
        return res.status(500).json({ error: 'Erro interno ao validar perfil de discipulador' });
      }
    }

    return next();
  };
};

module.exports = {
  checkPerfil
};
