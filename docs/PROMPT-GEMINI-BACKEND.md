Você vai construir o backend Node.js/Express do Sistema de Membresia — plataforma multi-tenant SaaS para igrejas.

## Conceito multi-tenant
Cada igreja é um tenant independente. Todos os dados são isolados por `igreja_id`. Um usuário pertence a uma igreja e só enxerga dados dessa igreja. Existe um perfil `superadmin` que gerencia as igrejas (fora do escopo de cada tenant).

## Stack
- Node.js + Express
- PostgreSQL (pool via `pg`)
- JWT (jsonwebtoken) + bcrypt
- CORS + dotenv
- Porta: 3031

## Estrutura de pastas a criar

```
backend/
├── src/
│   ├── index.js
│   ├── db.js                        (pool PostgreSQL)
│   ├── middlewares/
│   │   ├── auth.js                  (verificar JWT, injetar req.usuario e req.igreja_id)
│   │   ├── tenant.js                (garantir que toda query leve WHERE igreja_id = req.igreja_id)
│   │   └── perfil.js                (checar perfil: admin, lider, pastor, discipulador)
│   ├── routes/
│   │   ├── auth.js                  (login, criar usuário)
│   │   ├── igrejas.js               (CRUD igrejas — só superadmin)
│   │   ├── convertidos.js           (CRUD novos_convertidos)
│   │   ├── discipulado.js           (grupos, membros, progresso)
│   │   ├── discipuladores.js        (CRUD discipuladores)
│   │   ├── modulos.js               (CRUD modulos_discipulado)
│   │   ├── dashboard.js             (estatísticas)
│   │   └── portal.js                (portal público do convertido por email)
│   └── services/
│       └── stats.js                 (lógica de agregação do dashboard)
├── migrations/
│   └── 001_schema.sql               (todas as tabelas)
├── .env.example
└── package.json
```

## Tabelas PostgreSQL (migrations/001_schema.sql)

```sql
-- Igrejas (tenants)
CREATE TABLE igrejas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,         -- ex: "nazareno-fortaleza", usado no login
  cidade TEXT,
  estado TEXT,
  ativa BOOLEAN DEFAULT true,
  plano TEXT DEFAULT 'basico' CHECK (plano IN ('basico','pro','premium')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Usuários (vinculados a uma igreja)
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  igreja_id UUID REFERENCES igrejas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  senha_hash TEXT NOT NULL,
  perfil TEXT NOT NULL CHECK (perfil IN ('superadmin','admin','lider','pastor','discipulador')),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(email, igreja_id)
);

-- Convertidos
CREATE TABLE novos_convertidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  igreja_id UUID NOT NULL REFERENCES igrejas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT,
  data_conversao DATE NOT NULL,
  data_nascimento DATE,
  endereco TEXT,
  bairro TEXT,
  cidade TEXT,
  estado_civil TEXT,
  genero TEXT,
  tem_filhos BOOLEAN DEFAULT false,
  qtd_filhos INTEGER DEFAULT 0,
  profissao TEXT,
  como_conheceu TEXT,
  batizado BOOLEAN DEFAULT false,
  quer_batismo BOOLEAN DEFAULT false,
  ja_frequentava_igreja BOOLEAN DEFAULT false,
  igreja_anterior TEXT,
  ja_fez_discipulado BOOLEAN DEFAULT false,
  observacoes TEXT,
  status TEXT DEFAULT 'ativo',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Discipuladores
CREATE TABLE discipuladores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  igreja_id UUID NOT NULL REFERENCES igrejas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  usuario_id UUID REFERENCES usuarios(id),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Módulos de discipulado (podem ser globais ou por igreja)
CREATE TABLE modulos_discipulado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  igreja_id UUID REFERENCES igrejas(id) ON DELETE CASCADE,  -- NULL = módulo global (disponível para todas)
  nome TEXT NOT NULL,
  descricao TEXT,
  ordem INTEGER DEFAULT 0,
  total_aulas INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Grupos de discipulado
CREATE TABLE grupos_discipulado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  igreja_id UUID NOT NULL REFERENCES igrejas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  discipulador_id UUID REFERENCES discipuladores(id),
  modulo_id UUID REFERENCES modulos_discipulado(id),
  data_inicio DATE,
  status TEXT DEFAULT 'ativo',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Membros dos grupos
CREATE TABLE grupo_membros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id UUID REFERENCES grupos_discipulado(id) ON DELETE CASCADE,
  convertido_id UUID REFERENCES novos_convertidos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(grupo_id, convertido_id)
);

-- Progresso das aulas
CREATE TABLE progresso_aulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id UUID REFERENCES grupos_discipulado(id) ON DELETE CASCADE,
  aula_numero INTEGER NOT NULL,
  data_aula DATE,
  concluida BOOLEAN DEFAULT false,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Igreja demo + superadmin
INSERT INTO igrejas (nome, slug, cidade, estado) VALUES ('Igreja do Nazareno', 'nazareno', 'Fortaleza', 'CE');

-- Superadmin (senha: super123) — não pertence a nenhuma igreja
INSERT INTO usuarios (nome, email, senha_hash, perfil)
VALUES ('Super Admin', 'super@membresia.app', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'superadmin');

-- Admin da igreja demo (senha: admin123)
INSERT INTO usuarios (nome, email, senha_hash, perfil, igreja_id)
SELECT 'Administrador', 'admin@nazareno.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', id
FROM igrejas WHERE slug = 'nazareno';
```

## Como funciona o isolamento multi-tenant

### Login
O frontend envia `{ email, senha, slug }` (slug da igreja). O backend busca o usuário filtrando por `email` e `igreja_id` (resolvido pelo slug). O JWT retornado inclui `{ id, nome, perfil, igreja_id }`.

Exceção: `superadmin` faz login sem slug e recebe `igreja_id: null` no token.

### Middleware `auth.js`
- Valida o JWT
- Injeta `req.usuario = { id, nome, perfil, igreja_id }` em todas as rotas protegidas

### Middleware `tenant.js`
- Aplica em todas as rotas de dados (exceto `/api/igrejas` e `/api/auth`)
- Garante que `req.igreja_id` existe e rejeita com 403 se `perfil !== 'superadmin'` e `igreja_id` for nulo
- Todas as queries de dados DEVEM incluir `WHERE igreja_id = $1` usando `req.usuario.igreja_id`

### Rotas `/api/igrejas` (só superadmin)
- Criar, listar, ativar/desativar igrejas
- Criar usuário admin para uma igreja

## Endpoints

### POST /api/auth/login
Body: `{ email, senha, slug? }` → retorna `{ token, usuario: { id, nome, perfil, igreja_id, igreja_nome } }`

### GET /api/auth/me
Retorna dados do usuário logado

### GET /api/auth/usuarios *(admin/lider)*
Lista usuários da mesma igreja

### POST /api/auth/usuarios *(admin/lider)*
Body: `{ nome, email, senha, perfil }` → cria usuário na mesma `igreja_id`

### PATCH /api/auth/usuarios/:id/toggle *(admin/lider)*
Ativa/desativa usuário (só da mesma igreja)

---

### GET /api/igrejas *(superadmin)*
Lista todas as igrejas

### POST /api/igrejas *(superadmin)*
Body: `{ nome, slug, cidade, estado, plano }`

### PATCH /api/igrejas/:id/toggle *(superadmin)*
Ativa/desativa uma igreja

### POST /api/igrejas/:id/admin *(superadmin)*
Body: `{ nome, email, senha }` → cria usuário admin para aquela igreja

---

### GET /api/convertidos
Filtra automaticamente por `igreja_id` + perfil (discipulador só vê os seus)

### POST /api/convertidos *(admin/lider)*
### GET /api/convertidos/:id
### PUT /api/convertidos/:id *(admin/lider)*
### DELETE /api/convertidos/:id *(admin/lider)*

### GET /api/discipulado/grupos
### POST /api/discipulado/grupos *(admin/lider)*
### GET /api/discipulado/grupos/:id
### PUT /api/discipulado/grupos/:id *(admin/lider)*
### POST /api/discipulado/grupos/:id/membros *(admin/lider)* — body: `{ convertido_id }`
### DELETE /api/discipulado/grupos/:id/membros/:convertidoId *(admin/lider)*
### GET /api/discipulado/grupos/:id/progresso
### POST /api/discipulado/grupos/:id/progresso *(admin/lider/discipulador do grupo)*

### GET /api/discipuladores
### POST /api/discipuladores *(admin/lider)*
### PUT /api/discipuladores/:id *(admin/lider)*
### DELETE /api/discipuladores/:id *(admin/lider)*

### GET /api/modulos
Retorna módulos globais (igreja_id IS NULL) + módulos da igreja

### POST /api/modulos *(admin/lider)*
### PUT /api/modulos/:id *(admin/lider)*
### DELETE /api/modulos/:id *(admin/lider)*

### GET /api/dashboard/stats
Retorna: `{ total_convertidos, grupos_ativos, batizados, aguardando_discipulado, convertidos_por_mes: [...], por_genero: [...] }` — tudo filtrado pela `igreja_id` do token

### GET /api/portal/:slug/:email *(público, sem autenticação)*
Busca convertido por email dentro da igreja identificada pelo slug

## .env.example
```
DATABASE_URL=postgresql://user:pass@localhost:5432/membresia
JWT_SECRET=troque_isso_por_algo_seguro
PORT=3031
```

## Regras de perfil
- **superadmin:** acesso total ao sistema, gerencia igrejas
- **admin / lider:** acesso total dentro da sua igreja
- **pastor:** só leitura dentro da sua igreja
- **discipulador:** só vê/edita seus próprios grupos e os convertidos desses grupos

## Observações importantes
- Use try/catch em todas as rotas
- Padronize erros: `{ error: "mensagem" }`
- Padronize sucesso: objeto direto ou `{ data: ... }`
- O middleware `perfil.js` recebe array de perfis: `checkPerfil(['admin','lider'])`
- **NUNCA** retorne dados de uma igreja para usuário de outra — o `igreja_id` do token é a fonte da verdade
- O endpoint `/api/portal/:slug/:email` é público (sem autenticação), mas ainda filtra por slug da igreja

Construa o backend completo, funcional, arquivo por arquivo. Não pule nenhum arquivo.
