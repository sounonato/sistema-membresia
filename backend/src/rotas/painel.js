const express = require('express');
const autenticar = require('../middlewares/autenticacao');
const { checkPerfil } = require('../middlewares/perfil');
const identificarTenant = require('../middlewares/tenant');
const { obterEstatisticas } = require('../servicos/estatisticas');

const router = express.Router();

router.use(autenticar);
router.use(identificarTenant);

// GET /api/painel/stats
router.get('/stats', checkPerfil(['admin', 'lider', 'pastor', 'discipulador']), async (req, res) => {
  try {
    const dados = await obterEstatisticas(req.igrejaId, req.usuarioPerfil, req.discipuladorId);
    return res.json(dados);
  } catch (err) {
    console.error('Erro ao obter estatísticas do painel:', err);
    return res.status(500).json({ error: 'Erro interno ao carregar estatísticas do painel' });
  }
});

module.exports = router;
