# Arquitetura

> Atualize este documento quando decisoes tecnicas mudarem. Nao registre desejos como se fossem o estado atual.

## Visao geral

- Produto: plataforma multi-tenant de membresia e discipulado para igrejas
- Problema resolvido: organizar membros, convertidos, discipulado, ministerios, usuarios e cadastro publico num unico sistema por igreja
- Usuarios/tenants: `superadmin`, `admin`, `lider`, `pastor`, `discipulador`; cada igreja e um tenant
- Estagio: MVP em evolucao

## Stack atual

| Camada | Tecnologia | Versao/observacao |
|---|---|---|
| Frontend | React 19 + TypeScript + TanStack Start + TanStack Query + Tailwind CSS v4 | app principal em `frontend v4/` |
| Backend/API | Node.js + Express + JWT + bcrypt + multer + node-cron | API REST em `backend/` |
| Banco | PostgreSQL | acesso via `pg` e migrations SQL em `backend/migracoes/` |
| Autenticacao | JWT em `localStorage` + guard de rotas no frontend | login por e-mail e senha |
| Filas/cache | Nao se aplica no momento | jobs cron locais para follow-up |
| Infra/hosting | Railway com Nixpacks | backend e frontend possuem configs de deploy |
| Observabilidade | logs em stdout/stderr e endpoints de healthcheck | sem stack dedicada de metrics/tracing no repo |

## Componentes e fronteiras

```text
[Browser] -> [frontend v4] -> [backend Express] -> [PostgreSQL / uploads / cron]
```

- `frontend v4`: rotas publicas, painel autenticado, estado de auth, consultas via REST
- `backend`: autentica usuarios, aplica isolamento por tenant, expoe CRUDs e integra trabalho cron
- `PostgreSQL`: fonte de verdade para igrejas, usuarios, membros, convertidos, grupos, ministerios e solicitacoes

## Dados e multi-tenancy

- Identificador de tenant: `igreja_id`
- Estrategia de isolamento: middleware de tenant e filtros por `igreja_id` nas consultas operacionais; superadmin e a excecao administrativa
- Entidades principais: `igrejas`, `usuarios`, `membros`, `convertidos`, `discipulado/grupos`, `discipuladores`, `modulos`, `ministerios`, `solicitacoes`
- Retencao, backup e restauracao: nao ha politica propria documentada; seguir capacidade do provedor e backups do banco
- Migracoes e rollback: migrations SQL autoexecutadas na subida do backend; rollback manual nao esta automatizado no repo

## Contratos e integracoes

| Integracao/API | Finalidade | Autenticacao | Falha/retry | Responsavel |
|---|---|---|---|---|
| REST interna `backend/src/rotas/*` | CRUD operacional e auth | JWT | sem retry automatico no frontend | backend + frontend |
| `/api/publico/igrejas/:slug` | dados publicos e cadastro via QR | sem auth | erro tratado por tela publica | backend + frontend |
| `/uploads` | servir logos e arquivos enviados | n/a | dependente do filesystem do host | backend |
| `node-cron` follow-up | tarefa agendada de follow-up WhatsApp | n/a | reinicia com o processo | backend |

## Seguranca

- Autenticacao e sessoes: JWT, token em `localStorage`, refresh nao esta implementado
- Autorizacao e papeis: superadmin controla igrejas; admin/lider operam a igreja; pastor e discipulador tem acesso limitado conforme rota
- Segredos: variaveis de ambiente do backend e do frontend; nao registrar credenciais no repo
- Dados sensiveis/PII: membros, usuarios, telefones, e-mails e senhas hash no banco
- Rate limits e auditoria: login com rate limit; logs de erro no servidor; sem auditoria dedicada no momento

## Desenvolvimento e validacao

```text
Instalar frontend: cd "frontend v4" && npm install
Executar frontend: cd "frontend v4" && npm run dev
Lint frontend:     cd "frontend v4" && npm run lint
Build frontend:     cd "frontend v4" && npm run build
Instalar backend:   cd backend && npm install
Executar backend:   cd backend && npm run dev
Start backend:      cd backend && npm run start
```

## Decisoes arquiteturais

Registre decisoes duraveis em `docs/decisions/ADR-NNN-titulo.md` com contexto, opcoes, decisao e consequencias.

| ADR | Decisao | Status | Data |
|---|---|---|---|
| Nenhuma ainda | | proposta/aceita/substituida | |

## Restricoes e divida conhecida

- O frontend v4 ainda mistura tokens semanticos com classes hardcoded em varias telas
- O modelo de branding por tenant esta parcialmente aplicado no painel e precisa de consolidacao visual
- Nao ha suite de testes automatizados de ponta a ponta documentada
