# Prompt Lovable — Frontend de Branding Multi-tenant

## Contexto

Você está trabalhando no frontend do **Sistema de Membresia** — uma plataforma SaaS para igrejas.

Stack atual:
- React + TypeScript + Tailwind CSS v4
- TanStack Router (file-based, pasta `src/routes/`)
- TanStack Query
- Radix UI + shadcn/ui
- Paleta padrão: âmbar/dourado `#b45309`
- Backend em `http://localhost:3031/api`

O sistema já tem login em `/login` e rotas protegidas em `/_auth.*`.

O objetivo é adicionar **rotas públicas por igreja**: cada igreja terá sua própria landing page e login acessados pelo slug na URL.

---

## O que construir

### 1. Rota pública `/$slug` — Landing page da igreja

**Arquivo:** `src/routes/$slug.index.tsx`

Comportamento:
- Ao carregar, faz `GET /api/publico/igrejas/$slug`
- Se retornar 404 → exibe página "Igreja não encontrada" com botão voltar
- Se retornar dados → exibe landing page personalizada

**Layout da landing:**
- Logo da igreja no topo (se `logo_url` existir) ou ícone padrão de igreja
- Nome da igreja em destaque (fonte serif)
- Descrição (se existir)
- Cidade e estado
- Botão principal: **"Acessar o sistema"** → navega para `/$slug/login`
- Rodapé: "Sistema de Membresia · Powered by [nome do produto]"

**Cor primária dinâmica:**
Ao carregar os dados da igreja, aplique a cor dela via CSS variable:
```tsx
document.documentElement.style.setProperty('--primary', igreja.cor_primaria ?? '#b45309');
```
Isso faz o botão, títulos e destaques assumirem a cor da igreja.

---

### 2. Rota pública `/$slug/login` — Login da igreja

**Arquivo:** `src/routes/$slug.login.tsx`

Comportamento:
- Carrega o branding da igreja igual à landing (`GET /api/publico/igrejas/$slug`)
- Exibe formulário de login com identidade da igreja (logo + nome + cor)
- Campos: só **E-mail** e **Senha** (sem campo de slug — já está na URL)
- Ao submeter: `POST /api/auth/login` com `{ email, senha }`
- Após sucesso → redireciona para `/dashboard`
- Aplica `--primary` com a cor da igreja igual à landing

**Layout:**
Igual ao login atual (`/login`) mas com nome e logo da igreja no topo em vez de "Igreja do Nazareno" fixo.

---

### 3. Layout compartilhado para rotas públicas por slug

**Arquivo:** `src/routes/$slug.tsx` (layout pai)

- Carrega dados da igreja uma vez via TanStack Query (`queryKey: ['igreja-publica', slug]`)
- Aplica CSS variable `--primary` com a cor da igreja
- Passa dados para filhos via contexto ou outlet context
- Loading state elegante enquanto carrega
- Se 404 → renderiza página de erro

---

### 4. Superadmin — Edição de branding da igreja

**Arquivo:** `src/paginas/igrejas/page.tsx` (já existe — adicionar funcionalidade)

Na listagem de igrejas (superadmin), ao clicar em uma igreja, abrir um **drawer ou modal** com:

**Aba "Dados gerais"** (já existe):
- Nome, slug, plano, ativa

**Aba "Identidade visual"** (nova):
- **Cor primária**: input type="color" + campo de texto hex
  - Preview em tempo real: botão de exemplo com a cor selecionada
- **Logo**: upload de imagem (jpg/png/webp, max 2MB)
  - Preview da imagem após upload
  - Botão "Remover logo"
- **Descrição**: textarea
- **Cidade**: input text
- **Estado**: select com estados brasileiros

Ao salvar:
- Se logo foi alterado: `POST /api/igrejas/:id/logo` (multipart)
- Demais campos: `PUT /api/igrejas/:id`

---

### 5. Atualizar `src/lib/api.ts`

Adicionar:

```typescript
// Público — sem autenticação
getIgrejaPublica: (slug: string) =>
  publicRequest(`/publico/igrejas/${slug}`),

// Superadmin — atualizar branding
atualizarIgreja: (id: string, data: Partial<Igreja>) =>
  request(`/igrejas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

uploadLogoIgreja: (id: string, file: File) => {
  const form = new FormData();
  form.append('logo', file);
  return requestMultipart(`/igrejas/${id}/logo`, form);
},
```

Adicionar função `requestMultipart` (sem Content-Type, deixar o browser setar boundary):
```typescript
async function requestMultipart(path: string, body: FormData) {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, { method: 'POST', headers, body });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(err.error || 'Erro na requisição');
  }
  return res.json();
}
```

---

### 6. Tipos — atualizar `Igreja` em `src/lib/api.ts`

```typescript
export type Igreja = {
  id: string;
  nome: string;
  slug: string;
  ativa?: boolean;
  plano?: string;
  cor_primaria?: string;
  logo_url?: string;
  descricao?: string;
  cidade?: string;
  estado?: string;
};
```

---

## Estrutura de arquivos a criar/modificar

```
src/
├── routes/
│   ├── $slug.tsx              ← NOVO — layout público por slug
│   ├── $slug.index.tsx        ← NOVO — landing da igreja
│   └── $slug.login.tsx        ← NOVO — login da igreja
├── paginas/
│   └── igrejas/
│       └── page.tsx           ← MODIFICAR — adicionar aba identidade visual
└── lib/
    └── api.ts                 ← MODIFICAR — novos endpoints
```

---

## Comportamento de cores

O sistema usa Tailwind CSS v4 com CSS variables. A cor primária padrão é `#b45309`.

Quando uma igreja tem cor diferente, ao entrar na rota `/$slug/*`:
```tsx
useEffect(() => {
  if (igreja?.cor_primaria) {
    document.documentElement.style.setProperty('--primary', igreja.cor_primaria);
  }
  return () => {
    // restaurar cor padrão ao sair
    document.documentElement.style.setProperty('--primary', '#b45309');
  };
}, [igreja?.cor_primaria]);
```

---

## Observações

- As rotas `/$slug` e `/$slug/login` são **públicas** — sem verificação de autenticação
- A rota `/login` existente continua funcionando (acesso direto para admins)
- O slug vem do parâmetro de rota via `useParams()` do TanStack Router
- Loading states em todas as operações de busca e upload
- Mensagens de erro amigáveis
- Responsivo (mobile funcional)
- Não integrar Supabase — toda comunicação via API REST própria em `http://localhost:3031/api`
