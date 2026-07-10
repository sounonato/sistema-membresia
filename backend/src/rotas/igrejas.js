const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../conexao');
const autenticar = require('../middlewares/autenticacao');
const { checkPerfil } = require('../middlewares/perfil');

const router = express.Router();

// Garantir que a pasta de uploads de logos existe
const uploadsDir = path.join(__dirname, '../../uploads/logos');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuração do multer para upload de logo
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.params.id}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // limite de 2MB
  fileFilter: (req, file, cb) => {
    const extsPermitidas = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!extsPermitidas.includes(ext)) {
      return cb(new Error('Apenas imagens (jpg, jpeg, png, webp) são permitidas'));
    }
    cb(null, true);
  }
});

// Todas as rotas neste arquivo exigem autenticação de superadmin
router.use(autenticar);
router.use(checkPerfil(['superadmin']));

// GET /api/igrejas - Listar todas as igrejas (apenas superadmin)
router.get('/', async (req, res) => {
  try {
    const resultado = await db.query('SELECT * FROM igrejas ORDER BY nome ASC');
    return res.json(resultado.rows);
  } catch (err) {
    console.error('Erro ao listar igrejas:', err);
    return res.status(500).json({ error: 'Erro interno ao listar igrejas' });
  }
});

// POST /api/igrejas - Criar nova igreja (apenas superadmin)
router.post('/', async (req, res) => {
  const { nome, slug, plano, ativa } = req.body;

  if (!nome || !slug) {
    return res.status(400).json({ error: 'Nome e slug são obrigatórios' });
  }

  // Sanitizar slug (letras minúsculas, sem espaços, apenas hífen)
  const slugSanitizado = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');

  try {
    // Verificar se slug já existe
    const existe = await db.query('SELECT id FROM igrejas WHERE slug = $1', [slugSanitizado]);
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: 'Slug já cadastrado para outra igreja' });
    }

    const resultado = await db.query(
      'INSERT INTO igrejas (nome, slug, plano, ativa) VALUES ($1, $2, $3, $4) RETURNING *',
      [nome, slugSanitizado, plano || 'gratuito', ativa === undefined ? true : ativa]
    );

    return res.status(201).json(resultado.rows[0]);
  } catch (err) {
    console.error('Erro ao criar igreja:', err);
    return res.status(500).json({ error: 'Erro interno ao criar igreja' });
  }
});

// PUT /api/igrejas/:id - Editar dados da igreja (apenas superadmin)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, slug, plano, ativa, cor_primaria, descricao, cidade, estado } = req.body;

  try {
    // Buscar a igreja existente
    const igrejaExistente = await db.query('SELECT * FROM igrejas WHERE id = $1', [id]);
    if (igrejaExistente.rows.length === 0) {
      return res.status(404).json({ error: 'Igreja não encontrada' });
    }

    const atual = igrejaExistente.rows[0];

    // Mesclar valores existentes com os fornecidos no body (todos opcionais)
    const novoNome = nome !== undefined ? nome : atual.nome;
    const novoSlug = slug !== undefined ? slug : atual.slug;
    const novoPlano = plano !== undefined ? plano : atual.plano;
    const novaAtiva = ativa !== undefined ? ativa : atual.ativa;
    const novaCor = cor_primaria !== undefined ? cor_primaria : atual.cor_primaria;
    const novaDescricao = descricao !== undefined ? descricao : atual.descricao;
    const novaCidade = cidade !== undefined ? cidade : atual.cidade;
    const novoEstado = estado !== undefined ? estado : atual.estado;

    if (!novoNome || !novoSlug) {
      return res.status(400).json({ error: 'Nome e slug não podem ficar vazios' });
    }

    const slugSanitizado = novoSlug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');

    // Verificar se o novo slug já é usado por outra igreja
    const existe = await db.query('SELECT id FROM igrejas WHERE slug = $1 AND id <> $2', [slugSanitizado, id]);
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: 'Slug já cadastrado para outra igreja' });
    }

    const resultado = await db.query(
      `UPDATE igrejas 
       SET nome = $1, slug = $2, plano = $3, ativa = $4, cor_primaria = $5, descricao = $6, cidade = $7, estado = $8 
       WHERE id = $9 
       RETURNING *`,
      [novoNome, slugSanitizado, novoPlano, novaAtiva, novaCor, novaDescricao, novaCidade, novoEstado, id]
    );

    return res.json(resultado.rows[0]);
  } catch (err) {
    console.error('Erro ao editar igreja:', err);
    return res.status(500).json({ error: 'Erro interno ao editar igreja' });
  }
});

// PATCH /api/igrejas/:id/alternar - Ativar/Desativar igreja (apenas superadmin)
router.patch('/:id/alternar', async (req, res) => {
  const { id } = req.params;

  try {
    const igrejaRes = await db.query('SELECT ativa FROM igrejas WHERE id = $1', [id]);
    if (igrejaRes.rows.length === 0) {
      return res.status(404).json({ error: 'Igreja não encontrada' });
    }

    const novoStatus = !igrejaRes.rows[0].ativa;

    const resultado = await db.query(
      'UPDATE igrejas SET ativa = $1 WHERE id = $2 RETURNING *',
      [novoStatus, id]
    );

    return res.json(resultado.rows[0]);
  } catch (err) {
    console.error('Erro ao alternar status da igreja:', err);
    return res.status(500).json({ error: 'Erro interno ao alternar status da igreja' });
  }
});

// DELETE /api/igrejas/:id - Excluir igreja (apenas superadmin)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const resultado = await db.query('DELETE FROM igrejas WHERE id = $1 RETURNING id', [id]);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Igreja não encontrada' });
    }
    return res.json({ message: 'Igreja excluída com sucesso' });
  } catch (err) {
    console.error('Erro ao excluir igreja:', err);
    return res.status(500).json({ error: 'Erro interno ao excluir igreja' });
  }
});

// POST /api/igrejas/:id/admin - Criar usuário admin para a igreja (apenas superadmin)
router.post('/:id/admin', async (req, res) => {
  const { id } = req.params;
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
  }

  try {
    const igrejaRes = await db.query('SELECT id FROM igrejas WHERE id = $1', [id]);
    if (igrejaRes.rows.length === 0) {
      return res.status(404).json({ error: 'Igreja não encontrada' });
    }

    const bcrypt = require('bcrypt');
    const senhaHash = await bcrypt.hash(senha, 10);

    const existe = await db.query('SELECT id FROM usuarios WHERE email = $1 AND igreja_id = $2', [email, id]);
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: 'Usuário com este email já existe nesta igreja' });
    }

    const resultado = await db.query(
      `INSERT INTO usuarios (nome, email, senha_hash, perfil, igreja_id)
       VALUES ($1, $2, $3, 'admin', $4)
       RETURNING id, nome, email, perfil, ativo, created_at`,
      [nome, email, senhaHash, id]
    );

    return res.status(201).json(resultado.rows[0]);
  } catch (err) {
    console.error('Erro ao criar admin da igreja:', err);
    return res.status(500).json({ error: 'Erro interno ao criar admin' });
  }
});

// POST /api/igrejas/:id/logo - Upload de logo da igreja (apenas superadmin)
router.post('/:id/logo', (req, res, next) => {
  upload.single('logo')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }

  try {
    const ext = path.extname(req.file.originalname).toLowerCase();
    const logoUrl = `/uploads/logos/${id}${ext}`;

    const resultado = await db.query(
      'UPDATE igrejas SET logo_url = $1 WHERE id = $2 RETURNING logo_url',
      [logoUrl, id]
    );

    if (resultado.rows.length === 0) {
      // Remover o arquivo se a igreja não existir no banco
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ error: 'Igreja não encontrada' });
    }

    return res.json({ logo_url: logoUrl });
  } catch (err) {
    console.error('Erro ao atualizar logo no banco:', err);
    // Remover o arquivo em caso de erro no banco
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({ error: 'Erro interno ao salvar logo' });
  }
});

module.exports = router;
