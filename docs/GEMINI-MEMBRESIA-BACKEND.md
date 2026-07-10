# Prompt para o Gemini — Módulo Membresia (Backend)

> Cole este prompt completo no Gemini. Ele contém tudo que você precisa saber sobre o projeto existente e o que deve ser criado. Não assuma nada fora do que está aqui documentado.

---

## 1. CONTEXTO GERAL DO PROJETO

Este é o backend do **Sistema de Membresia da Igreja do Nazareno**. Ele já está funcionando na porta **3031** com Node.js + Express + PostgreSQL.

O que você vai fazer: **adicionar o módulo de Membresia** ao backend existente, sem remover nada do que já existe.

---

## 2. ESTRUTURA DE ARQUIVOS ATUAL (completa)

```
backend/
├── src/
│   ├── index.js                     ← entry point — VOCÊ VAI MODIFICAR
│   ├── conexao.js                   ← pool PostgreSQL — NÃO MODIFICAR
│   ├── middlewares/
│   │   ├── autenticacao.js          ← verifica JWT — NÃO MODIFICAR
│   │   ├── tenant.js                ← injeta req.igrejaId — NÃO MODIFICAR
│   │   └── perfil.js                ← checkPerfil() — NÃO MODIFICAR
│   ├── rotas/
│   │   ├── autenticacao.js          ← NÃO MODIFICAR
│   │   ├── igrejas.js               ← NÃO MODIFICAR
│   │   ├── convertidos.js           ← NÃO MODIFICAR
│   │   ├── discipulado.js           ← NÃO MODIFICAR
│   │   ├── discipuladores.js        ← NÃO MODIFICAR
│   │   ├── modulos.js               ← NÃO MODIFICAR
│   │   ├── painel.js                ← NÃO MODIFICAR
│   │   ├── portal.js                ← NÃO MODIFICAR
│   │   └── publico.js               ← VOCÊ VAI ADICIONAR ROTAS (sem remover as existentes)
│   └── servicos/
│       └── estatisticas.js          ← NÃO MODIFICAR
├── migracoes/
│   ├── 001_esquema.sql
│   ├── 002_migracao_supabase.sql
│   └── 003_branding_igrejas.sql
├── .env                             ← VOCÊ VAI ADICIONAR VARIÁVEIS
└── package.json                     ← VOCÊ VAI ADICIONAR DEPENDÊNCIAS
```

**Arquivos novos que você vai criar:**
```
backend/
├── src/
│   ├── rotas/
│   │   ├── membros.js               ← CRIAR
│   │   └── ministerios.js           ← CRIAR
│   └── jobs/
│       └── followupWhatsapp.js      ← CRIAR
└── migracoes/
    └── 004_membresia.sql            ← CRIAR
```

---

## 3. BANCO DE DADOS EXISTENTE

- **Nome do banco:** `membresia`
- **URL:** `postgresql://postgres:postgres@localhost:5432/membresia`
- **Tabelas já existentes (não recriar):**

```sql
-- igrejas (tem: id UUID, nome, slug, cor_primaria, logo_url, descricao, cidade, estado, ativa, plano, created_at)
-- usuarios (tem: id UUID, nome, email, senha_hash, perfil, igreja_id, ativo, created_at)
-- novos_convertidos (tem: id UUID, igreja_id, nome, telefone, email, data_conversao, data_nascimento, genero, batizado, status, created_at, ...)
-- discipuladores (tem: id UUID, igreja_id, nome, telefone, email, usuario_id, ativo, created_at)
-- modulos_discipulado (tem: id UUID, igreja_id, nome, descricao, ordem, total_aulas, created_at)
-- grupos_discipulado (tem: id UUID, igreja_id, nome, discipulador_id, modulo_id, data_inicio, status, created_at)
-- grupo_membros (tem: id UUID, igreja_id, grupo_id, convertido_id, created_at)
-- progresso_aulas (tem: id UUID, igreja_id, grupo_id, aula_numero, data_aula, concluida, observacoes, created_at)
```

---

## 4. COMO OS MIDDLEWARES FUNCIONAM (leia com atenção)

### `autenticar` — `src/middlewares/autenticacao.js`
Verifica o JWT no header `Authorization: Bearer <token>` e injeta:
- `req.usuarioId` — UUID do usuário logado
- `req.usuarioPerfil` — string: `'superadmin'`, `'admin'`, `'lider'`, `'pastor'` ou `'discipulador'`
- `req.usuarioIgrejaId` — UUID da igreja do usuário (pode ser null para superadmin)

### `identificarTenant` — `src/middlewares/tenant.js`
Injeta `req.igrejaId` a partir do token JWT (para usuários normais) ou do header `x-tenant-slug` (para superadmin). Para rotas que usam `autenticar + identificarTenant`, o `req.igrejaId` sempre estará disponível para usuários não-superadmin.

### `checkPerfil` — `src/middlewares/perfil.js`
Recebe um array de perfis permitidos. Regras:
- `superadmin` sempre passa (bypass total)
- `pastor` passa apenas em métodos `GET`
- `discipulador` injeta `req.discipuladorId` (id na tabela `discipuladores`) e só passa se tiver registro ativo nessa igreja

### Como usar nos routers:
```js
// No topo do arquivo de rota — aplica autenticar e tenant para TODAS as rotas do router:
router.use(autenticar);
router.use(identificarTenant);

// Por rota individual — aplica restrição de perfil:
router.get('/', checkPerfil(['admin', 'lider', 'pastor', 'discipulador']), async (req, res) => { ... });
router.post('/', checkPerfil(['admin', 'lider']), async (req, res) => { ... });
```

---

## 5. PADRÃO DE CÓDIGO DOS ARQUIVOS EXISTENTES

Todo arquivo de rota começa exatamente assim:
```js
const express = require('express');
const db = require('../conexao');
const autenticar = require('../middlewares/autenticacao');
const { checkPerfil } = require('../middlewares/perfil');
const identificarTenant = require('../middlewares/tenant');

const router = express.Router();

router.use(autenticar);
router.use(identificarTenant);
```

Padrão de erros:
```js
return res.status(400).json({ error: 'Mensagem descritiva do erro' });
return res.status(404).json({ error: 'Recurso não encontrado' });
return res.status(500).json({ error: 'Erro interno ao [operação]' });
```

Padrão de try/catch:
```js
try {
  // lógica
} catch (err) {
  console.error('Mensagem do erro:', err);
  return res.status(500).json({ error: 'Erro interno ao [operação]' });
}
```

Consultas ao banco com multi-tenant (SEMPRE filtrar por `igreja_id`):
```js
const resultado = await db.query(
  'SELECT * FROM tabela WHERE id = $1 AND igreja_id = $2',
  [id, req.igrejaId]
);
```

---

## 6. ARQUIVO: `migracoes/004_membresia.sql`

Crie este arquivo exatamente como está abaixo:

```sql
-- =========================================================
-- Migração 004 — Módulo Membresia
-- Data: 2026-07-10
-- =========================================================

-- Tabela principal: membros da igreja
CREATE TABLE IF NOT EXISTS membros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  igreja_id UUID NOT NULL REFERENCES igrejas(id) ON DELETE CASCADE,

  -- Vínculo com o pipeline de convertidos (opcional — nem todo membro veio pelo pipeline)
  convertido_id UUID REFERENCES novos_convertidos(id) ON DELETE SET NULL,

  -- Dados pessoais
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT,
  data_nascimento DATE,
  genero TEXT CHECK (genero IN ('masculino', 'feminino', 'outro')),
  estado_civil TEXT CHECK (estado_civil IN ('solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel')),
  profissao TEXT,

  -- Endereço
  endereco TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,

  -- Dados eclesiásticos
  data_entrada DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo_entrada TEXT CHECK (tipo_entrada IN ('batismo', 'transferencia', 'aclamacao', 'reconciliacao')),
  data_batismo DATE,
  batizado BOOLEAN DEFAULT false,
  fez_discipulado BOOLEAN DEFAULT false,

  -- Família
  conjuge_id UUID REFERENCES membros(id) ON DELETE SET NULL,
  nome_conjuge TEXT,           -- usado quando o cônjuge não é membro cadastrado
  tem_filhos BOOLEAN DEFAULT false,
  qtd_filhos INTEGER DEFAULT 0,

  -- Acompanhamento pastoral
  ultimo_contato DATE DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'ativo'
    CHECK (status IN ('ativo', 'inativo', 'transferido', 'falecido', 'excluido')),
  observacoes TEXT,

  -- Transferência (carta)
  carta_entrada_origem TEXT,   -- nome da igreja de origem (entrada por transferência)
  carta_saida_destino TEXT,    -- nome da igreja de destino (saída por transferência)
  data_saida DATE,
  motivo_saida TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ministérios da igreja
CREATE TABLE IF NOT EXISTS ministerios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  igreja_id UUID NOT NULL REFERENCES igrejas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  lider_id UUID REFERENCES membros(id) ON DELETE SET NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Relacionamento N:N entre membros e ministérios
CREATE TABLE IF NOT EXISTS membro_ministerios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membro_id UUID NOT NULL REFERENCES membros(id) ON DELETE CASCADE,
  ministerio_id UUID NOT NULL REFERENCES ministerios(id) ON DELETE CASCADE,
  cargo TEXT,                  -- ex: "Músico", "Líder de seção", "Tesoureiro"
  data_entrada DATE DEFAULT CURRENT_DATE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(membro_id, ministerio_id)
);

-- Cargos eclesiásticos formais do membro
CREATE TABLE IF NOT EXISTS cargos_membros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membro_id UUID NOT NULL REFERENCES membros(id) ON DELETE CASCADE,
  cargo TEXT NOT NULL,         -- ex: 'diacono', 'presbitero', 'pastor', 'evangelista', 'missionario'
  data_posse DATE,
  data_fim DATE,               -- preenchido quando o cargo é encerrado
  ativo BOOLEAN DEFAULT true,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Log de disparos WhatsApp (evita reenvio dentro do período)
CREATE TABLE IF NOT EXISTS whatsapp_followup_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membro_id UUID NOT NULL REFERENCES membros(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('ativo', 'inativo')),
  enviado_em TIMESTAMPTZ DEFAULT now(),
  sucesso BOOLEAN DEFAULT true,
  erro TEXT
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_membros_igreja_id ON membros(igreja_id);
CREATE INDEX IF NOT EXISTS idx_membros_status ON membros(status);
CREATE INDEX IF NOT EXISTS idx_membros_ultimo_contato ON membros(ultimo_contato);
CREATE INDEX IF NOT EXISTS idx_membros_convertido_id ON membros(convertido_id);
CREATE INDEX IF NOT EXISTS idx_ministerios_igreja_id ON ministerios(igreja_id);
CREATE INDEX IF NOT EXISTS idx_membro_ministerios_membro_id ON membro_ministerios(membro_id);
CREATE INDEX IF NOT EXISTS idx_membro_ministerios_ministerio_id ON membro_ministerios(ministerio_id);
CREATE INDEX IF NOT EXISTS idx_cargos_membros_membro_id ON cargos_membros(membro_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_log_membro_id ON whatsapp_followup_log(membro_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_log_enviado_em ON whatsapp_followup_log(enviado_em);
```

---

## 7. ARQUIVO: `src/rotas/membros.js` (criar do zero)

Este é o arquivo mais complexo. Implemente cada endpoint exatamente como descrito.

```js
const express = require('express');
const db = require('../conexao');
const autenticar = require('../middlewares/autenticacao');
const { checkPerfil } = require('../middlewares/perfil');
const identificarTenant = require('../middlewares/tenant');

const router = express.Router();

// Todos os endpoints de /api/membros requerem autenticação e tenant
router.use(autenticar);
router.use(identificarTenant);
```

### 7.1 GET /api/membros/stats
> **Atenção:** esta rota deve vir ANTES de `GET /api/membros/:id` para não conflitar com o parâmetro `:id`.

Retorna estatísticas de membresia da igreja.

```
Perfis permitidos: admin, lider, pastor, discipulador
```

Query SQL:
```sql
-- total geral
SELECT COUNT(*) as total FROM membros WHERE igreja_id = $1 AND status != 'excluido';

-- por status
SELECT status, COUNT(*) as quantidade FROM membros
WHERE igreja_id = $1 AND status != 'excluido'
GROUP BY status;

-- batizados
SELECT COUNT(*) as batizados FROM membros
WHERE igreja_id = $1 AND batizado = true AND status = 'ativo';

-- fez discipulado
SELECT COUNT(*) as fez_discipulado FROM membros
WHERE igreja_id = $1 AND fez_discipulado = true AND status = 'ativo';

-- por gênero
SELECT COALESCE(genero, 'nao_informado') as genero, COUNT(*) as quantidade
FROM membros WHERE igreja_id = $1 AND status = 'ativo'
GROUP BY genero;

-- por ministério
SELECT mn.nome as ministerio, COUNT(mm.membro_id) as quantidade
FROM ministerios mn
LEFT JOIN membro_ministerios mm ON mn.id = mm.ministerio_id AND mm.ativo = true
WHERE mn.igreja_id = $1 AND mn.ativo = true
GROUP BY mn.nome
ORDER BY quantidade DESC;

-- sem contato há mais de 60 dias
SELECT COUNT(*) as sem_contato_60 FROM membros
WHERE igreja_id = $1 AND status = 'ativo'
AND ultimo_contato < CURRENT_DATE - INTERVAL '60 days';

-- sem contato há mais de 90 dias
SELECT COUNT(*) as sem_contato_90 FROM membros
WHERE igreja_id = $1 AND status = 'ativo'
AND ultimo_contato < CURRENT_DATE - INTERVAL '90 days';
```

Resposta JSON:
```json
{
  "total": 0,
  "ativos": 0,
  "inativos": 0,
  "transferidos": 0,
  "batizados": 0,
  "fez_discipulado": 0,
  "por_genero": [{ "genero": "masculino", "quantidade": 0 }],
  "por_ministerio": [{ "ministerio": "Louvor", "quantidade": 0 }],
  "sem_contato_60": 0,
  "sem_contato_90": 0
}
```

---

### 7.2 GET /api/membros/sem-contato
> Também deve vir ANTES de `GET /api/membros/:id`.

Retorna membros com `ultimo_contato` maior que N dias atrás.

```
Perfis permitidos: admin, lider, pastor, discipulador
Query params: ?dias=60 (padrão: 60)
```

Query SQL:
```sql
SELECT
  m.id,
  m.nome,
  m.telefone,
  m.email,
  m.ultimo_contato,
  CURRENT_DATE - m.ultimo_contato AS dias_sem_contato,
  COALESCE(
    (
      SELECT STRING_AGG(mn.nome, ', ')
      FROM membro_ministerios mm
      JOIN ministerios mn ON mm.ministerio_id = mn.id
      WHERE mm.membro_id = m.id AND mm.ativo = true
    ),
    'Sem ministério'
  ) AS ministerios
FROM membros m
WHERE m.igreja_id = $1
  AND m.status = 'ativo'
  AND m.ultimo_contato < CURRENT_DATE - ($2 * INTERVAL '1 day')
ORDER BY m.ultimo_contato ASC
```

Parâmetros: `[req.igrejaId, dias]` onde `dias = parseInt(req.query.dias) || 60`

Resposta: array de objetos com os campos acima.

---

### 7.3 GET /api/membros
Lista de membros com filtros.

```
Perfis permitidos: admin, lider, pastor, discipulador
Query params:
  ?status=ativo          (default: não filtra por status, traz todos exceto 'excluido')
  ?busca=texto           (busca por nome ou telefone, case-insensitive)
  ?ministerio_id=uuid    (filtra por ministério)
  ?sem_ministerio=true   (filtra membros sem nenhum ministério ativo)
```

Query SQL base:
```sql
SELECT
  m.id,
  m.nome,
  m.telefone,
  m.email,
  m.data_nascimento,
  m.genero,
  m.status,
  m.data_entrada,
  m.tipo_entrada,
  m.batizado,
  m.fez_discipulado,
  m.ultimo_contato,
  CURRENT_DATE - m.ultimo_contato AS dias_sem_contato,
  COALESCE(
    (
      SELECT JSON_AGG(JSON_BUILD_OBJECT('id', mn.id, 'nome', mn.nome, 'cargo', mm.cargo))
      FROM membro_ministerios mm
      JOIN ministerios mn ON mm.ministerio_id = mn.id
      WHERE mm.membro_id = m.id AND mm.ativo = true
    ),
    '[]'::json
  ) AS ministerios
FROM membros m
WHERE m.igreja_id = $1 AND m.status != 'excluido'
```

Adicione condições dinamicamente conforme os query params:
- `?status=X`: `AND m.status = $N`
- `?busca=X`: `AND (m.nome ILIKE $N OR m.telefone ILIKE $N)` com valor `'%texto%'`
- `?ministerio_id=X`: `AND EXISTS (SELECT 1 FROM membro_ministerios mm WHERE mm.membro_id = m.id AND mm.ministerio_id = $N AND mm.ativo = true)`
- `?sem_ministerio=true`: `AND NOT EXISTS (SELECT 1 FROM membro_ministerios mm WHERE mm.membro_id = m.id AND mm.ativo = true)`

Ordenação: `ORDER BY m.nome ASC`

---

### 7.4 GET /api/membros/:id
Detalhe completo do membro.

```
Perfis permitidos: admin, lider, pastor, discipulador
```

Executa 4 queries em paralelo (`Promise.all`):

**Query 1 — dados do membro:**
```sql
SELECT
  m.*,
  c.nome AS conjuge_nome_cadastrado,  -- se conjuge_id preenchido
  nc.nome AS convertido_nome          -- se convertido_id preenchido
FROM membros m
LEFT JOIN membros c ON m.conjuge_id = c.id
LEFT JOIN novos_convertidos nc ON m.convertido_id = nc.id
WHERE m.id = $1 AND m.igreja_id = $2
```

**Query 2 — ministérios:**
```sql
SELECT
  mm.id,
  mm.cargo,
  mm.data_entrada,
  mm.ativo,
  mn.id AS ministerio_id,
  mn.nome AS ministerio_nome
FROM membro_ministerios mm
JOIN ministerios mn ON mm.ministerio_id = mn.id
WHERE mm.membro_id = $1
ORDER BY mm.ativo DESC, mn.nome ASC
```

**Query 3 — cargos eclesiásticos:**
```sql
SELECT * FROM cargos_membros
WHERE membro_id = $1
ORDER BY ativo DESC, data_posse DESC
```

**Query 4 — histórico de follow-up WhatsApp:**
```sql
SELECT tipo, enviado_em, sucesso
FROM whatsapp_followup_log
WHERE membro_id = $1
ORDER BY enviado_em DESC
LIMIT 10
```

Resposta: objeto membro com campos adicionais `ministerios: []`, `cargos: []`, `followup_historico: []`

Se não encontrar: `return res.status(404).json({ error: 'Membro não encontrado' });`

---

### 7.5 POST /api/membros
Cadastrar novo membro.

```
Perfis permitidos: admin, lider
```

Campos do body (todos opcionais exceto nome e telefone):
```
nome*           TEXT
telefone*       TEXT
email           TEXT
data_nascimento DATE (string 'YYYY-MM-DD')
genero          TEXT ('masculino'|'feminino'|'outro')
estado_civil    TEXT
profissao       TEXT
endereco        TEXT
bairro          TEXT
cidade          TEXT
estado          TEXT
data_entrada    DATE (default: CURRENT_DATE)
tipo_entrada    TEXT
data_batismo    DATE
batizado        BOOLEAN
fez_discipulado BOOLEAN
convertido_id   UUID (opcional — vínculo com novos_convertidos)
conjuge_id      UUID (opcional — vínculo com outro membro)
nome_conjuge    TEXT (se cônjuge não for membro)
tem_filhos      BOOLEAN
qtd_filhos      INTEGER
observacoes     TEXT
```

Validação:
```js
if (!nome || !telefone) {
  return res.status(400).json({ error: 'Nome e telefone são obrigatórios' });
}
```

INSERT:
```sql
INSERT INTO membros (
  igreja_id, convertido_id, nome, telefone, email, data_nascimento, genero,
  estado_civil, profissao, endereco, bairro, cidade, estado,
  data_entrada, tipo_entrada, data_batismo, batizado, fez_discipulado,
  conjuge_id, nome_conjuge, tem_filhos, qtd_filhos, observacoes,
  ultimo_contato, status
) VALUES (
  $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,
  CURRENT_DATE, 'ativo'
)
RETURNING *
```

Retorno: `res.status(201).json(resultado.rows[0])`

---

### 7.6 PUT /api/membros/:id
Atualizar membro.

```
Perfis permitidos: admin, lider
```

Campos do body: os mesmos do POST, todos opcionais. Inclui também:
```
status          TEXT ('ativo'|'inativo'|'transferido'|'falecido'|'excluido')
carta_saida_destino  TEXT
data_saida      DATE
motivo_saida    TEXT
carta_entrada_origem TEXT
```

UPDATE:
```sql
UPDATE membros SET
  nome = COALESCE($3, nome),
  telefone = COALESCE($4, telefone),
  email = $5,
  data_nascimento = $6,
  genero = $7,
  estado_civil = $8,
  profissao = $9,
  endereco = $10,
  bairro = $11,
  cidade = $12,
  estado = $13,
  data_entrada = COALESCE($14, data_entrada),
  tipo_entrada = $15,
  data_batismo = $16,
  batizado = COALESCE($17, batizado),
  fez_discipulado = COALESCE($18, fez_discipulado),
  conjuge_id = $19,
  nome_conjuge = $20,
  tem_filhos = COALESCE($21, tem_filhos),
  qtd_filhos = COALESCE($22, qtd_filhos),
  observacoes = $23,
  status = COALESCE($24, status),
  carta_saida_destino = $25,
  data_saida = $26,
  motivo_saida = $27,
  carta_entrada_origem = $28,
  updated_at = now()
WHERE id = $1 AND igreja_id = $2
RETURNING *
```

Se nenhuma linha afetada: `return res.status(404).json({ error: 'Membro não encontrado' });`

---

### 7.7 DELETE /api/membros/:id
Soft delete (não apaga do banco, apenas muda status).

```
Perfis permitidos: admin
```

```sql
UPDATE membros
SET status = 'excluido', updated_at = now()
WHERE id = $1 AND igreja_id = $2
RETURNING id
```

Se nenhuma linha afetada: `return res.status(404).json({ error: 'Membro não encontrado' });`
Retorno: `res.json({ message: 'Membro excluído com sucesso' })`

---

### 7.8 PATCH /api/membros/:id/vi-hoje
Registra presença pastoral (atualiza `ultimo_contato` para hoje).

```
Perfis permitidos: admin, lider, pastor, discipulador
```

```sql
UPDATE membros
SET ultimo_contato = CURRENT_DATE, updated_at = now()
WHERE id = $1 AND igreja_id = $2
RETURNING id, nome, ultimo_contato
```

Retorno: `res.json({ ...resultado.rows[0], message: 'Presença registrada!' })`

---

### 7.9 POST /api/membros/:id/ministerios
Vincular membro a um ministério.

```
Perfis permitidos: admin, lider
Body: { ministerio_id: UUID, cargo?: string }
```

Validação:
```js
if (!ministerio_id) {
  return res.status(400).json({ error: 'ministerio_id é obrigatório' });
}
```

Verifica que o ministério pertence à mesma igreja:
```sql
SELECT id FROM ministerios WHERE id = $1 AND igreja_id = $2 AND ativo = true
```

INSERT:
```sql
INSERT INTO membro_ministerios (membro_id, ministerio_id, cargo)
VALUES ($1, $2, $3)
ON CONFLICT (membro_id, ministerio_id)
DO UPDATE SET ativo = true, cargo = EXCLUDED.cargo, data_entrada = CURRENT_DATE
RETURNING *
```

---

### 7.10 DELETE /api/membros/:id/ministerios/:ministerioId
Desvincular membro de um ministério (soft: `ativo = false`).

```
Perfis permitidos: admin, lider
```

```sql
UPDATE membro_ministerios
SET ativo = false
WHERE membro_id = $1 AND ministerio_id = $2
RETURNING id
```

---

### 7.11 GET /api/membros/:id/cargos
Listar cargos eclesiásticos do membro.

```
Perfis permitidos: admin, lider, pastor, discipulador
```

```sql
SELECT * FROM cargos_membros WHERE membro_id = $1 ORDER BY ativo DESC, data_posse DESC
```

> Verificar que o membro pertence à `req.igrejaId` antes de retornar.

---

### 7.12 POST /api/membros/:id/cargos
Adicionar cargo eclesiástico.

```
Perfis permitidos: admin, lider
Body: { cargo: string, data_posse?: DATE, observacoes?: string }
```

```sql
INSERT INTO cargos_membros (membro_id, cargo, data_posse, observacoes)
VALUES ($1, $2, $3, $4)
RETURNING *
```

---

### 7.13 PATCH /api/membros/:id/cargos/:cargoId
Encerrar um cargo (data_fim + ativo = false).

```
Perfis permitidos: admin, lider
Body: { data_fim?: DATE, observacoes?: string }
```

```sql
UPDATE cargos_membros
SET ativo = false, data_fim = COALESCE($3, CURRENT_DATE), observacoes = COALESCE($4, observacoes)
WHERE id = $2 AND membro_id = $1
RETURNING *
```

---

### 7.14 POST /api/membros/:id/whatsapp
Disparo manual de mensagem WhatsApp de follow-up.

```
Perfis permitidos: admin, lider, pastor
```

**Lógica completa:**

```js
router.post('/:id/whatsapp', checkPerfil(['admin', 'lider', 'pastor']), async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Buscar o membro
    const membroRes = await db.query(
      'SELECT id, nome, telefone, ultimo_contato FROM membros WHERE id = $1 AND igreja_id = $2 AND status = \'ativo\'',
      [id, req.igrejaId]
    );

    if (membroRes.rows.length === 0) {
      return res.status(404).json({ error: 'Membro não encontrado ou inativo' });
    }

    const membro = membroRes.rows[0];

    // 2. Calcular dias desde o último contato
    const diasSemContato = membro.ultimo_contato
      ? Math.floor((Date.now() - new Date(membro.ultimo_contato).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    // 3. Selecionar template baseado nos dias sem contato
    const tipo = diasSemContato < 60 ? 'ativo' : 'inativo';

    const mensagens = {
      ativo: `Olá, ${membro.nome}! 😊\n\nPassando pra dar um oi e saber como você está.\n\nQue Deus continue te abençoando! 🙏\n— Igreja do Nazareno`,
      inativo: `Olá, ${membro.nome}! 😊\n\nA gente sente sua falta por aqui! 💛\n\nComo você está? Estamos com saudade e pensando em você.\n\nQue Deus te abençoe! 🙏\n— Igreja do Nazareno`,
    };

    const mensagemTexto = mensagens[tipo];

    // 4. Formatar número: remove tudo que não é dígito e adiciona prefixo internacional
    const telefoneFormatado = membro.telefone.replace(/\D/g, '');
    const numero = `55${telefoneFormatado}@s.whatsapp.net`;

    // 5. Verificar se Evolution API está configurada
    if (!process.env.EVOLUTION_API_URL || !process.env.EVOLUTION_INSTANCE) {
      // Registrar no log mesmo sem enviar (modo desenvolvimento)
      await db.query(
        `INSERT INTO whatsapp_followup_log (membro_id, tipo, sucesso, erro)
         VALUES ($1, $2, false, 'EVOLUTION_API não configurada')`,
        [id, tipo]
      );
      return res.json({
        sucesso: false,
        tipo,
        mensagem_enviada: mensagemTexto,
        aviso: 'EVOLUTION_API_URL ou EVOLUTION_INSTANCE não configurados no .env'
      });
    }

    // 6. Enviar via Evolution API
    const axios = require('axios');
    await axios.post(
      `${process.env.EVOLUTION_API_URL}/message/sendText/${process.env.EVOLUTION_INSTANCE}`,
      {
        number: numero,
        textMessage: { text: mensagemTexto }
      },
      {
        headers: { apikey: process.env.EVOLUTION_API_KEY || '' },
        timeout: 10000
      }
    );

    // 7. Registrar no log
    await db.query(
      `INSERT INTO whatsapp_followup_log (membro_id, tipo, sucesso) VALUES ($1, $2, true)`,
      [id, tipo]
    );

    return res.json({
      sucesso: true,
      tipo,
      mensagem_enviada: mensagemTexto,
      numero_destino: telefoneFormatado
    });

  } catch (err) {
    // Mesmo com erro, tentar registrar no log
    try {
      await db.query(
        `INSERT INTO whatsapp_followup_log (membro_id, tipo, sucesso, erro) VALUES ($1, $2, false, $3)`,
        [id, 'inativo', err.message]
      );
    } catch (_) {}

    console.error('Erro ao enviar WhatsApp:', err);
    return res.status(500).json({ error: 'Erro ao enviar mensagem WhatsApp', detalhe: err.message });
  }
});
```

---

No final do arquivo:
```js
module.exports = router;
```

---

## 8. ARQUIVO: `src/rotas/ministerios.js` (criar do zero)

```js
const express = require('express');
const db = require('../conexao');
const autenticar = require('../middlewares/autenticacao');
const { checkPerfil } = require('../middlewares/perfil');
const identificarTenant = require('../middlewares/tenant');

const router = express.Router();

router.use(autenticar);
router.use(identificarTenant);
```

### 8.1 GET /api/ministerios
Lista ministérios da igreja com contagem de membros.

```
Perfis permitidos: admin, lider, pastor, discipulador
```

```sql
SELECT
  mn.id,
  mn.nome,
  mn.descricao,
  mn.ativo,
  mn.created_at,
  m.nome AS lider_nome,
  m.id AS lider_id,
  COUNT(mm.membro_id) FILTER (WHERE mm.ativo = true) AS total_membros
FROM ministerios mn
LEFT JOIN membros m ON mn.lider_id = m.id
LEFT JOIN membro_ministerios mm ON mn.id = mm.ministerio_id
WHERE mn.igreja_id = $1
GROUP BY mn.id, m.id
ORDER BY mn.ativo DESC, mn.nome ASC
```

---

### 8.2 GET /api/ministerios/:id
Detalhe do ministério com lista completa de membros ativos.

```
Perfis permitidos: admin, lider, pastor, discipulador
```

Executa 2 queries em paralelo:

**Query 1 — ministério:**
```sql
SELECT mn.*, m.nome AS lider_nome, m.id AS lider_id
FROM ministerios mn
LEFT JOIN membros m ON mn.lider_id = m.id
WHERE mn.id = $1 AND mn.igreja_id = $2
```

**Query 2 — membros:**
```sql
SELECT
  mm.id AS vinculo_id,
  mm.cargo,
  mm.data_entrada,
  mm.ativo,
  mb.id AS membro_id,
  mb.nome AS membro_nome,
  mb.telefone,
  mb.genero
FROM membro_ministerios mm
JOIN membros mb ON mm.membro_id = mb.id
WHERE mm.ministerio_id = $1 AND mb.status = 'ativo'
ORDER BY mm.ativo DESC, mb.nome ASC
```

Resposta:
```json
{
  "id": "...",
  "nome": "Louvor",
  "descricao": "...",
  "ativo": true,
  "lider_id": "...",
  "lider_nome": "...",
  "membros": [...],
  "total_membros": 5
}
```

---

### 8.3 POST /api/ministerios
Criar ministério.

```
Perfis permitidos: admin, lider
Body: { nome*, descricao?, lider_id? }
```

```sql
INSERT INTO ministerios (igreja_id, nome, descricao, lider_id)
VALUES ($1, $2, $3, $4)
RETURNING *
```

---

### 8.4 PUT /api/ministerios/:id
Editar ministério.

```
Perfis permitidos: admin, lider
Body: { nome?, descricao?, lider_id?, ativo? }
```

```sql
UPDATE ministerios
SET
  nome = COALESCE($3, nome),
  descricao = $4,
  lider_id = $5,
  ativo = COALESCE($6, ativo)
WHERE id = $1 AND igreja_id = $2
RETURNING *
```

---

### 8.5 DELETE /api/ministerios/:id
Soft delete (ativo = false).

```
Perfis permitidos: admin, lider
```

```sql
UPDATE ministerios SET ativo = false WHERE id = $1 AND igreja_id = $2 RETURNING id
```

No final: `module.exports = router;`

---

## 9. ARQUIVO: `src/rotas/publico.js` — ADICIONAR ROTAS (não remover as existentes)

O arquivo atual já tem 3 rotas. **Adicione** estas 2 rotas **antes** do `module.exports = router;`:

### 9.1 GET /api/publico/igrejas/:slug/membros/cadastro
Retorna dados da igreja para exibir no formulário público de cadastro de membro.

```js
router.get('/igrejas/:slug/membros/cadastro', async (req, res) => {
  const { slug } = req.params;
  try {
    const resultado = await db.query(
      `SELECT id, nome, slug, cor_primaria, logo_url, cidade, estado
       FROM igrejas WHERE LOWER(slug) = LOWER($1) AND ativa = true`,
      [slug]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Igreja não encontrada' });
    }
    return res.json(resultado.rows[0]);
  } catch (err) {
    console.error('Erro ao buscar dados da igreja para cadastro de membro:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});
```

### 9.2 POST /api/publico/igrejas/:slug/membros/cadastro
Cadastro público de membro via QR code ou link.

```js
router.post('/igrejas/:slug/membros/cadastro', async (req, res) => {
  const { slug } = req.params;
  const { nome, telefone, email, data_nascimento, genero, endereco, tipo_entrada } = req.body;

  if (!nome || !nome.trim()) {
    return res.status(400).json({ error: 'O campo nome é obrigatório' });
  }
  if (!telefone || !telefone.trim()) {
    return res.status(400).json({ error: 'O campo telefone é obrigatório' });
  }

  try {
    const igrejaRes = await db.query(
      `SELECT id FROM igrejas WHERE LOWER(slug) = LOWER($1) AND ativa = true`,
      [slug]
    );
    if (igrejaRes.rows.length === 0) {
      return res.status(404).json({ error: 'Igreja não encontrada' });
    }
    const igrejaId = igrejaRes.rows[0].id;

    const resultado = await db.query(
      `INSERT INTO membros (
         igreja_id, nome, telefone, email, data_nascimento, genero,
         endereco, tipo_entrada, data_entrada, ultimo_contato, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE, CURRENT_DATE, 'ativo')
       RETURNING id, nome`,
      [
        igrejaId,
        nome.trim(),
        telefone.trim(),
        email ?? null,
        data_nascimento ?? null,
        genero ?? null,
        endereco ?? null,
        tipo_entrada ?? null
      ]
    );

    return res.status(201).json({
      id: resultado.rows[0].id,
      nome: resultado.rows[0].nome,
      mensagem: 'Bem-vindo à membresia!'
    });
  } catch (err) {
    console.error('Erro no cadastro público de membro:', err);
    return res.status(500).json({ error: 'Erro interno ao registrar cadastro' });
  }
});
```

---

## 10. ARQUIVO: `src/jobs/followupWhatsapp.js` (criar do zero)

```js
const cron = require('node-cron');
const db = require('../conexao');

// Importação lazy do axios para não quebrar o servidor se não estiver instalado ainda
let axios;
try {
  axios = require('axios');
} catch (_) {
  axios = null;
}

/**
 * Formata o telefone para o formato do WhatsApp: 55 + dígitos + @s.whatsapp.net
 */
function formatarNumeroWhatsapp(telefone) {
  const digitos = telefone.replace(/\D/g, '');
  return `55${digitos}@s.whatsapp.net`;
}

/**
 * Dispara mensagens de follow-up para membros sem contato há mais de 90 dias.
 * Função exportada também para disparo manual via endpoint (futuro).
 */
async function executarFollowupAutomatico() {
  if (!process.env.EVOLUTION_API_URL || !process.env.EVOLUTION_INSTANCE) {
    console.log('[followup] EVOLUTION_API_URL ou EVOLUTION_INSTANCE não configurados. Pulando.');
    return { enviados: 0, erros: 0, pulado: true };
  }

  if (!axios) {
    console.log('[followup] axios não instalado. Rode npm install.');
    return { enviados: 0, erros: 0, pulado: true };
  }

  const mensagemInativo = (nome) =>
    `Olá, ${nome}! 😊\n\nA gente sente sua falta por aqui! 💛\n\nComo você está? Estamos com saudade e pensando em você.\n\nQue Deus te abençoe! 🙏\n— Igreja do Nazareno`;

  try {
    // Busca membros sem contato há mais de 90 dias que ainda não receberam follow-up neste período
    const resultado = await db.query(`
      SELECT m.id, m.nome, m.telefone
      FROM membros m
      WHERE m.status = 'ativo'
        AND m.ultimo_contato < CURRENT_DATE - INTERVAL '90 days'
        AND NOT EXISTS (
          SELECT 1 FROM whatsapp_followup_log w
          WHERE w.membro_id = m.id
            AND w.enviado_em > now() - INTERVAL '90 days'
        )
      ORDER BY m.ultimo_contato ASC
      LIMIT 100
    `);

    let enviados = 0;
    let erros = 0;

    for (const membro of resultado.rows) {
      const mensagem = mensagemInativo(membro.nome);
      const numero = formatarNumeroWhatsapp(membro.telefone);

      try {
        await axios.post(
          `${process.env.EVOLUTION_API_URL}/message/sendText/${process.env.EVOLUTION_INSTANCE}`,
          {
            number: numero,
            textMessage: { text: mensagem }
          },
          {
            headers: { apikey: process.env.EVOLUTION_API_KEY || '' },
            timeout: 15000
          }
        );

        await db.query(
          `INSERT INTO whatsapp_followup_log (membro_id, tipo, sucesso) VALUES ($1, 'inativo', true)`,
          [membro.id]
        );

        enviados++;
        console.log(`[followup] ✓ Mensagem enviada para ${membro.nome}`);

        // Pausa de 1 segundo entre mensagens para não sobrecarregar a API
        await new Promise((r) => setTimeout(r, 1000));

      } catch (errEnvio) {
        await db.query(
          `INSERT INTO whatsapp_followup_log (membro_id, tipo, sucesso, erro) VALUES ($1, 'inativo', false, $2)`,
          [membro.id, errEnvio.message]
        );
        erros++;
        console.error(`[followup] ✗ Falha para ${membro.nome}:`, errEnvio.message);
      }
    }

    console.log(`[followup] Concluído: ${enviados} enviados, ${erros} erros`);
    return { enviados, erros };

  } catch (err) {
    console.error('[followup] Erro geral na execução:', err);
    return { enviados: 0, erros: 1, erro: err.message };
  }
}

// Agenda: toda segunda-feira às 9h (horário do servidor)
// Formato cron: minuto hora dia-do-mês mês dia-da-semana
// 0 9 * * 1 = 09:00 toda segunda-feira
cron.schedule('0 9 * * 1', () => {
  console.log('[followup] Iniciando job automático de follow-up WhatsApp...');
  executarFollowupAutomatico().catch((err) => {
    console.error('[followup] Erro não capturado no job:', err);
  });
});

console.log('[followup] Job de follow-up WhatsApp agendado (toda segunda-feira às 9h)');

module.exports = { executarFollowupAutomatico };
```

---

## 11. ARQUIVO: `src/index.js` — MODIFICAR (adicionar linhas, não remover nada)

O arquivo atual termina registrando as rotas e iniciando o servidor. Você deve adicionar **exatamente estas 3 linhas** nos locais indicados:

**Onde estão os `require` das rotas (após a linha `const publicoRotas = require('./rotas/publico');`), adicione:**
```js
const membrosRotas = require('./rotas/membros');
const ministeriosRotas = require('./rotas/ministerios');
```

**Onde estão os `app.use` das rotas (após a linha `app.use('/api/publico', publicoRotas);`), adicione:**
```js
app.use('/api/membros', membrosRotas);
app.use('/api/ministerios', ministeriosRotas);
```

**Após todos os `app.use` de rotas (antes do middleware de erro), adicione:**
```js
// Job de follow-up WhatsApp — inicia o cron agendado
require('./jobs/followupWhatsapp');
```

O `index.js` final completo deve ficar assim:

```js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const autenticacaoRotas = require('./rotas/autenticacao');
const igrejasRotas = require('./rotas/igrejas');
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

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  return res.json({ status: 'OK', timestamp: new Date() });
});

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

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Job cron de follow-up WhatsApp
require('./jobs/followupWhatsapp');

app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  return res.status(500).json({ error: 'Ocorreu um erro interno no servidor' });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando com sucesso na porta ${PORT}`);
});
```

---

## 12. ARQUIVO: `package.json` — MODIFICAR (adicionar 2 dependências)

Adicione ao objeto `"dependencies"` (não remover as existentes):
```json
"node-cron": "^3.0.3",
"axios": "^1.7.9"
```

O `package.json` completo final deve ser:
```json
{
  "name": "sistema-membresia-backend",
  "version": "1.0.0",
  "description": "Backend do Sistema de Membresia da Igreja do Nazareno",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "axios": "^1.7.9",
    "bcrypt": "^5.1.1",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "multer": "^2.2.0",
    "node-cron": "^3.0.3",
    "pg": "^8.11.5"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}
```

---

## 13. ARQUIVO: `backend/.env` — ADICIONAR VARIÁVEIS

O `.env` atual tem:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/membresia
JWT_SECRET=nazareno_membresia_segredo_super_secreto_123_abc
PORT=3031
```

Adicione ao final:
```
# Evolution API (WhatsApp)
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_INSTANCE=nazareno
EVOLUTION_API_KEY=
```

> Nota: deixar `EVOLUTION_API_KEY` vazio é seguro — o sistema verifica se `EVOLUTION_API_URL` está preenchido antes de tentar enviar. Se estiver vazio, o endpoint retorna `{ sucesso: false, aviso: "..." }` em vez de quebrar.

---

## 14. COMO APLICAR A MIGRATION

Após criar o arquivo `migracoes/004_membresia.sql`, execute no terminal:

```bash
psql postgresql://postgres:postgres@localhost:5432/membresia -f backend/migracoes/004_membresia.sql
```

Ou conecte ao banco e execute o conteúdo do arquivo.

---

## 15. COMO INSTALAR AS DEPENDÊNCIAS

```bash
cd backend
npm install
```

---

## 16. CHECKLIST FINAL

Antes de entregar, verifique cada item:

- [ ] `migracoes/004_membresia.sql` criado com todas as 5 tabelas e índices
- [ ] `src/rotas/membros.js` criado com TODOS os 14 endpoints documentados acima
- [ ] As rotas `GET /api/membros/stats` e `GET /api/membros/sem-contato` aparecem ANTES de `GET /api/membros/:id` no arquivo
- [ ] `src/rotas/ministerios.js` criado com os 5 endpoints documentados
- [ ] `src/rotas/publico.js` tem as 2 novas rotas de membros ADICIONADAS (as 3 originais permanecem intactas)
- [ ] `src/jobs/followupWhatsapp.js` criado com o cron e a função `executarFollowupAutomatico`
- [ ] `src/index.js` modificado com os 2 novos `require` de rotas, 2 novos `app.use`, e o `require('./jobs/followupWhatsapp')`
- [ ] `package.json` tem `node-cron` e `axios` nas dependencies
- [ ] `backend/.env` tem as 3 variáveis da Evolution API adicionadas
- [ ] Nenhuma rota, middleware ou serviço existente foi removido ou modificado (exceto as adições ao `publico.js` e `index.js`)

Entregue cada arquivo completo, do início ao fim, sem omitir nenhuma linha.
