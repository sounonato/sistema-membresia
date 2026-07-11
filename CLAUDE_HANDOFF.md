# CLAUDE_HANDOFF — Sistema Membresia

Atualizado em: 2026-07-11 (sessão 6)

## Estado atual: FUNCIONANDO ✅

**Frontend v4 é o frontend mais completo** — inclui todas as páginas do sistema + landing SaaS + cadastro de igreja + painel de solicitações.  
Frontend v3 tem o módulo Membresia completo mas não tem landing/SaaS. Frontend v2 tem branding multi-tenant. Frontend v1 é legado — não usar.

| Serviço | Porta | Comando |
|---------|-------|---------|
| Backend (Node/Express) | 3031 | `cd backend && node src/index.js` |
| Frontend v4 (TanStack Start, COMPLETO) | 8085 | `cd "frontend v4" && bun dev` |
| Frontend v3 (Vite + React, Membresia) | 5176 | `cd "frontend v3" && npx vite dev --port 5176` |
| Frontend v2 (TanStack Start + Bun, Branding) | dinâmica (~8083-8084) | `cd "frontend v2" && bun dev` |
| Frontend v1 (legado, não usar) | 5175 | — |

---

## Login

| Usuário | Email | Perfil | Senha |
|---------|-------|--------|-------|
| Anderson | `sou.nonato@live.com` | admin | `nazareno123` |
| Ryan Miqueias | `rnmiqueias@gmail.com` | lider | `nazareno123` |
| Admin padrão | `admin@nazareno.com` | admin | `admin123` |
| Superadmin | `super@nazareno.com` | superadmin | `admin123` |

**Não há mais campo Slug no login.** O sistema identifica a igreja automaticamente pelo email do usuário.

---

## Estrutura do projeto

```
sistema-membresia/
├── backend/                        ← Node.js + Express + PostgreSQL
│   ├── src/
│   │   ├── index.js                ← entry point, porta 3031
│   │   ├── conexao.js              ← pool PostgreSQL
│   │   ├── middlewares/
│   │   │   ├── autenticacao.js     ← verifica JWT
│   │   │   ├── tenant.js           ← injeta req.igrejaId
│   │   │   └── perfil.js           ← checkPerfil(['admin','lider'])
│   │   └── rotas/
│   │       ├── autenticacao.js     → /api/auth (login SEM slug, me com igreja_slug)
│   │       ├── igrejas.js          → /api/igrejas (superadmin)
│   │       ├── convertidos.js      → /api/convertidos
│   │       ├── discipulado.js      → /api/discipulado
│   │       ├── discipuladores.js   → /api/discipuladores
│   │       ├── modulos.js          → /api/modulos
│   │       ├── painel.js           → /api/dashboard
│   │       └── portal.js           → /api/portal (público)
│   ├── migracoes/
│   │   ├── 001_esquema.sql         ← schema completo + seeds
│   │   └── 002_migracao_supabase.sql ← dados migrados do Supabase
│   ├── manual_nazareno.txt         ← usado pela IA do manual
│   └── .env                        ← DATABASE_URL + JWT_SECRET
├── frontend/                       ← React + Vite + TanStack Router
│   └── src/
│       ├── main.tsx                ← SPA entry
│       ├── router.tsx
│       ├── routes/                 ← TanStack Router file-based
│       │   ├── __root.tsx
│       │   ├── _auth.tsx           ← layout protegido
│       │   ├── _auth.dashboard.tsx
│       │   ├── _auth.convertidos.index.tsx
│       │   └── ...
│       ├── paginas/                ← page.tsx + hooks.ts por módulo
│       ├── lib/api.ts              ← endpoints (login SEM slug)
│       └── contexts/AuthContext.tsx ← token no localStorage, SEM slug
├── docs/                           ← prompts e planos
│   ├── BRANDING-PLAN.md            ← plano multi-tenant branding
│   ├── GEMINI-BRANDING-BACKEND.md  ← prompt pro Gemini (próxima fase)
│   ├── LOVABLE-BRANDING-FRONTEND.md ← prompt pro Lovable (próxima fase)
│   ├── PROMPT-GEMINI-BACKEND.md    ← prompt original do backend
│   └── PROMPT-LOVABLE-FRONTEND.md  ← prompt original do frontend
├── CLAUDE_HANDOFF.md
├── README.md
└── .gitignore
```

---

## Banco de dados

- **PostgreSQL local**, banco: `membresia`
- Conexão: `DATABASE_URL=postgresql://andersonnonato@localhost:5432/membresia`
- `.env` em `backend/.env`

### Dados atuais no banco

| Tabela | Registros |
|--------|-----------|
| igrejas | 1 (nazareno-sede) |
| usuarios | 4 |
| novos_convertidos | 3 (2 migrados do Supabase + 1 teste) |
| discipuladores | 2 (Ryan Miqueias + Lorran Moncada) |
| modulos_discipulado | 3 (Fundamentos da Fé, Vida no Espírito, Discipulado Avançado) |

---

## Multi-tenant (SaaS)

- Tabela `igrejas` como tenant root
- Todas as tabelas têm `igreja_id FK`
- Middleware `tenant.js` injeta `req.igrejaId` a partir do JWT
- **Login por email** — sistema identifica a igreja automaticamente pelo email
- JWT contém `igrejaId` e `perfil`
- Superadmin não tem `igreja_id` (gerencia todas as igrejas)

---

## Mudanças feitas hoje (2026-07-10)

### Remoção do Slug do login
- Campo "Slug da Igreja" removido da tela de login
- Backend: `POST /api/auth/login` agora busca por email diretamente (sem slug no body)
- Frontend: `AuthContext.tsx` — função `login(email, senha)` sem parâmetro slug
- Frontend: `api.ts` — `login(email, senha)` sem slug
- `GET /api/auth/me` agora retorna `igreja_slug` no payload

### Dashboard — gráficos corrigidos
- Gráfico "Convertidos por mês" corrigido: `dataKey="quantidade"` (era `"total"`)
- Mapeamento de dados: `convertidos_por_mes` → `por_mes` corrigido
- Gráfico "Distribuição por gênero" corrigido igualmente

### Dashboard — Faixa Etária adicionada
- Novo gráfico "Faixa Etária" no dashboard
- Backend: `por_faixa_etaria` adicionado ao serviço de estatísticas com `ARRAY_AGG(nome)` por faixa
- Frontend: tooltip customizado ao passar o mouse mostra os nomes das pessoas naquela faixa
- Útil para identificar quem está sem data de nascimento cadastrada

### Cadastro — Data de nascimento obrigatória
- Campo "Data de nascimento" agora é `required` no formulário de cadastro
- Label atualizado para "Data de nascimento *"

### QR de Cadastro — corrigido
- Página usava `slug` do AuthContext que foi removido
- Corrigido para usar `usuario.igreja_slug` (retornado pelo `/api/auth/me`)

### Migração Supabase → PostgreSQL
- Exportados dados do Supabase (service_role key)
- 2 convertidos reais migrados (Ana Beatriz + Giovanna)
- 2 discipuladores migrados (Ryan Miqueias + Lorran Moncada)
- 3 módulos migrados (deduplicados)
- 2 usuários migrados com senha temporária `nazareno123`

### Limpeza do projeto
- Removidos todos os arquivos do projeto antigo Lovable/Supabase da raiz
- Removidos: `src/`, `dist/`, `node_modules/`, `supabase/`, `database/`, `scripts/`
- Removidos: `package.json` raiz, configs Vite/Tailwind/TypeScript raiz
- Removido: `supabase-cli` (binário 37MB)
- Removidos: todos os prompts e planos antigos (pré-rebuild)
- `manual_nazareno.txt` movido para `backend/`
- Criada pasta `docs/` com prompts e planos atuais

### CSS — Tailwind v4 corrigido
- `vite.config.ts` do frontend: adicionado plugin `@tailwindcss/vite`
- Sem esse plugin o Tailwind v4 não compila nada

---

## Frontend v2 (Lovable) — integrado em 2026-07-10

Nova pasta `frontend v2/` gerada pelo Lovable com design editorial premium.

**Stack:** TanStack Start (SSR) + Bun + Fraunces/Instrument Serif  
**Rodar:** `cd "frontend v2" && bun dev` (porta dinâmica, normalmente 8083-8084)

### Rotas novas no v2
| URL | Descrição |
|-----|-----------|
| `/login` | Global — email + senha (sem slug) |
| `/$slug` | Landing pública da igreja com branding dinâmico |
| `/$slug/login` | Login com identidade da igreja (cor + logo) |
| `/cadastro/$slug` | Form QR multi-etapa público |
| `/igrejas` | Painel superadmin (CRUD + branding + logo) |
| `/relatorios` | 5 relatórios com export XLSX/PDF |
| `/convertidos/$id/jornada` | Timeline vertical do convertido |

### Correções aplicadas no v2
- Removido campo "Slug" do `/login` global (`paginas/login/page.tsx`)

### Endpoints adicionados no backend (para o v2)
- `GET /api/publico/igrejas/:slug/grupos` — grupos para QR cadastro
- `POST /api/publico/igrejas/:slug/cadastro` — cadastro via QR público
- `DELETE /api/igrejas/:id` — excluir igreja (superadmin)
- `POST /api/igrejas/:id/admin` — criar admin da igreja (superadmin)

### Tipografia corrigida no dashboard
- H1 "Bom te ver" — de `clamp(2.5rem,6vw,5.5rem)` → `text-4xl sm:text-5xl` (~48px)
- KPI números — de `clamp(3rem,6vw,5rem)` → `text-5xl` fixo
- Labels seção — de `text-[10px]` → `text-xs` (12px legível)
- `dataKey="total"` → `"quantidade"` nos gráficos (dados do backend corrigidos)
- Mapeamento `convertidos_por_mes` + `.slice(5)` no mês adicionado

### QR de Cadastro — dois modelos (link + QR)
- Página completamente reescrita com dois cards lado a lado
- **Modelo Link:** exibe URL copiável, preview da mensagem, botão "Copiar link"
- **Modelo QR Code:** QR âmbar imprimível, botões Baixar PNG e Imprimir
- Seletor de grupo: vincula o QR/link a um grupo específico de discipulado
- Bug corrigido: página mostrava "Nenhuma igreja vinculada" porque `igreja_slug` não estava no response do login
- Fix: `POST /api/auth/login` agora retorna `igreja_slug` no payload `usuario`
- `paginas/qr-cadastro/page.tsx` usa `(usuario as any)?.igreja_slug` com fallback

### Testado ✅ (frontend v2)
- `/login` — email + senha sem slug
- `/dashboard` — tipografia equilibrada + gráficos com dados reais
- `/nazareno-sede` — landing âmbar (#b45309) dinâmico do banco
- `/nazareno-sede/login` — login com branding da Nazareno
- `/qr-cadastro` — dois modelos (link + QR), slug correto, seletor de grupo

---

## Módulo Membresia — Backend ✅ (entregue em 2026-07-10, sessão 3)

### Arquivos criados/modificados pelo Gemini + revisão Claude

| Arquivo | Status |
|---------|--------|
| `backend/migracoes/004_membresia.sql` | ✅ Criado + aplicado |
| `backend/src/rotas/membros.js` | ✅ Criado — 14 endpoints |
| `backend/src/rotas/ministerios.js` | ✅ Criado — 5 endpoints |
| `backend/src/rotas/publico.js` | ✅ 2 rotas de membro adicionadas |
| `backend/src/jobs/followupWhatsapp.js` | ✅ Cron toda segunda 9h |
| `backend/src/index.js` | ✅ Registra membros + ministerios + job |
| `backend/package.json` | ✅ axios + node-cron adicionados |
| `backend/.env` | ✅ EVOLUTION_API_URL/INSTANCE/KEY adicionados |

### Novos endpoints — `/api/membros`

| Método | Rota | Perfil |
|--------|------|--------|
| GET | `/api/membros/stats` | todos |
| GET | `/api/membros/sem-contato?dias=N` | todos |
| GET | `/api/membros` | todos (filtros: status, busca, ministerio_id) |
| GET | `/api/membros/:id` | todos |
| POST | `/api/membros` | admin, lider |
| PUT | `/api/membros/:id` | admin, lider |
| DELETE | `/api/membros/:id` | admin (soft: status=excluido) |
| PATCH | `/api/membros/:id/vi-hoje` | todos |
| POST | `/api/membros/:id/ministerios` | admin, lider |
| DELETE | `/api/membros/:id/ministerios/:mid` | admin, lider |
| GET | `/api/membros/:id/cargos` | todos |
| POST | `/api/membros/:id/cargos` | admin, lider |
| PATCH | `/api/membros/:id/cargos/:cid` | admin, lider |
| POST | `/api/membros/:id/whatsapp` | admin, lider, pastor |

### Novos endpoints — `/api/ministerios`

| Método | Rota | Perfil |
|--------|------|--------|
| GET | `/api/ministerios` | todos |
| GET | `/api/ministerios/:id` | todos |
| POST | `/api/ministerios` | admin, lider |
| PUT | `/api/ministerios/:id` | admin, lider |
| DELETE | `/api/ministerios/:id` | admin, lider (soft: ativo=false) |

### Novos endpoints — `/api/publico`

| Método | Rota |
|--------|------|
| GET | `/api/publico/igrejas/:slug/membros/cadastro` |
| POST | `/api/publico/igrejas/:slug/membros/cadastro` |

### Correção aplicada por Claude (sessão 3)
- `POST /api/membros/:id/whatsapp`: catch de erro da Evolution API retornava 500 indevido. Corrigido para retornar `{ sucesso: false, aviso: "..." }` quando a Evolution API está inacessível ou não autorizada.

### Novas tabelas no banco

| Tabela | Descrição |
|--------|-----------|
| `membros` | Registro formal da membresia |
| `ministerios` | Grupos de serviço da igreja |
| `membro_ministerios` | N:N membro ↔ ministério |
| `cargos_membros` | Cargos eclesiásticos (diácono, presbítero…) |
| `whatsapp_followup_log` | Log de disparos WhatsApp |

### WhatsApp follow-up
- **Automático:** cron toda segunda-feira às 9h, para membros com `ultimo_contato > 90 dias` sem follow-up nos últimos 90 dias
- **Manual:** `POST /api/membros/:id/whatsapp` — template baseado em `dias_sem_contato` (< 60 = ativo, ≥ 60 = inativo com saudade)
- **Sem Evolution configurada:** retorna `{ sucesso: false, aviso: "..." }` sem quebrar

### Frontend Membresia — v3 ✅ (entregue e testado em 2026-07-10, sessão 3)

Pasta: `frontend v3/` — gerado pelo Lovable, corrigido pelo Claude.

**Stack:** Vite + React + TypeScript + TanStack Router (file-based) + TanStack Query  
**Rodar:** `cd "frontend v3" && npx vite dev --port 5176`

#### Rotas novas no v3

| URL | Descrição |
|-----|-----------|
| `/membros` | Lista de membros com filtros status/ministério |
| `/membros/novo` | Formulário 5 seções (dados pessoais, endereço, eclesiástico, família, fé) |
| `/membros/:id` | Perfil — "Vi hoje", "Enviar WhatsApp", tabs Eclesiástico/Ministérios/Cargos/Família |
| `/membros/:id/editar` | Formulário pré-preenchido com seção status/transferência |
| `/ministerios` | Cards de ministérios, criar/editar modal |
| `/followup-whatsapp` | Dois grupos: urgente (>90d) e atenção (60-90d) |
| `/cadastro-membro/:slug` | Página pública sem auth, busca nome da igreja pelo slug |

#### Correções aplicadas (Claude, sessão 3)
- `/login`: removido campo Slug (Lovable re-gerou com slug). Apenas email + senha. Numeração I/II corrigida.
- Dependências instaladas: `npm install` na pasta `frontend v3/` (Lovable não inclui node_modules)

#### Rotas adicionadas (sessão 4)

| URL | Descrição |
|-----|-----------|
| `/membros/link-cadastro` | QR Code + link para compartilhar no grupo da igreja |

#### Campos adicionados ao cadastro de membro (sessão 4)

Adicionados no banco, backend e formulário:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `data_conversao` | DATE | Quando a pessoa aceitou a Jesus |
| `fez_curso_membresia` | BOOLEAN | Se fez o Curso de Membresia (Nazareno) |

- Migration: `ALTER TABLE membros ADD COLUMN IF NOT EXISTS data_conversao DATE` e `fez_curso_membresia BOOLEAN DEFAULT false`
- Backend: campos incluídos no `POST` e `PUT /api/membros`; `GET /api/membros/stats` retorna `fez_curso_membresia` (contagem)
- Frontend: exibidos na Seção III do formulário e na aba Eclesiástico do perfil

#### `AuthContext.tsx` — fix slug (sessão 4)
- `login()` agora salva `res.usuario?.igreja_slug` no localStorage, não o parâmetro vazio `""`
- `me()` atualiza o slug no state quando retorna `u.igreja_slug`
- Isso corrige a página `/membros/link-cadastro` que dependia do slug para gerar a URL

#### Dashboard — seção Membresia (sessão 4)

Nova seção **II. Membresia Formal** no dashboard (`paginas/dashboard/page.tsx`):
- **4 KPIs:** Total membros, Ativos, Sem contato há >60 dias (vermelho se > 0), Curso de Membresia
- **Barra de status:** distribuição visual Ativos / Inativos / Transferidos
- Hook: `useMembrosStatsDashboard()` em `paginas/dashboard/hooks.ts`
- Gráficos de convertidos renumerados para III/IV

#### Testado ✅ (frontend v3 — sessão 4)
| Página | Status | Observação |
|--------|--------|------------|
| `/login` | ✅ | Email + senha, sem slug, redireciona para `/membros` |
| `/membros` | ✅ | Lista com membros, filtros status/ministério |
| `/membros/:id` | ✅ | Perfil, "Vi hoje", WhatsApp graceful, campos novos na aba Eclesiástico |
| `/membros/novo` | ✅ | Formulário com data_conversao + fez_curso_membresia, POST salva no banco |
| `/ministerios` | ✅ | Cards com ações |
| `/followup-whatsapp` | ✅ | Dois grupos urgente/atenção |
| `/membros/link-cadastro` | ✅ | QR âmbar, "Copiar mensagem para WhatsApp", Baixar PNG, Imprimir |
| `/cadastro-membro/nazareno-sede` | ✅ | Página pública sem auth |
| `/dashboard` | ✅ | Seção Membresia Formal com KPIs e barra de status reais |

---

## Mudanças feitas em 2026-07-11 (sessão 5)

### SaaS onboarding — fluxo completo implementado

**Objetivo:** Landing page pública + cadastro de igrejas + painel de aprovação superadmin.

#### Backend (Gemini entregou, Claude aplicou e testou)

| Arquivo | Mudança |
|---------|---------|
| `backend/migracoes/005_solicitacoes.sql` | `ALTER TABLE igrejas ADD COLUMN IF NOT EXISTS status` + `CREATE TABLE solicitacoes_igreja` |
| `backend/src/rotas/solicitacoes.js` | Rotas públicas e de superadmin separadas em dois Express routers |
| `backend/src/index.js` | Registra `solicitacoesPublico` e `solicitacoesAdmin` |

**Novos endpoints:**

| Método | Rota | Auth |
|--------|------|------|
| POST | `/api/publico/solicitacao-igreja` | Público |
| GET | `/api/superadmin/solicitacoes?status=pendente` | superadmin |
| POST | `/api/superadmin/solicitacoes/:id/aprovar` | superadmin (cria igreja + admin, retorna senha temp) |
| POST | `/api/superadmin/solicitacoes/:id/rejeitar` | superadmin |

**Fluxo de aprovação:** ao aprovar, cria a `igreja` + `usuario` (perfil=admin) em transação atômica, retorna `{ igreja, usuario, senha_temporaria }`.

#### Frontend v4 (Lovable entregou, Claude integrou painel superadmin)

**O que o Lovable construiu:**
- `paginas/landing-saas/page.tsx` — landing page completa (hero, recursos, como funciona, planos)
- `paginas/cadastro-igreja/page.tsx` — formulário 2 etapas (dados da igreja → responsável)
- `paginas/cadastro-igreja/sucesso.tsx` — confirmação pós-envio
- `lib/api-publico.ts` — `solicitarCadastroIgreja()` apontando para o backend correto

**O que Claude adicionou no v4:**
- `lib/api.ts` — 3 novos endpoints: `getSolicitacoes`, `aprovarSolicitacao`, `rejeitarSolicitacao`
- `lib/api.ts` — tipo `SolicitacaoIgreja`
- `paginas/igrejas/hooks.ts` — hooks `useSolicitacoes`, `useAprovarSolicitacao`, `useRejeitarSolicitacao`
- `paginas/igrejas/page.tsx` — aba "Solicitações pendentes" com badge de contagem + tabela com ações Aprovar/Rejeitar + modal de resultado (senha temporária) + modal de rejeição com motivo

#### Testado ✅ (sessão 5)

| Página | Status | Observação |
|--------|--------|------------|
| `http://localhost:8085/` | ✅ | Landing SaaS completa |
| `http://localhost:8085/cadastro` | ✅ | Formulário 2 etapas, states BR, preview slug |
| POST `/api/publico/solicitacao-igreja` | ✅ | 201 — Igreja Batista Central cadastrada |
| GET `/api/superadmin/solicitacoes?status=pendente` | ✅ | Lista solicitações (superadmin) |
| POST `/api/superadmin/solicitacoes/:id/aprovar` | ✅ | Cria igreja + admin + senha temp em transação |
| `/igrejas` aba Igrejas Ativas | ✅ | Tabela com 3 igrejas, ações CRUD |
| `/igrejas` aba Solicitações Pendentes | ✅ | Badge `1`, tabela, botão ✓ abre modal com credenciais |

#### Login do superadmin

| Campo | Valor |
|-------|-------|
| Email | `super@nazareno.com` |
| Senha | `super123` (resetada nesta sessão — hash anterior estava incorreto) |

---

## Mudanças feitas em 2026-07-11 (sessão 6) — Piloto: segurança + email + paginação

Trabalho dividido: Gemini fez o backend, Claude fez o frontend e validação.

### Backend (Gemini)

| Arquivo | Mudança |
|---------|---------|
| `backend/migracoes/006_senha_temporaria.sql` | `ALTER TABLE usuarios ADD COLUMN deve_trocar_senha BOOLEAN DEFAULT false` |
| `backend/migracoes/007_reset_senha.sql` | `CREATE TABLE tokens_reset_senha (id, usuario_id, token, expires_at, usado)` |
| `backend/src/servicos/email.js` | Serviço nodemailer: 3 templates (confirmação, credenciais, reset) |
| `backend/src/index.js` | Rate limit 10 req/min no `/api/autenticacao/login` e `/api/auth/login` |
| `backend/src/rotas/autenticacao.js` | JWT 7d + `POST /trocar-senha` + `POST /esqueci-senha` + `POST /resetar-senha` |
| `backend/src/rotas/solicitacoes.js` | Senha temp com `crypto.randomBytes`, `deve_trocar_senha=true`, disparo de email |
| `backend/src/rotas/membros.js` | Paginação: `?pagina=N&por_pagina=N`, retorna `{ data, total, paginas }` |
| `backend/src/rotas/convertidos.js` | Mesma paginação de membros |
| `backend/package.json` | Deps: `express-rate-limit`, `nodemailer` |

**Variáveis de ambiente adicionadas ao `.env`:**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
EMAIL_FROM=...
BASE_URL=http://localhost:8085
```

### Frontend v4 (Claude)

| Arquivo | Mudança |
|---------|---------|
| `frontend v4/src/routes/_auth.tsx` | Redirect para `/trocar-senha` se `deve_trocar_senha === true` |
| `frontend v4/src/lib/api.ts` | Métodos: `trocarSenha`, `esqueciSenha`, `resetarSenha`; tipo `deve_trocar_senha` no `Usuario` |
| `frontend v4/src/paginas/login/page.tsx` | Link "— esqueci minha senha" → `/esqueci-senha` |
| `frontend v4/src/paginas/trocar-senha/page.tsx` | **Novo** — "Primeiro Acesso / Crie sua senha" (senha atual + nova + confirmar) |
| `frontend v4/src/paginas/esqueci-senha/page.tsx` | **Novo** — formulário email → estado de confirmação |
| `frontend v4/src/paginas/resetar-senha/page.tsx` | **Novo** — token via query param, nova senha + confirmar |
| `frontend v4/src/paginas/termos/page.tsx` | **Novo** — 8 seções LGPD: Aceitação, Serviço, Responsabilidades, LGPD, Planos, Disponibilidade, Cancelamento, Contato |
| `frontend v4/src/routes/trocar-senha.tsx` | **Novo** — `createFileRoute("/trocar-senha")` |
| `frontend v4/src/routes/esqueci-senha.tsx` | **Novo** — `createFileRoute("/esqueci-senha")` |
| `frontend v4/src/routes/resetar-senha.tsx` | **Novo** — `createFileRoute("/resetar-senha")` |
| `frontend v4/src/routes/termos.tsx` | **Novo** — `createFileRoute("/termos")` |
| `frontend v4/src/routeTree.gen.ts` | Registradas as 4 novas rotas nas interfaces FileRoutesByPath, fullPaths, to, id, rootRouteChildren |
| `frontend v4/src/paginas/membros/hooks.ts` | `useMembros` agora retorna `MembrosPage { data, total, pagina, paginas }` |
| `frontend v4/src/paginas/membros/page.tsx` | Paginação com controles Anterior/Próxima + total de registros |
| `frontend v4/src/paginas/ministerios/page.tsx` | Corrigido `.map()` no retorno paginado (`membrosAtivosPaginado?.data`) |
| `frontend v4/src/paginas/dashboard/hooks.ts` | Hook `useMembrosStats()` |
| `frontend v4/src/paginas/dashboard/page.tsx` | Seção IV "Membresia": Total, Ativos, Batizados, Sem contato 60d |
| `frontend v4/src/paginas/cadastro-igreja/page.tsx` | Link `/termos` no checkbox de aceite |
| `frontend v4/src/components/layout/Sidebar.tsx` | Removido "est. 1908" (marcador de uma única igreja) |

### Validação (browser — localhost:8080)

| Checkpoint | Status |
|-----------|--------|
| `/login` com link "esqueci minha senha" | ✅ |
| `/esqueci-senha` renderiza formulário | ✅ |
| `/resetar-senha?token=abc123` renderiza formulário | ✅ |
| `/trocar-senha` renderiza "Primeiro Acesso" | ✅ |
| `/termos` renderiza 8 seções LGPD | ✅ |
| TypeScript: `npx tsc --noEmit` — 0 erros novos | ✅ (só erro pré-existente em `/_auth/manual`) |

### Pendente (não validado nesta sessão — requer SMTP configurado)

- [ ] Email de confirmação chega ao solicitar cadastro
- [ ] Email de credenciais chega ao aprovar solicitação
- [ ] Email de reset chega ao solicitar esqueci-senha
- [ ] Rate limit bloqueia após 10 tentativas de login
- [ ] `deve_trocar_senha=true` força redirect para `/trocar-senha` no primeiro login
- [ ] Plano básico bloqueia ao cadastrar 101° membro ativo (retorna 403)

---

## Próxima fase: Branding Multi-tenant

**Plano:** `docs/BRANDING-PLAN.md`

Cada igreja terá seu próprio link:
```
membresia.app/nazareno-sede    → Landing + Login da Nazareno
membresia.app/batista-abc      → Landing + Login da Batista ABC
```

### O que falta construir
1. **Backend (Gemini)** — `docs/GEMINI-BRANDING-BACKEND.md`
   - Migration: `cor_primaria`, `logo_url`, `descricao`, `cidade`, `estado` na tabela `igrejas`
   - `GET /api/publico/igrejas/:slug` — endpoint público de branding
   - `PUT /api/igrejas/:id` — atualizar branding (superadmin)
   - `POST /api/igrejas/:id/logo` — upload de logo (multer)

2. **Frontend (Lovable)** — `docs/LOVABLE-BRANDING-FRONTEND.md`
   - Rota `/$slug` — landing pública da igreja
   - Rota `/$slug/login` — login com identidade da igreja
   - CSS dinâmico: `--primary` trocado pela cor da igreja
   - Superadmin: tela de edição de branding (cor + logo + descrição)

---

## Páginas testadas e funcionando

### Frontend v1 (legado — não usar ativamente)
| Página | Status |
|--------|--------|
| `/login` | ✅ Sem slug |
| `/dashboard` | ✅ 3 gráficos |
| `/convertidos` | ✅ Dados reais |
| `/discipulado` | ✅ |
| `/discipuladores` | ✅ |
| `/modulos` | ✅ |
| `/usuarios` | ✅ |
| `/qr-cadastro` | ✅ |

### Frontend v2
| Página | Status | Observação |
|--------|--------|------------|
| `/login` | ✅ | Email + senha, sem slug |
| `/dashboard` | ✅ | Tipografia corrigida, gráficos com dados reais |
| `/$slug` | ✅ | Landing pública com cor dinâmica do banco |
| `/$slug/login` | ✅ | Login com branding da igreja |
| `/qr-cadastro` | ✅ | Dois modelos: link + QR, seletor de grupo |
| `/convertidos` | 🔲 | Não testado nesta sessão |
| `/discipulado` | 🔲 | Não testado |
| `/relatorios` | 🔲 | Não testado |
| `/igrejas` (superadmin) | 🔲 | Não testado |

### Frontend v3 (Membresia)
Ver seção "Frontend Membresia — v3" acima para lista completa de testes.
