# Plano — Identidade Visual por Igreja (Multi-tenant Branding)

## Objetivo
Cada igreja cliente acessa o sistema pelo seu próprio link, vê sua identidade (nome, cor, logo) na landing page e no login, e entra direto no seu sistema sem precisar digitar slug.

---

## Fluxo do usuário

```
membresia.app/nazareno-sede     → Landing da Nazareno  → Login da Nazareno  → Dashboard
membresia.app/batista-abc       → Landing da Batista   → Login da Batista   → Dashboard
membresia.app/assembleia-recife → Landing da Assembleia → Login              → Dashboard
```

O slug fica **na URL**, não no formulário. O usuário digita só e-mail + senha.

---

## O que precisa ser construído

### Fase 1 — Backend (Gemini)

#### 1.1 Migration — adicionar campos de branding à tabela `igrejas`
```sql
ALTER TABLE igrejas
  ADD COLUMN cor_primaria TEXT DEFAULT '#b45309',
  ADD COLUMN logo_url TEXT,
  ADD COLUMN descricao TEXT,
  ADD COLUMN cidade TEXT,
  ADD COLUMN estado TEXT;
```

#### 1.2 Endpoint público de branding
```
GET /api/publico/igrejas/:slug
→ { nome, slug, cor_primaria, logo_url, descricao, cidade, estado }
```
Sem autenticação. Retorna 404 se slug não existir ou igreja inativa.

#### 1.3 Upload de logo (superadmin)
```
POST /api/igrejas/:id/logo   (multipart/form-data)
→ salva arquivo em /uploads/logos/:id.png
→ atualiza logo_url na tabela
```

#### 1.4 Atualizar dados da igreja (superadmin)
```
PUT /api/igrejas/:id
Body: { nome, cor_primaria, descricao, cidade, estado }
```

---

### Fase 2 — Frontend (Lovable)

#### 2.1 Rota pública `/$slug`
- Busca branding via `GET /api/publico/igrejas/:slug`
- Se 404 → página "Igreja não encontrada"
- Renderiza landing com identidade da igreja:
  - Nome + logo no topo
  - Cor primária aplicada via CSS variable `--primary`
  - Botão "Entrar" → `/$slug/login`

#### 2.2 Rota pública `/$slug/login`
- Mesma identidade da landing
- Formulário: só e-mail + senha (slug vem da URL)
- Submit → `POST /api/auth/login` com `{ email, senha, slug }`
- Após login → `/dashboard`

#### 2.3 CSS dinâmico por tenant
No componente raiz da rota `/$slug`:
```tsx
document.documentElement.style.setProperty('--primary', cor_primaria);
```
Isso aplica a cor da igreja em todo o sistema enquanto o usuário estiver logado.

#### 2.4 Superadmin — editar branding da igreja
Na página `/igrejas` (superadmin), adicionar:
- Campo: Cor primária (color picker)
- Campo: Logo (upload de imagem)
- Campos: Descrição, Cidade, Estado
- Preview em tempo real da identidade

---

## Estrutura de rotas (TanStack Router)

```
src/routes/
├── _public.$slug.tsx           ← layout público (carrega branding)
├── _public.$slug.index.tsx     ← landing da igreja
├── _public.$slug.login.tsx     ← login da igreja
├── _auth.tsx                   ← layout protegido (já existe)
├── _auth.dashboard.tsx         ← (já existe)
└── ...
```

---

## Sequência de execução

| # | Tarefa | Quem |
|---|--------|------|
| 1 | Migration `cor_primaria`, `logo_url` etc. na tabela `igrejas` | Claude |
| 2 | Endpoint `GET /api/publico/igrejas/:slug` | Gemini |
| 3 | Endpoint `PUT /api/igrejas/:id` com branding | Gemini |
| 4 | Upload de logo `POST /api/igrejas/:id/logo` | Gemini |
| 5 | Rotas `/$slug` e `/$slug/login` no frontend | Lovable |
| 6 | CSS dinâmico por cor da igreja | Claude |
| 7 | Superadmin: tela de edição de branding | Lovable |
| 8 | Testes end-to-end com duas igrejas diferentes | Claude |

---

## Prompts a criar

- `GEMINI-BRANDING-BACKEND.md` — backend de branding
- `LOVABLE-BRANDING-FRONTEND.md` — rotas públicas + superadmin

---

## Decisões técnicas

- **Slug na URL** (não campo no login) — mais limpo, mais profissional
- **CSS variable** `--primary` trocado dinamicamente — zero duplicação de tema
- **Logo**: arquivo local no servidor por ora (S3 pode vir depois)
- **Cor padrão**: `#b45309` (âmbar atual) para igrejas sem cor configurada
- **Login ainda funciona** via `/login` direto para quem conhece a URL (superadmin etc.)

---

## Próximos passos

1. Claude aplica migration no banco local
2. Você envia `GEMINI-BRANDING-BACKEND.md` pro Gemini
3. Você envia `LOVABLE-BRANDING-FRONTEND.md` pro Lovable
4. Claude junta tudo e testa
