# Gemini — Login de Discipuladores + Atribuição de Convertidos

## Contexto do sistema

Multi-tenant SaaS para igrejas. Stack: Node.js + Express + PostgreSQL + JWT. Frontend: React + TanStack Router (file-based) + TanStack Query. Padrão de pasta: `paginas/nome-da-pagina/page.tsx` + `hooks.ts` + `index.ts`. Rotas em `routes/_auth.nome.tsx`.

---

## O que já existe (não mexer)

### Backend
- `perfil = 'discipulador'` já existe no CHECK da tabela `usuarios`
- `discipuladores` já tem coluna `usuario_id UUID REFERENCES usuarios(id)` — vínculo entre discipulador e conta de login
- Middleware `checkPerfil` já trata `discipulador` — injeta `req.discipuladorId` e filtra dados automaticamente
- `GET /api/convertidos` já filtra por discipulador: quando `perfil='discipulador'`, retorna só os convertidos dos grupos dele (via JOIN `grupo_membros → grupos_discipulado → discipuladores`)
- `GET /api/discipuladores` já faz JOIN com `usuarios` e retorna `usuario_nome` e `usuario_email`
- `PUT /api/discipuladores/:id` já aceita `usuario_id` no body

### Frontend
- `paginas/discipuladores/page.tsx` — CRUD de discipuladores (listagem, criar, editar, excluir)
- `routes/_auth.discipuladores.tsx` — rota existente

### Banco
- `grupos_discipulado`: `discipulador_id` — grupo pertence a um discipulador
- `grupo_membros`: `convertido_id + grupo_id` — convertido pertence a um grupo

---

## O que o Gemini deve construir

---

### PARTE 1 — Backend: novo endpoint `POST /api/discipuladores/:id/acesso`

Cria conta de login para um discipulador existente e vincula via `usuario_id`.

**Arquivo:** `backend/src/rotas/discipuladores.js`

Adicionar ANTES do `module.exports`:

```js
// POST /api/discipuladores/:id/acesso — Criar login para discipulador (admin/lider)
router.post('/:id/acesso', checkPerfil(['admin', 'lider']), async (req, res) => {
  const { id } = req.params;
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  try {
    // Verificar se o discipulador existe na igreja
    const discResult = await db.query(
      'SELECT * FROM discipuladores WHERE id = $1 AND igreja_id = $2',
      [id, req.igrejaId]
    );
    if (discResult.rows.length === 0) {
      return res.status(404).json({ error: 'Discipulador não encontrado' });
    }
    const disc = discResult.rows[0];

    // Verificar se já tem conta
    if (disc.usuario_id) {
      return res.status(409).json({ error: 'Discipulador já possui uma conta de acesso' });
    }

    // Verificar se email já está em uso
    const emailCheck = await db.query(
      'SELECT id FROM usuarios WHERE email = $1 AND igreja_id = $2',
      [email, req.igrejaId]
    );
    if (emailCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Email já está em uso nesta igreja' });
    }

    const bcrypt = require('bcrypt');
    const senhaHash = await bcrypt.hash(senha, 10);

    // Criar usuário com perfil discipulador
    const usuarioResult = await db.query(
      `INSERT INTO usuarios (nome, email, senha_hash, perfil, igreja_id)
       VALUES ($1, $2, $3, 'discipulador', $4)
       RETURNING id, nome, email, perfil, ativo`,
      [disc.nome, email, senhaHash, req.igrejaId]
    );
    const usuario = usuarioResult.rows[0];

    // Vincular usuário ao discipulador
    await db.query(
      'UPDATE discipuladores SET usuario_id = $1 WHERE id = $2',
      [usuario.id, id]
    );

    return res.status(201).json({
      message: 'Acesso criado com sucesso',
      usuario: { id: usuario.id, email: usuario.email, perfil: usuario.perfil }
    });
  } catch (err) {
    console.error('Erro ao criar acesso do discipulador:', err);
    return res.status(500).json({ error: 'Erro interno ao criar acesso' });
  }
});
```

---

### PARTE 2 — Backend: `DELETE /api/discipuladores/:id/acesso`

Remove o acesso de login do discipulador (desativa a conta, não deleta).

```js
// DELETE /api/discipuladores/:id/acesso — Revogar login do discipulador (admin/lider)
router.delete('/:id/acesso', checkPerfil(['admin', 'lider']), async (req, res) => {
  const { id } = req.params;
  try {
    const discResult = await db.query(
      'SELECT usuario_id FROM discipuladores WHERE id = $1 AND igreja_id = $2',
      [id, req.igrejaId]
    );
    if (discResult.rows.length === 0) return res.status(404).json({ error: 'Discipulador não encontrado' });
    const { usuario_id } = discResult.rows[0];
    if (!usuario_id) return res.status(404).json({ error: 'Discipulador não possui acesso' });

    // Desativar a conta (não deleta)
    await db.query('UPDATE usuarios SET ativo = false WHERE id = $1', [usuario_id]);
    // Desvincular
    await db.query('UPDATE discipuladores SET usuario_id = NULL WHERE id = $1', [id]);

    return res.json({ message: 'Acesso revogado com sucesso' });
  } catch (err) {
    console.error('Erro ao revogar acesso:', err);
    return res.status(500).json({ error: 'Erro interno ao revogar acesso' });
  }
});
```

---

### PARTE 3 — Backend: `PATCH /api/convertidos/:id/responsavel`

Atribui um discipulador a um convertido. Cria um grupo automaticamente se necessário.

**Arquivo:** `backend/src/rotas/convertidos.js`

Adicionar antes do `module.exports`:

```js
// PATCH /api/convertidos/:id/responsavel — Atribuir discipulador a um convertido (admin/lider)
router.patch('/:id/responsavel', checkPerfil(['admin', 'lider']), async (req, res) => {
  const { id } = req.params; // id do convertido
  const { discipulador_id } = req.body; // pode ser null para remover

  try {
    // Remover de grupos existentes primeiro
    await db.query(
      `DELETE FROM grupo_membros WHERE convertido_id = $1
       AND grupo_id IN (
         SELECT id FROM grupos_discipulado WHERE igreja_id = $2
       )`,
      [id, req.igrejaId]
    );

    if (!discipulador_id) {
      return res.json({ message: 'Responsável removido' });
    }

    // Verificar discipulador
    const disc = await db.query(
      'SELECT * FROM discipuladores WHERE id = $1 AND igreja_id = $2 AND ativo = true',
      [discipulador_id, req.igrejaId]
    );
    if (disc.rows.length === 0) {
      return res.status(404).json({ error: 'Discipulador não encontrado ou inativo' });
    }

    // Buscar ou criar grupo padrão do discipulador
    let grupo = await db.query(
      `SELECT id FROM grupos_discipulado
       WHERE discipulador_id = $1 AND igreja_id = $2 AND status = 'ativo'
       ORDER BY created_at DESC LIMIT 1`,
      [discipulador_id, req.igrejaId]
    );

    let grupoId;
    if (grupo.rows.length === 0) {
      // Criar grupo padrão
      const novoGrupo = await db.query(
        `INSERT INTO grupos_discipulado (igreja_id, nome, discipulador_id, data_inicio, status)
         VALUES ($1, $2, $3, CURRENT_DATE, 'ativo') RETURNING id`,
        [req.igrejaId, `Grupo de ${disc.rows[0].nome}`, discipulador_id]
      );
      grupoId = novoGrupo.rows[0].id;
    } else {
      grupoId = grupo.rows[0].id;
    }

    // Adicionar convertido ao grupo
    await db.query(
      `INSERT INTO grupo_membros (igreja_id, grupo_id, convertido_id)
       VALUES ($1, $2, $3) ON CONFLICT (grupo_id, convertido_id) DO NOTHING`,
      [req.igrejaId, grupoId, id]
    );

    return res.json({
      message: 'Responsável atribuído',
      discipulador: disc.rows[0],
      grupo_id: grupoId
    });
  } catch (err) {
    console.error('Erro ao atribuir responsável:', err);
    return res.status(500).json({ error: 'Erro interno ao atribuir responsável' });
  }
});
```

---

### PARTE 4 — Backend: `GET /api/discipuladores/:id/convertidos`

Lista os convertidos de um discipulador específico.

```js
// GET /api/discipuladores/:id/convertidos — Convertidos de um discipulador (admin/lider/pastor/discipulador)
router.get('/:id/convertidos', checkPerfil(['admin', 'lider', 'pastor', 'discipulador']), async (req, res) => {
  const { id } = req.params;
  try {
    const resultado = await db.query(
      `SELECT DISTINCT nc.id, nc.nome, nc.telefone, nc.data_conversao, nc.status, nc.como_conheceu,
              gd.nome as grupo_nome, gd.id as grupo_id
       FROM novos_convertidos nc
       JOIN grupo_membros gm ON nc.id = gm.convertido_id
       JOIN grupos_discipulado gd ON gm.grupo_id = gd.id
       WHERE gd.discipulador_id = $1 AND nc.igreja_id = $2
       ORDER BY nc.nome ASC`,
      [id, req.igrejaId]
    );
    return res.json(resultado.rows);
  } catch (err) {
    console.error('Erro ao listar convertidos do discipulador:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});
```

---

### PARTE 5 — Frontend: `api.ts` — novos endpoints

**Arquivo:** `frontend v4/src/lib/api.ts`

Adicionar junto com os outros endpoints:

```ts
// Discipuladores — acesso
criarAcessoDiscipulador: (id: string, data: { email: string; senha: string }) =>
  request(`/discipuladores/${id}/acesso`, { method: "POST", body: JSON.stringify(data) }),
revogarAcessoDiscipulador: (id: string) =>
  request(`/discipuladores/${id}/acesso`, { method: "DELETE" }),
getConvertidosDiscipulador: (id: string) =>
  request(`/discipuladores/${id}/convertidos`),

// Convertidos — responsável
atribuirResponsavel: (convertidoId: string, discipuladorId: string | null) =>
  request(`/convertidos/${convertidoId}/responsavel`, {
    method: "PATCH",
    body: JSON.stringify({ discipulador_id: discipuladorId }),
  }),
```

---

### PARTE 6 — Frontend: página Discipuladores com gestão de acesso

**Arquivo:** `frontend v4/src/paginas/discipuladores/page.tsx`

Na listagem de discipuladores, adicionar coluna "Acesso" com:
- Se `usuario_email` preenchido: badge verde "Com acesso" + email + botão "Revogar"
- Se `usuario_email` vazio: badge cinza "Sem acesso" + botão "Criar acesso"

**Modal "Criar acesso"** (ao clicar em "Criar acesso"):
- Campo: E-mail
- Campo: Senha (input type="password")
- Botão: "Criar acesso"
- Chama `api.criarAcessoDiscipulador(id, { email, senha })`
- Ao revogar: `api.revogarAcessoDiscipulador(id)` com confirmação

---

### PARTE 7 — Frontend: atribuir responsável na ficha do convertido

**Arquivo:** `frontend v4/src/paginas/convertidos/[id]/page.tsx` (página de detalhe do convertido)

Adicionar seção "Responsável pelo discipulado":
- Select com lista de discipuladores ativos da igreja (busca via `GET /api/discipuladores`)
- Mostra o discipulador atual se já atribuído
- Botão "Salvar responsável" — chama `api.atribuirResponsavel(convertidoId, discipuladorId)`
- Botão "Remover responsável" se já tem um

---

### PARTE 8 — Frontend: dashboard do discipulador

Quando `usuario.perfil === 'discipulador'`, o dashboard deve mostrar:

**Arquivo:** `frontend v4/src/paginas/dashboard/page.tsx`

Adicionar bloco condicional no topo do dashboard:

```tsx
if (usuario?.perfil === 'discipulador') {
  // Renderizar DashboardDiscipulador em vez do dashboard padrão
}
```

**Arquivo novo:** `frontend v4/src/paginas/dashboard/dashboard-discipulador.tsx`

Conteúdo:
- Título: "Bom te ver, [nome]."
- Cards KPI: total de convertidos sob responsabilidade, com aulas em andamento, sem contato há +30 dias
- Lista dos convertidos com: nome, telefone, data de conversão, botão WhatsApp
- Busca por nome

---

## Sidebar — visibilidade por perfil

**Arquivo:** `frontend v4/src/components/layout/Sidebar.tsx`

O discipulador só deve ver:
- **Dashboard** (o restrito)
- **Meus Convertidos** (link para `/convertidos`)

Todos os outros itens (Membros, Usuários, Relatórios, etc.) devem ser ocultos quando `perfil === 'discipulador'`.

O array de itens da sidebar já deve ter `perfis: [...]` por item — só adicionar `'discipulador'` onde couber.

---

## Resumo das mudanças

| Arquivo | Ação |
|---|---|
| `backend/src/rotas/discipuladores.js` | Adicionar `POST /:id/acesso` e `DELETE /:id/acesso` e `GET /:id/convertidos` |
| `backend/src/rotas/convertidos.js` | Adicionar `PATCH /:id/responsavel` |
| `frontend v4/src/lib/api.ts` | 4 novos endpoints |
| `frontend v4/src/paginas/discipuladores/page.tsx` | Coluna "Acesso" + modal criar/revogar |
| `frontend v4/src/paginas/convertidos/[id]/page.tsx` | Seção "Responsável" com select |
| `frontend v4/src/paginas/dashboard/page.tsx` | Bloco condicional para discipulador |
| `frontend v4/src/paginas/dashboard/dashboard-discipulador.tsx` | CRIAR — dashboard restrito |
| `frontend v4/src/components/layout/Sidebar.tsx` | Ocultar itens por perfil `discipulador` |

## O que NÃO mexer
- Middleware `perfil.js` — já funciona corretamente para discipulador
- `GET /api/convertidos` — já filtra por discipulador automaticamente
- Schema do banco — sem novas tabelas ou colunas
- `$slug/login` e `/login` — fluxo de autenticação já funciona para todos os perfis
