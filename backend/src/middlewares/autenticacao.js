const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
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
    req.usuarioId = decodificado.id;
    req.usuarioPerfil = decodificado.perfil;
    req.usuarioIgrejaId = decodificado.igreja_id; // Novo campo para suportar multi-tenant
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};
