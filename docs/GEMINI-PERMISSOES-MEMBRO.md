# Gemini — Permissões de acesso na ficha do membro

## Contexto do sistema

Multi-tenant SaaS para igrejas. Stack: Node.js + Express + PostgreSQL + JWT. Frontend: React + TanStack Router (file-based) + TanStack Query. Padrão de pasta: `paginas/nome/page.tsx` + `hooks.ts` + `index.ts`.

---

## Objetivo

Adicionar um card "Acesso ao sistema" na ficha do membro (`/membros/:id`) onde o admin/lider pode:
- Ver se o membro já tem uma conta de login vinculada
- Criar acesso (email + senha + perfil) diretamente da ficha
- Trocar o perfil do usuário vinculado
- Revogar o acesso

**Escopo: apenas `membros`.** A tabela `novos_convertidos` não tem `usuario_id` — não mexer nela.

---

## O que já existe (não mexer)

### Banco
- `membros.usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL` — já existe, sem migration necessária
- `discipuladores.usuario_id` — mesmo padrão, já implementado na sessão anterior

### Backend
- `POST /api/autenticacao/usuarios` — cria usuário (admin/lider)
- `PATCH /api/autenticacao/usuarios/:id/toggle` — ativa/desativa
- `GET /api/membros/:id` — retorna dados do membro mas **sem JOIN em `usuarios`** (isso vai mudar)

### Frontend
- `frontend v4/src/lib/api.ts` — já tem `getUsuarios`, `criarUsuario`, `toggleUsuario`
- `frontend v4/src/paginas/membros/[id]/page.tsx` — página de detalhe do membro (vai receber o novo card)

---

## O que o Gemini deve construir

---

### PARTE 1 — Backend: `PATCH /api/autenticacao/usuarios/:id/perfil`

Novo endpoint para trocar o perfil de um usuário existente.

**Arquivo:** `backend/src/rotas/autenticacao.js`

Adicionar após o endpoint `toggle` (linha ~185), antes do `module.exports`:

```js
// PATCH /api/autenticacao/usuarios/:id/perfil — Trocar perfil de um usuário (admin/lider)
router.patch('/usuarios/:id/perfil', autenticar, identificarTenant, checkPerfil(['admin', 'lider']), async (req, res) => {
  const { id } = req.params;
  const { perfil } = req.body;

  const perfisValidos = ['admin', 'lider', 'pastor', 'discipulador'];
  if (!perfil || !perfisValidos.includes(perfil)) {
    return res.status(400).json({ error: 'Perfil inválido. Use: admin, lider, pastor ou discipulador' });
  }

  try {
    const usuarioRes = await db.query(
      'SELECT ativo, igreja_id, perfil FROM usuarios WHERE id = $1',
      [id]
    );
    if (usuarioRes.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    const usuarioAlvo = usuarioRes.rows[0];

    // Impedir alteração de superadmin
    if (usuarioAlvo.perfil === 'superadmin') {
      return res.status(403).json({ error: 'Não é possível alterar o perfil de um superadmin' });
    }

    // Isolamento de tenant: não pode alterar usuário de outra igreja
    if (req.usuarioPerfil !== 'superadmin' && usuarioAlvo.igreja_id !== req.igrejaId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const resultado = await db.query(
      'UPDATE usuarios SET perfil = $1 WHERE id = $2 RETURNING id, nome, email, perfil, ativo',
      [perfil, id]
    );

    return res.json(resultado.rows[0]);
  } catch (err) {
    console.error('Erro ao alterar perfil:', err);
    return res.status(500).json({ error: 'Erro interno ao alterar perfil' });
  }
});
```

---

### PARTE 2 — Backend: `POST /api/membros/:id/acesso` e `DELETE /api/membros/:id/acesso`

Criar e revogar conta de login a partir da ficha do membro.

**Arquivo:** `backend/src/rotas/membros.js`

Adicionar antes do `module.exports` (mesmo padrão já feito em `discipuladores.js`):

```js
// POST /api/membros/:id/acesso — Criar login para membro (admin/lider)
router.post('/:id/acesso', checkPerfil(['admin', 'lider']), async (req, res) => {
  const { id } = req.params;
  const { email, senha, perfil } = req.body;

  const perfisValidos = ['admin', 'lider', 'pastor', 'discipulador'];
  if (!email || !senha || !perfil || !perfisValidos.includes(perfil)) {
    return res.status(400).json({ error: 'Email, senha e perfil válido são obrigatórios' });
  }

  try {
    const membroRes = await db.query(
      'SELECT * FROM membros WHERE id = $1 AND igreja_id = $2',
      [id, req.igrejaId]
    );
    if (membroRes.rows.length === 0) {
      return res.status(404).json({ error: 'Membro não encontrado' });
    }
    const membro = membroRes.rows[0];

    if (membro.usuario_id) {
      return res.status(409).json({ error: 'Membro já possui uma conta de acesso' });
    }

    const emailCheck = await db.query(
      'SELECT id FROM usuarios WHERE email = $1 AND igreja_id = $2',
      [email, req.igrejaId]
    );
    if (emailCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Este e-mail já está em uso nesta igreja' });
    }

    const bcrypt = require('bcrypt');
    const senhaHash = await bcrypt.hash(senha, 10);

    const usuarioResult = await db.query(
      `INSERT INTO usuarios (nome, email, senha_hash, perfil, igreja_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nome, email, perfil, ativo`,
      [membro.nome, email, senhaHash, perfil, req.igrejaId]
    );
    const usuario = usuarioResult.rows[0];

    await db.query(
      'UPDATE membros SET usuario_id = $1 WHERE id = $2',
      [usuario.id, id]
    );

    return res.status(201).json({
      message: 'Acesso criado com sucesso',
      usuario: { id: usuario.id, email: usuario.email, perfil: usuario.perfil }
    });
  } catch (err) {
    console.error('Erro ao criar acesso do membro:', err);
    return res.status(500).json({ error: 'Erro interno ao criar acesso' });
  }
});

// DELETE /api/membros/:id/acesso — Revogar login do membro (admin/lider)
router.delete('/:id/acesso', checkPerfil(['admin', 'lider']), async (req, res) => {
  const { id } = req.params;
  try {
    const membroRes = await db.query(
      'SELECT usuario_id FROM membros WHERE id = $1 AND igreja_id = $2',
      [id, req.igrejaId]
    );
    if (membroRes.rows.length === 0) return res.status(404).json({ error: 'Membro não encontrado' });
    const { usuario_id } = membroRes.rows[0];
    if (!usuario_id) return res.status(404).json({ error: 'Membro não possui acesso' });

    // Desativar a conta (não deleta para preservar histórico)
    await db.query('UPDATE usuarios SET ativo = false WHERE id = $1', [usuario_id]);
    // Desvincular
    await db.query('UPDATE membros SET usuario_id = NULL WHERE id = $1', [id]);

    return res.json({ message: 'Acesso revogado com sucesso' });
  } catch (err) {
    console.error('Erro ao revogar acesso do membro:', err);
    return res.status(500).json({ error: 'Erro interno ao revogar acesso' });
  }
});
```

---

### PARTE 3 — Backend: JOIN com `usuarios` no `GET /api/membros/:id`

O endpoint atual já faz `Promise.all` com 4 queries. Adicionar o JOIN ao usuário vinculado.

**Arquivo:** `backend/src/rotas/membros.js`

Na função `GET /:id`, na query principal do membro (a que faz `SELECT m.*, c.nome AS conjuge_nome_cadastrado...`), adicionar o LEFT JOIN:

```js
// Substituir a query atual do membro por esta:
db.query(
  `SELECT
    m.*,
    c.nome AS conjuge_nome_cadastrado,
    nc.nome AS convertido_nome,
    u.id AS usuario_id_vinculado,
    u.email AS usuario_email,
    u.perfil AS usuario_perfil,
    u.ativo AS usuario_ativo
  FROM membros m
  LEFT JOIN membros c ON m.conjuge_id = c.id
  LEFT JOIN novos_convertidos nc ON m.convertido_id = nc.id
  LEFT JOIN usuarios u ON m.usuario_id = u.id
  WHERE m.id = $1 AND m.igreja_id = $2`,
  [id, req.igrejaId]
),
```

> **Atenção:** o campo `m.usuario_id` já existe na tabela mas o alias `u.id AS usuario_id_vinculado` evita colisão com o `m.*`. A resposta vai incluir `usuario_email`, `usuario_perfil`, `usuario_ativo` quando o membro tiver conta vinculada, ou `null` quando não tiver.

---

### PARTE 4 — Frontend: `api.ts` — novos endpoints

**Arquivo:** `frontend v4/src/lib/api.ts`

Adicionar junto com os outros endpoints de membros e autenticação:

```ts
// Membros — acesso ao sistema
criarAcessoMembro: (id: string, data: { email: string; senha: string; perfil: string }) =>
  request(`/membros/${id}/acesso`, { method: "POST", body: JSON.stringify(data) }),
revogarAcessoMembro: (id: string) =>
  request(`/membros/${id}/acesso`, { method: "DELETE" }),

// Usuários — trocar perfil
alterarPerfilUsuario: (usuarioId: string, perfil: string) =>
  request(`/auth/usuarios/${usuarioId}/perfil`, { method: "PATCH", body: JSON.stringify({ perfil }) }),
```

---

### PARTE 5 — Frontend: card "Acesso ao sistema" na ficha do membro

**Arquivo:** `frontend v4/src/paginas/membros/[id]/page.tsx`

A página já exibe vários cards (dados pessoais, ministérios, cargos, etc.). Adicionar um novo card "Acesso ao sistema" que só aparece para `admin` e `lider`.

**Comportamento:**

**Se `usuario_email` for `null` (sem conta):**
```
[ Sem acesso ao sistema ]  — badge cinza
Botão: "Criar acesso"  → abre modal
```

**Se `usuario_email` tiver valor (com conta):**
```
[ usuario@email.com ]  — badge verde se ativo, vermelho se inativo
Perfil atual: [select com admin/lider/pastor/discipulador]
Botão: "Salvar perfil"
Botão: "Revogar acesso"  (com confirmação)
```

**Modal "Criar acesso":**
- Campo: E-mail (pré-preenche com o email do membro se disponível)
- Campo: Senha (type="password")
- Select: Perfil (admin / lider / pastor / discipulador)
- Botão: "Criar acesso"
- Chama `api.criarAcessoMembro(id, { email, senha, perfil })`

**Aviso especial — membro que também é discipulador:**

Se `membro.discipulador_id` existir (o membro tem vínculo como discipulador), exibir um aviso antes de criar ou alterar o acesso:

```
⚠ Este membro também está cadastrado como discipulador.
  O acesso criado aqui será compartilhado com o registro de discipulador.
```

> **Query key TanStack Query:** ao invalidar após criar/revogar acesso ou trocar perfil, invalidar **tanto** `["membro", id]` **quanto** `["usuarios"]` para manter a página `/usuarios` sincronizada.

---

### PARTE 6 — Frontend: hooks

**Arquivo:** `frontend v4/src/paginas/membros/[id]/hooks.ts` (ou onde estiverem os hooks da ficha)

Adicionar:

```ts
export function useCriarAcessoMembro(membroId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { email: string; senha: string; perfil: string }) =>
      api.criarAcessoMembro(membroId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["membro", membroId] });
      qc.invalidateQueries({ queryKey: ["usuarios"] });
    },
  });
}

export function useRevogarAcessoMembro(membroId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.revogarAcessoMembro(membroId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["membro", membroId] });
      qc.invalidateQueries({ queryKey: ["usuarios"] });
    },
  });
}

export function useAlterarPerfilUsuario(membroId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ usuarioId, perfil }: { usuarioId: string; perfil: string }) =>
      api.alterarPerfilUsuario(usuarioId, perfil),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["membro", membroId] });
      qc.invalidateQueries({ queryKey: ["usuarios"] });
    },
  });
}
```

---

## Resumo das mudanças

| Arquivo | Ação |
|---|---|
| `backend/src/rotas/autenticacao.js` | Adicionar `PATCH /usuarios/:id/perfil` |
| `backend/src/rotas/membros.js` | Adicionar `POST /:id/acesso` e `DELETE /:id/acesso`; alterar query do `GET /:id` para JOIN com `usuarios` |
| `frontend v4/src/lib/api.ts` | 3 novos endpoints |
| `frontend v4/src/paginas/membros/[id]/page.tsx` | Card "Acesso ao sistema" com criar/trocar/revogar |
| `frontend v4/src/paginas/membros/[id]/hooks.ts` | 3 novos hooks com invalidação dupla |

## O que NÃO mexer

- Tabela `novos_convertidos` — sem `usuario_id`, fora do escopo
- Página `/usuarios` — continua funcionando normalmente; os hooks invalidam o cache dela
- `discipuladores.js` — não tocar; o padrão de acesso do discipulador está separado
- Middleware `perfil.js` — já funciona corretamente
- Schema do banco — sem novas colunas nem tabelas
