const db = require('../conexao');

/**
 * Middleware para verificar se o perfil do usuário está autorizado.
 * @param {string[]} perfisPermitidos - Lista de perfis permitidos para a rota
 */
const checkPerfil = (perfisPermitidos) => {
  return async (req, res, next) => {
    const { usuarioPerfil, usuarioId, igrejaId } = req;

    // O superadmin só acessa rotas que o declararam explicitamente.
    if (!perfisPermitidos.includes(usuarioPerfil)) {
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
