# Prompt Gemini — Backend de Branding Multi-tenant

## Contexto

Você está trabalhando no backend do **Sistema de Membresia** — uma plataforma SaaS para igrejas.

Stack atual:
- Node.js + Express
- PostgreSQL (pool via `pg`)
- JWT + bcrypt
- Porta 3031

A tabela `igrejas` já existe com: `id`, `nome`, `slug`, `ativa`, `plano`, `created_at`.

O objetivo desta tarefa é adicionar **identidade visual por igreja** (branding multi-tenant): cada igreja terá sua própria cor, logo, descrição e localização. O sistema vai exibir essas informações em uma landing page pública específica para cada igreja.

---

## Tarefa 1 — Migration SQL

Crie o arquivo `backend/migracoes/003_branding_igrejas.sql`:

```sql
-- Adiciona campos de branding à tabela igrejas
ALTER TABLE igrejas
  ADD COLUMN IF NOT EXISTS cor_primaria TEXT DEFAULT '#b45309',
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS descricao TEXT,
  ADD COLUMN IF NOT EXISTS cidade TEXT,
  ADD COLUMN IF NOT EXISTS estado TEXT;
```

---

## Tarefa 2 — Endpoint público de branding

Arquivo: `backend/src/rotas/publico.js`

Adicione (ou atualize se já existir):

```
GET /api/publico/igrejas/:slug
```

- **Sem autenticação** (público)
- Retorna os dados de branding da igreja pelo slug
- Se slug não existir ou `ativa = false` → retorna `404 { error: 'Igreja não encontrada' }`

**Resposta de sucesso (200):**
```json
{
  "id": "uuid",
  "nome": "Igreja Batista ABC",
  "slug": "batista-abc",
  "cor_primaria": "#1d4ed8",
  "logo_url": "/uploads/logos/uuid.png",
  "descricao": "Uma comunidade de fé em Recife",
  "cidade": "Recife",
  "estado": "PE"
}
```

---

## Tarefa 3 — Atualizar dados e branding da igreja (superadmin)

No arquivo `backend/src/rotas/igrejas.js`, atualize o endpoint `PUT /api/igrejas/:id`:

Aceitar no body (todos opcionais):
```json
{
  "nome": "string",
  "slug": "string",
  "ativa": true,
  "plano": "string",
  "cor_primaria": "#1d4ed8",
  "descricao": "string",
  "cidade": "string",
  "estado": "string"
}
```

Protegido por: `autenticar` + `checkPerfil(['superadmin'])`

---

## Tarefa 4 — Upload de logo (superadmin)

Instale: `npm install multer`

Crie endpoint em `backend/src/rotas/igrejas.js`:

```
POST /api/igrejas/:id/logo
Content-Type: multipart/form-data
Campo: logo (arquivo de imagem)
```

- Protegido por: `autenticar` + `checkPerfil(['superadmin'])`
- Salvar em: `backend/uploads/logos/{id}.png` (use extensão original)
- Atualizar `logo_url` na tabela: `/uploads/logos/{id}.{ext}`
- Retornar: `{ logo_url: '/uploads/logos/{id}.{ext}' }`
- Validação: apenas imagens (jpg, jpeg, png, webp), máximo 2MB

Configure o Express para servir arquivos estáticos da pasta `uploads/`:
```js
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
```

---

## Tarefa 5 — Atualizar endpoint de login para aceitar slug via URL

No arquivo `backend/src/rotas/autenticacao.js`, o login atual já funciona por email sem slug.

**Não altere o endpoint existente.** Apenas confirme que o token JWT retornado inclui:
```json
{
  "id": "uuid",
  "perfil": "admin",
  "igreja_id": "uuid"
}
```

E que o endpoint `GET /api/auth/me` retorna `igreja_slug` no payload:
```json
{
  "id": "uuid",
  "nome": "Anderson",
  "email": "sou.nonato@live.com",
  "perfil": "admin",
  "igreja_id": "uuid",
  "igreja_nome": "Igreja do Nazareno",
  "igreja_slug": "nazareno-sede"
}
```

(Se `igreja_slug` não estiver sendo retornado, adicione ao SELECT do `/me`)

---

## Estrutura de arquivos afetados

```
backend/
├── migracoes/
│   └── 003_branding_igrejas.sql     ← NOVO
├── uploads/
│   └── logos/                        ← NOVO (criar pasta)
├── src/
│   ├── index.js                      ← adicionar serve de /uploads
│   └── rotas/
│       ├── publico.js                ← adicionar GET /api/publico/igrejas/:slug
│       └── igrejas.js                ← adicionar PUT branding + POST logo
```

---

## Observações

- Todos os erros no padrão: `{ error: "mensagem" }`
- Sucesso: objeto direto ou `{ data: ... }`
- Use try/catch em todas as rotas
- A pasta `uploads/logos/` deve ser criada automaticamente se não existir (`fs.mkdirSync`)
