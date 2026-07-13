# Gemini — Aplicar branding da igreja no painel autenticado

## Contexto do sistema

Multi-tenant SaaS para igrejas. Stack: Node.js + Express + PostgreSQL + JWT. Frontend: React + TanStack Router (file-based) + TanStack Query + Tailwind CSS v4.

---

## O que já está pronto (não mexer)

### Banco
- `igrejas` já tem: `cor_primaria TEXT DEFAULT '#b45309'`, `logo_url TEXT`, `descricao TEXT`, `cidade TEXT`, `estado TEXT`
- Migration `003_branding_igrejas.sql` já aplicada em produção

### Backend
- `GET /api/publico/igrejas/:slug` — retorna branding público (sem auth)
- `GET /api/auth/me` — retorna dados do usuário logado incluindo `igreja_id`, `igreja_nome`, `igreja_slug`
- `PUT /api/igrejas/:id` — superadmin pode editar `cor_primaria`, `descricao`, `cidade`, `estado`
- `POST /api/igrejas/:id/logo` — upload de logo

### Frontend — branding já funciona FORA do painel
- `/$slug/` — landing page da igreja usa `cor_primaria` e `logo_url`
- `/$slug/login` — login com branding usa `cor_primaria` e `logo_url`
- `frontend v4/src/routes/$slug.tsx` — já aplica `document.documentElement.style.setProperty("--primary", cor)` para as rotas `/$slug/*`
- `frontend v4/src/paginas/igrejas/page.tsx` — superadmin edita cor + logo com preview

### O que está faltando

**Dentro do painel autenticado (`/_auth.*`), a `cor_primaria` da igreja do usuário logado não é aplicada.**

Hoje, quando um usuário loga, o painel usa sempre a cor padrão `#b45309` (âmbar) independente da `cor_primaria` configurada pela igreja. Precisa:

1. Buscar a `cor_primaria` e `logo_url` da igreja do usuário após o login
2. Aplicar `--primary` como CSS variable no `document.documentElement`
3. Mostrar o logo da igreja na sidebar no lugar do texto "Ovile."

---

## O que o Gemini deve construir

---

### PARTE 1 — Backend: `GET /api/auth/me` retornar `cor_primaria` e `logo_url`

**Arquivo:** `backend/src/rotas/autenticacao.js`

O endpoint `GET /api/autenticacao/me` já faz JOIN com `igrejas`. Adicionar `cor_primaria` e `logo_url` ao SELECT:

```js
// Localizar a query existente do GET /me e substituir por:
const resultado = await db.query(
  `SELECT u.id, u.nome, u.email, u.perfil, u.ativo, u.igreja_id, u.created_at,
          i.nome as igreja_nome, i.slug as igreja_slug,
          i.cor_primaria as igreja_cor, i.logo_url as igreja_logo
   FROM usuarios u
   LEFT JOIN igrejas i ON u.igreja_id = i.id
   WHERE u.id = $1`,
  [req.usuarioId]
);
```

A resposta passa a incluir `igreja_cor` e `igreja_logo`.

---

### PARTE 2 — Frontend: `AuthContext.tsx` — armazenar `igreja_cor` e `igreja_logo`

**Arquivo:** `frontend v4/src/contexts/AuthContext.tsx`

O contexto já armazena `usuario` com `igreja_id`, `igreja_nome`, `igreja_slug`. Adicionar `igreja_cor` e `igreja_logo` ao tipo e ao estado:

```ts
// No tipo Usuario (ou onde estiver definido), adicionar:
igreja_cor?: string;
igreja_logo?: string;
```

Após o `api.me()` retornar os dados, já mapeá-los no objeto `usuario`.

---

### PARTE 3 — Frontend: aplicar cor no painel autenticado

**Arquivo:** `frontend v4/src/routes/_auth.tsx`

No componente `AuthLayout`, adicionar um `useEffect` que aplica a cor da igreja quando `usuario` estiver disponível:

```tsx
// Adicionar após os useEffects existentes de navegação:
useEffect(() => {
  const cor = usuario?.igreja_cor;
  if (cor) {
    document.documentElement.style.setProperty("--primary", cor);
  } else {
    document.documentElement.style.removeProperty("--primary");
  }
  return () => {
    // Limpa ao deslogar
    document.documentElement.style.removeProperty("--primary");
  };
}, [usuario?.igreja_cor]);
```

---

### PARTE 4 — Frontend: logo da igreja na Sidebar

**Arquivo:** `frontend v4/src/components/layout/Sidebar.tsx`

A sidebar atualmente exibe o texto `"Ovile."` como marca. Quando a igreja tiver `logo_url`, exibir o logo. Caso contrário, manter o texto.

Localizar onde está o logo/nome fixo na sidebar (provavelmente um `<Link to="/">` com texto `"Ovile."`) e substituir por:

```tsx
{usuario?.igreja_logo ? (
  <img
    src={usuario.igreja_logo}
    alt={usuario.igreja_nome ?? "Logo"}
    className="h-8 w-auto object-contain"
  />
) : (
  <span className="font-serif text-xl tracking-tight">
    {usuario?.igreja_nome ?? "Ovile"}<span style={{ color: "var(--primary)" }}>.</span>
  </span>
)}
```

---

### PARTE 5 — Frontend: `api.ts` — tipo `Usuario` atualizado

**Arquivo:** `frontend v4/src/lib/api.ts`

Localizar o tipo `Usuario` (ou interface equivalente) e adicionar os dois campos novos:

```ts
igreja_cor?: string;
igreja_logo?: string;
```

---

## Resumo das mudanças

| Arquivo | Ação |
|---|---|
| `backend/src/rotas/autenticacao.js` | `GET /me` passa a retornar `igreja_cor` e `igreja_logo` |
| `frontend v4/src/contexts/AuthContext.tsx` | Tipo e estado incluem `igreja_cor` e `igreja_logo` |
| `frontend v4/src/routes/_auth.tsx` | `useEffect` aplica `--primary` CSS var ao entrar no painel |
| `frontend v4/src/components/layout/Sidebar.tsx` | Logo da igreja substitui o texto "Ovile." quando disponível |
| `frontend v4/src/lib/api.ts` | Tipo `Usuario` com 2 campos novos |

## O que NÃO mexer

- `/$slug/` e `/$slug/login` — já têm branding funcionando, não tocar
- `migracoes/003_branding_igrejas.sql` — já aplicado em produção
- `paginas/igrejas/page.tsx` — edição de branding pelo superadmin já funciona
- `GET /api/publico/igrejas/:slug` — já funciona
- Schema do banco — sem novas colunas

## Teste esperado

1. Superadmin configura cor `#1d4ed8` (azul) e logo para a "Igreja Batista Central"
2. Usuário da Igreja Batista Central faz login em `/login`
3. Sidebar exibe o logo da igreja (se configurado) ou o nome da igreja
4. Toda a UI do painel usa azul como cor primária (botões, badges, links)
5. Usuário da Igreja Nazareno continua vendo âmbar — cada igreja isolada
