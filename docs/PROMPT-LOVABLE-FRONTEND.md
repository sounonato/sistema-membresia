Crie um sistema web chamado **Sistema de Membresia** — plataforma SaaS multi-tenant para igrejas — usando React + TypeScript + Tailwind CSS.

## Conceito multi-tenant
Cada igreja é um tenant. No login, o usuário informa o slug da sua igreja (ex: "nazareno-fortaleza"). O slug fica salvo no localStorage e é enviado em todas as chamadas. Existe um perfil `superadmin` que acessa um painel global para gerenciar igrejas.

## Identidade visual
- Paleta: tons de âmbar/dourado (`#92400e`, `#b45309`, `#d97706`) sobre fundo branco/pedra (`#fafaf9`, `#f5f5f4`)
- Tipografia: serif para títulos (`font-serif`), sans-serif para corpo
- Cards arredondados (`rounded-2xl`), bordas suaves, visual clean e ministerial
- Sem dark mode

## Autenticação

### Tela de login
- Campo: **Slug da Igreja** (ex: `nazareno-fortaleza`) com texto de ajuda "Fornecido pelo administrador"
- Campo: E-mail
- Campo: Senha
- Botão entrar
- Superadmin: deixa o campo slug em branco

### Após login
- Salvar em localStorage: `token`, `usuario` (JSON), `slug`
- Redirecionar para `/dashboard`

### AuthContext
Expor: `usuario`, `token`, `slug`, `login()`, `logout()`
`usuario` contém: `{ id, nome, perfil, igreja_id, igreja_nome }`
Perfis: `superadmin`, `admin`, `lider`, `pastor`, `discipulador`

## Layout base

### Sidebar (fixa, lateral)
- Nome da igreja do usuário logado no topo (ou "Painel Global" para superadmin)
- Itens para admin/lider/pastor/discipulador: Dashboard, Convertidos, Discipulado, Discipuladores, Módulos, Usuários *(só admin/lider)*, Consultar Manual
- Itens para superadmin: Igrejas, Usuários Globais
- Nome, perfil e igreja do usuário na base da sidebar
- Botão sair

## Páginas — Usuários de igreja (admin, lider, pastor, discipulador)

### `/dashboard`
- 4 cards: Total de Convertidos, Grupos Ativos, Batizados, Aguardando Discipulado
- Gráfico de barras: Convertidos por mês (últimos 6 meses)
- Gráfico de pizza: Distribuição por gênero
- Dados de `GET /api/dashboard/stats`

### `/convertidos`
- Tabela com busca por nome ou telefone
- Colunas: Nome, Telefone, Data da Conversão, Status, Ações (Ver, Editar, Excluir)
- Editar e Excluir só para admin/lider
- Botão "Novo Convertido" (admin/lider)

### `/convertidos/novo`
Formulário em cards por seção:

**Dados Pessoais**
- Nome completo (obrigatório), Telefone/WhatsApp (obrigatório), E-mail
- Data de nascimento, Estado civil (Solteiro, Casado, Divorciado, Viúvo, União Estável)
- Gênero (Masculino, Feminino), Profissão
- Tem filhos? (checkbox → quantidade)

**Endereço**
- Endereço, Bairro, Cidade

**Informações da Conversão**
- Data da conversão (obrigatório)
- Como conheceu a igreja (Amigo, Familiar, Redes Sociais, Evento, Culto, Outro)

**Informações de Fé**
- É batizado?, Quer se batizar?, Frequentava outra igreja? (→ Qual?), Já fez discipulado?
- Observações / Pedido de oração

### `/convertidos/:id`
- Dados completos em cards por seção
- Botões Editar e Excluir (admin/lider)

### `/convertidos/:id/editar`
- Mesmo formulário pré-preenchido

### `/discipulado`
- Lista de grupos: Nome, Discipulador, Módulo, Qtd Membros, Status (badge)
- Botão "Novo Grupo" (admin/lider)

### `/discipulado/:id`
- Header: nome, discipulador, módulo, data início, status
- Seção Membros: lista + busca para adicionar + remover (admin/lider)
- Seção Progresso: aulas com número, data, checkbox concluída, observações

### `/discipuladores`
- Tabela: Nome, Telefone, E-mail, Qtd Grupos, Ativo
- CRUD via modal (admin/lider)

### `/modulos`
- Lista: Nome, Descrição, Total Aulas, Ordem
- CRUD via modal (admin/lider)

### `/usuarios` *(admin/lider)*
- Lista da igreja: Nome, E-mail, Perfil, Ativo
- Criar usuário (modal): nome, email, senha, perfil
- Ativar/desativar

### `/manual` (IA)
- Chat estilo WhatsApp
- Mensagens usuário à direita (fundo âmbar), IA à esquerda (fundo branco)
- 5 chips de sugestão:
  - "O que é a Igreja do Nazareno?"
  - "Quais são os artigos de fé?"
  - "Como é o processo de batismo?"
  - "O que diz o manual sobre dízimo?"
  - "Quais são os rituais da igreja?"
- Loading spinner e scroll automático

---

## Páginas — Superadmin

### `/igrejas`
- Tabela: Nome, Slug, Cidade, Plano, Ativa
- Botão "Nova Igreja" → modal: nome, slug, cidade, estado, plano (básico/pro/premium)
- Botão Ativar/Desativar por igreja
- Botão "Criar Admin" por igreja → modal: nome, email, senha

---

## Integração com API

Base URL: `http://localhost:3031/api`

Criar `src/lib/api.ts`:

```typescript
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3031/api'

function getToken(): string | null {
  return localStorage.getItem('token')
}

async function request<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
      ...(options.headers as Record<string, string>),
    },
  })

  if (res.status === 401) {
    localStorage.clear()
    window.location.href = '/login'
    throw new Error('Sessão expirada')
  }

  const body = await res.json()
  if (!res.ok) throw new Error(body.error ?? `Erro ${res.status}`)
  return body
}

export const api = {
  // Auth
  login: (email: string, senha: string, slug?: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, senha, slug }) }),
  me: () => request('/auth/me'),
  getUsuarios: () => request('/auth/usuarios'),
  createUsuario: (data: unknown) => request('/auth/usuarios', { method: 'POST', body: JSON.stringify(data) }),
  toggleUsuario: (id: string) => request(`/auth/usuarios/${id}/toggle`, { method: 'PATCH' }),

  // Igrejas (superadmin)
  getIgrejas: () => request('/igrejas'),
  createIgreja: (data: unknown) => request('/igrejas', { method: 'POST', body: JSON.stringify(data) }),
  toggleIgreja: (id: string) => request(`/igrejas/${id}/toggle`, { method: 'PATCH' }),
  createIgrejaAdmin: (id: string, data: unknown) => request(`/igrejas/${id}/admin`, { method: 'POST', body: JSON.stringify(data) }),

  // Convertidos
  getConvertidos: () => request('/convertidos'),
  getConvertido: (id: string) => request(`/convertidos/${id}`),
  createConvertido: (data: unknown) => request('/convertidos', { method: 'POST', body: JSON.stringify(data) }),
  updateConvertido: (id: string, data: unknown) => request(`/convertidos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteConvertido: (id: string) => request(`/convertidos/${id}`, { method: 'DELETE' }),

  // Discipulado
  getGrupos: () => request('/discipulado/grupos'),
  getGrupo: (id: string) => request(`/discipulado/grupos/${id}`),
  createGrupo: (data: unknown) => request('/discipulado/grupos', { method: 'POST', body: JSON.stringify(data) }),
  updateGrupo: (id: string, data: unknown) => request(`/discipulado/grupos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  addMembro: (grupoId: string, convertidoId: string) =>
    request(`/discipulado/grupos/${grupoId}/membros`, { method: 'POST', body: JSON.stringify({ convertido_id: convertidoId }) }),
  removeMembro: (grupoId: string, convertidoId: string) =>
    request(`/discipulado/grupos/${grupoId}/membros/${convertidoId}`, { method: 'DELETE' }),
  getProgresso: (grupoId: string) => request(`/discipulado/grupos/${grupoId}/progresso`),
  addProgresso: (grupoId: string, data: unknown) =>
    request(`/discipulado/grupos/${grupoId}/progresso`, { method: 'POST', body: JSON.stringify(data) }),

  // Discipuladores
  getDiscipuladores: () => request('/discipuladores'),
  createDiscipulador: (data: unknown) => request('/discipuladores', { method: 'POST', body: JSON.stringify(data) }),
  updateDiscipulador: (id: string, data: unknown) => request(`/discipuladores/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDiscipulador: (id: string) => request(`/discipuladores/${id}`, { method: 'DELETE' }),

  // Módulos
  getModulos: () => request('/modulos'),
  createModulo: (data: unknown) => request('/modulos', { method: 'POST', body: JSON.stringify(data) }),
  updateModulo: (id: string, data: unknown) => request(`/modulos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteModulo: (id: string) => request(`/modulos/${id}`, { method: 'DELETE' }),

  // Dashboard
  getDashboardStats: () => request('/dashboard/stats'),

  // IA Manual
  chatManual: (pergunta: string, historico: { role: string; content: string }[]) =>
    request('/manual/chat', { method: 'POST', body: JSON.stringify({ pergunta, historico }) }),
}
```

## Estrutura de pastas

```
src/
├── App.tsx
├── main.tsx
├── contexts/
│   └── AuthContext.tsx
├── lib/
│   └── api.ts
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx
│   │   └── Sidebar.tsx
│   └── ui/
│       ├── Button.tsx, Input.tsx, Select.tsx
│       ├── Card.tsx, Badge.tsx, Modal.tsx, Textarea.tsx
└── pages/
    ├── login/page.tsx + hooks.ts
    ├── dashboard/page.tsx + hooks.ts
    ├── convertidos/
    │   ├── page.tsx + hooks.ts
    │   ├── novo/page.tsx + hooks.ts
    │   └── [id]/page.tsx + hooks.ts + editar/page.tsx + hooks.ts
    ├── discipulado/page.tsx + hooks.ts + [id]/page.tsx + hooks.ts
    ├── discipuladores/page.tsx + hooks.ts
    ├── modulos/page.tsx + hooks.ts
    ├── usuarios/page.tsx + hooks.ts
    ├── manual/page.tsx + hooks.ts
    └── igrejas/page.tsx + hooks.ts   ← só superadmin
```

## Proteção de rotas

- Não autenticado → redireciona para `/login`
- `superadmin` → acessa apenas `/igrejas` e `/usuarios` globais, não vê menu de convertidos/discipulado
- `pastor` → vê tudo mas não vê botões de criar/editar/excluir
- `discipulador` → acessa Dashboard, Discipulado (só seus grupos), Consultar Manual

## Observações finais
- Loading state em todos os botões
- Confirmação antes de excluir (dialog)
- Toast de sucesso/erro após operações
- Responsivo: sidebar colapsa em mobile
- **Não usar Supabase** — toda comunicação via `src/lib/api.ts` apontando para `http://localhost:3031/api`
- Usar `@tanstack/react-query` para cache
- Mostrar o nome da igreja logada em destaque na sidebar
