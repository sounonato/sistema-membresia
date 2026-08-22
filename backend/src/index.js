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
  : ['http://localhost:8080', 'http://localhost:5175', 'http://localhost:8085'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
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
  return res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/ready', async (req, res) => {
  try {
    await require('./conexao').query('SELECT 1');
    return res.json({ status: 'ready', timestamp: new Date().toISOString() });
  } catch (err) {
    return res.status(503).json({ status: 'not_ready' });
  }
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

const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Muitas solicitações. Tente novamente em 1 minuto.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Aplicar antes da rota de autenticação:
app.use('/api/autenticacao/login', loginLimiter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/publico', publicLimiter);
app.use('/api/portal', publicLimiter);

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
app.use('/api', membrosMetricasRotas);
app.use('/api/membros', membrosRotas);
app.use('/api/ministerios', ministeriosRotas);
app.use('/api', importacaoRotas);

// Servir arquivos estáticos do diretório de uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Job cron de follow-up WhatsApp
require('./jobs/followupWhatsapp');

// Middleware para tratamento de erros genéricos
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  if (err && err.message === 'CORS não permitido') {
    return res.status(403).json({ error: 'Origem não permitida' });
  }
  return res.status(500).json({ error: 'Ocorreu um erro interno no servidor' });
});

// Auto-migration: executa arquivos .sql em migracoes/ em ordem ao subir
async function runMigrations() {
  const fs = require('fs');
  const path = require('path');
  const db = require('./conexao');
  const dir = path.join(__dirname, '../migracoes');
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.sql') && /^\d/.test(f))
    .sort();
  const client = await db.pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock(hashtext($1))', ['sistema-membresia:migrations']);
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    for (const file of files) {
      await client.query('BEGIN');
      try {
        const aplicada = await client.query('SELECT 1 FROM schema_migrations WHERE filename = $1', [file]);
        if (aplicada.rows.length > 0) {
          await client.query('COMMIT');
          continue;
        }
        const sql = fs.readFileSync(path.join(dir, file), 'utf8');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`Migration OK: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Migration FAILED (${file}): ${err.message}`);
      }
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock(hashtext($1))', ['sistema-membresia:migrations']).catch(() => {});
    client.release();
  }
}

// Inicialização do Servidor
runMigrations().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor rodando com sucesso na porta ${PORT}`);
  });
}).catch(err => {
  console.error('Erro nas migrations:', err);
  process.exitCode = 1;
});
