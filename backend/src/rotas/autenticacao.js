const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../conexao');
const autenticar = require('../middlewares/autenticacao');
const { checkPerfil } = require('../middlewares/perfil');
const identificarTenant = require('../middlewares/tenant');

const router = express.Router();

// POST /api/autenticacao/login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
  }

  try {
    let usuario;
    let igrejaNome = null;

    // Busca o usuário pelo email — funciona para qualquer igreja ou superadmin
    const resultado = await db.query(
      `SELECT u.*, i.nome as igreja_nome, i.slug as igreja_slug
       FROM usuarios u
       LEFT JOIN igrejas i ON u.igreja_id = i.id
       WHERE u.email = $1
       LIMIT 1`,
      [email]
    );
    usuario = resultado.rows[0];
    if (usuario) igrejaNome = usuario.igreja_nome;

    if (!usuario) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos' });
    }

    if (!usuario.ativo) {
      return res.status(403).json({ error: 'Usuário inativo. Contate o administrador.' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaValida) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos' });
    }

    // Gerar token contendo igreja_id no payload
    const token = jwt.sign(
      { 
        id: usuario.id, 
        perfil: usuario.perfil,
        igreja_id: usuario.igreja_id 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        igreja_id: usuario.igreja_id,
        igreja_nome: igrejaNome,
        igreja_slug: usuario.igreja_slug ?? null
      }
    });
  } catch (err) {
    console.error('Erro no login:', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// GET /api/autenticacao/me
router.get('/me', autenticar, async (req, res) => {
  try {
    const resultado = await db.query(
      `SELECT u.id, u.nome, u.email, u.perfil, u.ativo, u.igreja_id, u.created_at, i.nome as igreja_nome, i.slug as igreja_slug
       FROM usuarios u
       LEFT JOIN igrejas i ON u.igreja_id = i.id
       WHERE u.id = $1`,
      [req.usuarioId]
    );
    const usuario = resultado.rows[0];

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    return res.json(usuario);
  } catch (err) {
    console.error('Erro ao obter usuário logado:', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// POST /api/autenticacao/usuarios (admin / lider / superadmin)
router.post('/usuarios', autenticar, identificarTenant, checkPerfil(['admin', 'lider']), async (req, res) => {
  const { nome, email, senha, perfil } = req.body;

  if (!nome || !email || !senha || !perfil) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  const perfisValidos = ['superadmin', 'admin', 'lider', 'pastor', 'discipulador'];
  if (!perfisValidos.includes(perfil)) {
    return res.status(400).json({ error: 'Perfil inválido' });
  }

  // Apenas superadmin pode criar outros superadmins
  if (perfil === 'superadmin' && req.usuarioPerfil !== 'superadmin') {
    return res.status(403).json({ error: 'Apenas superadmins podem criar usuários superadmin' });
  }

  // Determinar igreja_id do novo usuário
  const novoUsuarioIgrejaId = req.usuarioPerfil === 'superadmin' ? (req.body.igreja_id || null) : req.igrejaId;

  try {
    // Verificar se e-mail já existe nesta igreja (ou globalmente se for superadmin)
    let existe;
    if (novoUsuarioIgrejaId) {
      existe = await db.query('SELECT id FROM usuarios WHERE email = $1 AND igreja_id = $2', [email, novoUsuarioIgrejaId]);
    } else {
      existe = await db.query('SELECT id FROM usuarios WHERE email = $1 AND igreja_id IS NULL', [email]);
    }

    if (existe.rows.length > 0) {
      return res.status(400).json({ error: 'E-mail já cadastrado nesta igreja' });
    }

    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    const resultado = await db.query(
      `INSERT INTO usuarios (nome, email, senha_hash, perfil, igreja_id) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, nome, email, perfil, igreja_id, ativo, created_at`,
      [nome, email, senhaHash, perfil, novoUsuarioIgrejaId]
    );

    return res.status(201).json(resultado.rows[0]);
  } catch (err) {
    console.error('Erro ao criar usuário:', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// GET /api/autenticacao/usuarios (admin / lider / superadmin)
router.get('/usuarios', autenticar, identificarTenant, checkPerfil(['admin', 'lider']), async (req, res) => {
  try {
    let queryText = `
      SELECT u.id, u.nome, u.email, u.perfil, u.ativo, u.igreja_id, u.created_at, i.nome as igreja_nome 
      FROM usuarios u
      LEFT JOIN igrejas i ON u.igreja_id = i.id
    `;
    const params = [];

    // Se não for superadmin, filtra apenas os usuários da igreja ativa
    if (req.usuarioPerfil !== 'superadmin') {
      queryText += ' WHERE u.igreja_id = $1';
      params.push(req.igrejaId);
    } else {
      // Se for superadmin e passar igreja_id via query params, podemos filtrar
      const { igreja_id } = req.query;
      if (igreja_id) {
        queryText += ' WHERE u.igreja_id = $1';
        params.push(igreja_id);
      }
    }

    queryText += ' ORDER BY u.nome ASC';

    const resultado = await db.query(queryText, params);
    return res.json(resultado.rows);
  } catch (err) {
    console.error('Erro ao listar usuários:', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// PATCH /api/autenticacao/usuarios/:id/toggle (admin / lider / superadmin)
router.patch('/usuarios/:id/toggle', autenticar, identificarTenant, checkPerfil(['admin', 'lider']), async (req, res) => {
  const { id } = req.params;

  try {
    // Evitar que o próprio usuário se desative
    if (id === req.usuarioId) {
      return res.status(400).json({ error: 'Você não pode desativar a si mesmo' });
    }

    // Verificar se o usuário existe e obter seu igreja_id
    const usuarioRes = await db.query('SELECT ativo, igreja_id, perfil FROM usuarios WHERE id = $1', [id]);
    if (usuarioRes.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const usuarioAlvo = usuarioRes.rows[0];

    // Se não for superadmin, garantir que o usuário pertence à mesma igreja
    if (req.usuarioPerfil !== 'superadmin' && usuarioAlvo.igreja_id !== req.igrejaId) {
      return res.status(403).json({ error: 'Acesso negado: este usuário pertence a outra igreja' });
    }

    // Apenas superadmin pode desativar/ativar outro superadmin
    if (usuarioAlvo.perfil === 'superadmin' && req.usuarioPerfil !== 'superadmin') {
      return res.status(403).json({ error: 'Acesso negado: apenas superadmins podem gerenciar outros superadmins' });
    }

    const novoStatus = !usuarioAlvo.ativo;

    const resultado = await db.query(
      'UPDATE usuarios SET ativo = $1 WHERE id = $2 RETURNING id, nome, email, perfil, ativo',
      [novoStatus, id]
    );

    return res.json(resultado.rows[0]);
  } catch (err) {
    console.error('Erro ao alternar status do usuário:', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

module.exports = router;
