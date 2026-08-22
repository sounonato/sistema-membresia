const jwt = require('jsonwebtoken');
const db = require('../conexao');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const partes = authHeader.split(' ');

  if (partes.length !== 2) {
    return res.status(401).json({ error: 'Erro no token' });
  }

  const [esquema, token] = partes;

  if (!/^Bearer$/i.test(esquema)) {
    return res.status(401).json({ error: 'Token malformatado' });
  }

  try {
    const decodificado = jwt.verify(token, process.env.JWT_SECRET);
    const resultado = await db.query(
      `SELECT u.id, u.perfil, u.igreja_id, u.ativo, u.deve_trocar_senha, i.ativa AS igreja_ativa
       FROM usuarios u
       LEFT JOIN igrejas i ON i.id = u.igreja_id
       WHERE u.id = $1`,
      [decodificado.id]
    );
    const usuario = resultado.rows[0];

    if (!usuario || !usuario.ativo || (usuario.igreja_id && usuario.igreja_ativa === false)) {
      return res.status(401).json({ error: 'Sessão inválida ou usuário inativo' });
    }

    // O banco é a fonte de verdade para perfil e tenant; o JWT só identifica a sessão.
    req.usuarioId = usuario.id;
    req.usuarioPerfil = usuario.perfil;
    req.usuarioIgrejaId = usuario.igreja_id;
    if (usuario.deve_trocar_senha && !req.path.endsWith('/me') && !req.path.endsWith('/trocar-senha')) {
      return res.status(403).json({ error: 'Troca de senha obrigatória antes de continuar' });
    }
    return next();
  } catch (err) {
    console.error('Erro ao validar sessão:', err.message);
    return res.status(err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError' ? 401 : 503)
      .json({ error: err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError' ? 'Token inválido ou expirado' : 'Serviço temporariamente indisponível' });
  }
};
