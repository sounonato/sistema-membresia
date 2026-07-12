const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const autenticacaoRotas = require('./rotas/autenticacao');
const igrejasRotas = require('./rotas/igrejas'); // Novo recurso de igrejas para superadmin
const convertidosRotas = require('./rotas/convertidos');
const discipuladoRotas = require('./rotas/discipulado');
const discipuladoresRotas = require('./rotas/discipuladores');
const modulosRotas = require('./rotas/modulos');
const painelRotas = require('./rotas/painel');
const portalRotas = require('./rotas/portal');
const publicoRotas = require('./rotas/publico');
const membrosRotas = require('./rotas/membros');
const ministeriosRotas = require('./rotas/ministerios');
const importacaoRotas = require('./rotas/importacao');
const membrosMetricasRotas = require('./rotas/membrosMetricas');
const autenticar = require('./middlewares/autenticacao');
const { solicitacoesPublico, solicitacoesAdmin } = require('./rotas/solicitacoes');

const app = express();
const PORT = process.env.PORT || 3031;

// Configuração do CORS
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:8080', 'http://localhost:5175'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(o => origin === o || origin.endsWith('.pages.dev') || origin.endsWith('.railway.app'))) {
      return callback(null, true);
    }
    callback(new Error('CORS não permitido'));
  },
  credentials: true,
}));

// Middleware para JSON
app.use(express.json());

// Rota de verificação de saúde da API
app.get('/health', (req, res) => {
  return res.json({ status: 'OK', timestamp: new Date() });
});

// Registro de Rotas com prefixo /api
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minuto
  max: 10,                   // máximo 10 tentativas
  message: { error: 'Muitas tentativas. Tente novamente em 1 minuto.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Aplicar antes da rota de autenticação:
app.use('/api/autenticacao/login', loginLimiter);
app.use('/api/auth/login', loginLimiter);

app.use('/api/auth', autenticacaoRotas);
app.use('/api/autenticacao', autenticacaoRotas);
app.use('/api/igrejas', igrejasRotas);
app.use('/api/convertidos', convertidosRotas);
app.use('/api/discipulado', discipuladoRotas);
app.use('/api/discipuladores', discipuladoresRotas);
app.use('/api/modulos', modulosRotas);
app.use('/api/dashboard', painelRotas);
app.use('/api/portal', portalRotas);
app.use('/api/publico', publicoRotas);
app.use('/api/publico', solicitacoesPublico);
app.use('/api/superadmin', autenticar, solicitacoesAdmin);
app.use('/api/membros', membrosRotas);
app.use('/api/ministerios', ministeriosRotas);
app.use('/api', importacaoRotas);
app.use('/api', membrosMetricasRotas);

// Servir arquivos estáticos do diretório de uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Job cron de follow-up WhatsApp
require('./jobs/followupWhatsapp');

// Middleware para tratamento de erros genéricos
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  return res.status(500).json({ error: 'Ocorreu um erro interno no servidor' });
});

// Inicialização do Servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando com sucesso na porta ${PORT}`);
});
