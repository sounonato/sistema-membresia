# Handoff — Sistema de Membresia (Igreja do Nazareno)

Documento para quem for integrar este **frontend** com o **backend** (API Node/Express local).

---

## 1. Stack

- **React 19 + TypeScript**
- **TanStack Start v1** (SSR + file-based routing em `src/routes/`)
- **TanStack Query** para cache/estado remoto
- **Tailwind CSS v4** (tokens em `src/styles.css`)
- **Recharts** (gráficos), **xlsx** + **jspdf** (exportação), **qrcode.react** (QR)
- **Sem Supabase**. Toda persistência via API REST externa.

---

## 2. Estrutura de pastas

```
src/
  assets/                  # imagens geradas (landing, hero, etc.)
  components/
    layout/                # AppShell, Sidebar, PageHeader
    ui/                    # shadcn (button, input, dialog, table, ...)
  contexts/
    AuthContext.tsx        # usuario, token, slug, igreja, login(), logout()
  hooks/
  lib/
    api.ts                 # cliente HTTP + tipos (Igreja, Usuario, Perfil)
    manual.ts              # conteúdo estruturado do Manual da Igreja
    utils.ts
  paginas/                 # toda a lógica de UI (em PT-BR)
    landing/               # landing pública editorial (rota /)
    login/                 # login global
    cadastro-publico/      # form multi-etapas de cadastro via QR
    dashboard/             # "Pastoral Panorama" com Recharts
    convertidos/           # listagem, novo, editar, detalhe
    jornada/               # timeline vertical do convertido
    discipulado/           # grupos + [id] detalhe (membros/progresso)
    discipuladores/        # CRUD
    modulos/               # CRUD
    usuarios/              # gestão de acesso (admin/lider)
    igrejas/               # painel SUPERADMIN (CRUD + branding)
    manual/                # navegador + chat IA
    qr-cadastro/           # gerador de QR (poster imprimível)
    relatorios/            # 5 relatórios com export XLSX/PDF
  routes/                  # roteamento TanStack (só importa de paginas/)
  styles.css               # tokens OKLCH âmbar/pedra + fontes
```

---

## 3. Rotas

### Públicas
| URL                    | Arquivo                    | Descrição |
|------------------------|----------------------------|-----------|
| `/`                    | `routes/index.tsx`         | Landing editorial global |
| `/login`               | `routes/login.tsx`         | Login (email + senha + slug manual) |
| `/$slug`               | `routes/$slug.index.tsx`   | Landing da igreja (branding dinâmico) |
| `/$slug/login`         | `routes/$slug.login.tsx`   | Login com slug preenchido pela URL |
| `/cadastro/$slug`      | `routes/cadastro.$slug.tsx`| Cadastro público via QR (multi-etapa) |

`routes/$slug.tsx` é o **layout pai** que busca `getIgrejaPublica(slug)` e aplica a cor primária no CSS var `--primary`.

### Autenticadas (`routes/_auth.tsx` — guard global)
| URL                              | Perfis permitidos             |
|----------------------------------|-------------------------------|
| `/dashboard`                     | todos exceto superadmin       |
| `/convertidos`                   | admin, lider, pastor, discipulador |
| `/convertidos/novo`              | admin, lider                  |
| `/convertidos/$id`               | admin, lider, pastor, discipulador |
| `/convertidos/$id/editar`        | admin, lider                  |
| `/convertidos/$id/jornada`       | admin, lider, pastor, discipulador |
| `/discipulado`, `/discipulado/$id` | admin, lider, pastor, discipulador |
| `/discipuladores`, `/modulos`    | admin, lider                  |
| `/usuarios`                      | admin, lider                  |
| `/manual`, `/relatorios`, `/qr-cadastro` | autenticado           |
| `/igrejas`                       | **superadmin apenas**         |

Guard em `_auth.tsx`:
- Sem token → redireciona `/login`.
- Superadmin → só pode acessar `/igrejas`.
- Não-superadmin → não pode acessar `/igrejas`.

---

## 4. Autenticação

`src/contexts/AuthContext.tsx` expõe:

```ts
{
  usuario: Usuario | null,
  token: string | null,
  slug: string | null,     // slug da igreja logada
  igreja: Igreja | null,   // metadados (nome, cor, logo)
  login(email, senha, slug): Promise<void>,
  logout(): void,
}
```

- Token JWT em `localStorage["token"]`.
- Slug em `localStorage["slug"]`.
- Após login → redireciona `/dashboard` (ou `/igrejas` se superadmin).
- `api.ts` injeta `Authorization: Bearer <token>` em toda request autenticada.

---

## 5. Contrato da API — `src/lib/api.ts`

**Base URL:** `http://localhost:3031/api` (constante no topo de `api.ts` — trocar para produção).

### Auth
- `POST /auth/login` — body `{ email, senha, slug }` → `{ token, usuario }`
- `GET  /auth/me` → `Usuario`
- `GET  /auth/usuarios` → `Usuario[]`
- `POST /auth/usuarios` — body `{ nome, email, senha, perfil }`
- `PATCH /auth/usuarios/:id/toggle` — ativa/desativa

### Igrejas (superadmin)
- `GET  /igrejas` → `Igreja[]`
- `POST /igrejas` — cria igreja
- `PUT  /igrejas/:id`
- `DELETE /igrejas/:id`
- `POST /igrejas/:id/admin` — cria usuário admin da igreja
- `POST /igrejas/:id/logo` — **multipart/form-data**, campo `logo` (File)

Campos do tipo `Igreja`: `id, nome, slug, ativa?, plano?, cor_primaria?, logo_url?, descricao?, cidade?, estado?`

### Convertidos
- `GET  /convertidos` · `GET /convertidos/:id`
- `POST /convertidos` · `PUT /convertidos/:id` · `DELETE /convertidos/:id`

### Discipulado
- `GET  /discipulado/grupos` · `GET /discipulado/grupos/:id`
- `POST /discipulado/grupos` · `PUT /discipulado/grupos/:id`
- `POST /discipulado/grupos/:id/membros` — body `{ convertido_id }`
- `DELETE /discipulado/grupos/:id/membros/:convertidoId`
- `GET  /discipulado/grupos/:id/progresso`
- `POST /discipulado/grupos/:id/progresso` — registrar aula concluída

### Discipuladores / Módulos
CRUD padrão em `/discipuladores` e `/modulos`.

### Dashboard
- `GET /dashboard/stats` → estatísticas para os cards e gráficos Recharts (ver `paginas/dashboard/page.tsx` para o shape esperado).

### Manual (IA)
- `POST /manual/chat` — body `{ pergunta, historico: [{role, content}] }` → `{ resposta }`

### Públicos (sem token) — usados pelo QR/landing
- `GET  /publico/igrejas/:slug` → dados públicos da igreja (nome, cor, logo, descrição…)
- `GET  /publico/igrejas/:slug/grupos` → grupos disponíveis para o form
- `POST /publico/igrejas/:slug/cadastro` → cria convertido a partir do QR

Payload do cadastro público (multi-etapa):
```json
{
  "nome": "", "telefone": "", "email": "", "data_nascimento": "",
  "endereco": "", "grupo_id": "opcional",
  "questionario": {
    "tomou_decisao": true,
    "ja_batizado": false,
    "avaliacao": 5,
    "pedido_oracao": ""
  }
}
```

### Formato de erro esperado
```json
{ "error": "mensagem legível" }
```
`api.ts` faz `throw new Error(err.error)` — toasts consomem essa mensagem.

---

## 6. Perfis (`Perfil`)

```
superadmin | admin | lider | pastor | discipulador
```

- `podeEditar(perfil)` → `admin` ou `lider`.
- `ehSuperadmin(perfil)` → controla visibilidade do menu `Igrejas` e bloqueia rotas operacionais.

---

## 7. Identidade visual

- Tokens em `src/styles.css` (OKLCH — âmbar/dourado sobre pedra/branco).
- Fontes: **Fraunces** (títulos), **Instrument Serif** (itálicos), **Instrument Sans** (corpo).
- Multi-tenant: `routes/$slug.tsx` sobrescreve `--primary` com `igreja.cor_primaria` em runtime.
- Sem dark mode.

---

## 8. Checklist para o backend

- [ ] JWT com claims `perfil` e (quando aplicável) `igreja_id`.
- [ ] Isolamento multi-tenant por `igreja_id` em TODAS as queries operacionais.
- [ ] Upload aceitando `multipart/form-data` (logo da igreja).
- [ ] CORS liberado para a origem do front.
- [ ] `GET /dashboard/stats` com o shape consumido em `paginas/dashboard/page.tsx`.
- [ ] Endpoints públicos (`/publico/*`) sem exigir token.
- [ ] Rotas de `superadmin` protegidas no backend (o guard do front é só UX).
- [ ] `POST /manual/chat` como proxy para o provedor de IA.
- [ ] Retornar erros no formato `{ "error": "..." }`.

---

## 9. Como rodar

```bash
bun install
bun dev            # front em Vite
# subir a API em http://localhost:3031
```

Alterar `BASE_URL` em `src/lib/api.ts` para apontar para produção.

---

## 10. Observações finais

- Toda escrita usa TanStack Query com `invalidateQueries` após mutations.
- Confirmação (`window.confirm`) antes de DELETE.
- Toasts (`sonner`) para sucesso/erro.
- Layout responsivo com sidebar colapsável no mobile.
- Nenhum dado é persistido no front além de `token` e `slug` em `localStorage`.
