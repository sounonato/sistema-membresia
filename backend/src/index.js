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

const app = express();
const PORT = process.env.PORT || 3031;

// Configuração do CORS
app.use(cors());

// Middleware para JSON
app.use(express.json());

// Rota de verificação de saúde da API
app.get('/health', (req, res) => {
  return res.json({ status: 'OK', timestamp: new Date() });
});

// Registro de Rotas com prefixo /api
app.use('/api/auth', autenticacaoRotas);
app.use('/api/igrejas', igrejasRotas);
app.use('/api/convertidos', convertidosRotas);
app.use('/api/discipulado', discipuladoRotas);
app.use('/api/discipuladores', discipuladoresRotas);
app.use('/api/modulos', modulosRotas);
app.use('/api/dashboard', painelRotas);
app.use('/api/portal', portalRotas);
app.use('/api/publico', publicoRotas);
app.use('/api/membros', membrosRotas);
app.use('/api/ministerios', ministeriosRotas);

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
