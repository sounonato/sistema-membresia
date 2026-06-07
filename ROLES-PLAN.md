# Plano: Controle de Permissões por Perfil

## Regras de negócio

| Perfil | O que pode fazer |
|---|---|
| **admin** | Tudo (igual ao líder) |
| **lider** | Tudo: criar, editar, excluir convertidos, grupos, discipuladores, módulos, usuários |
| **pastor** | Visão completa (igual ao líder), mas **somente leitura** — não pode criar nem editar nada |
| **discipulador** | Apenas seus próprios grupos: ver membros e marcar aulas como realizadas |

---

## Arquivo 1 — `src/contexts/AuthContext.tsx`

Substituir o bloco do Provider pelo código abaixo. A mudança principal é:
- `isLider` passa a ser só `['admin', 'lider']` (exclui pastor)
- Adicionar `canEdit` = mesmo que isLider
- Adicionar `isLiderOrPastor` = `['admin', 'pastor', 'lider']`
- `isPastor` = só `'pastor'` (não inclui admin)

**Substituir apenas o return do AuthProvider:**

```tsx
  return (
    <AuthContext.Provider value={{
      user, session, profile, loading,
      signIn, signOut,
      isAdmin: profile?.perfil === 'admin',
      isPastor: profile?.perfil === 'pastor',
      isLider: ['admin', 'lider'].includes(profile?.perfil ?? ''),
      isLiderOrPastor: ['admin', 'pastor', 'lider'].includes(profile?.perfil ?? ''),
      canEdit: ['admin', 'lider'].includes(profile?.perfil ?? ''),
      isDiscipulador: profile?.perfil === 'discipulador',
    }}>
      {children}
    </AuthContext.Provider>
  )
```

**Substituir também a interface AuthContextValue:**

```tsx
interface AuthContextValue {
  user: User | null
  session: Session | null
  profile: Usuario | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  isAdmin: boolean
  isPastor: boolean
  isLider: boolean         // admin | lider — acesso de escrita total
  isLiderOrPastor: boolean // admin | pastor | lider — pode VER área do líder
  canEdit: boolean         // alias de isLider — usar nos botões de ação
  isDiscipulador: boolean  // apenas discipulador — acesso restrito
}
```

---

## Arquivo 2 — `src/App.tsx`

### Adicionar `LiderOrPastorRoute` (logo após o `LiderRoute` existente):

```tsx
function LiderOrPastorRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isLiderOrPastor } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (!isLiderOrPastor) return <Navigate to="/" replace />
  return <AppShell>{children}</AppShell>
}
```

### Atualizar as rotas — trocar LiderRoute por LiderOrPastorRoute nas páginas de visualização:

```tsx
{/* Rotas de VISUALIZAÇÃO — pastor também pode acessar */}
<Route path="/convertidos" element={<LiderOrPastorRoute><Convertidos /></LiderOrPastorRoute>} />
<Route path="/convertidos/:id" element={<LiderOrPastorRoute><ConvertidoDetalhe /></LiderOrPastorRoute>} />
<Route path="/discipulado" element={<PrivateRoute><Discipulado /></PrivateRoute>} />
<Route path="/discipulado/:id" element={<PrivateRoute><GrupoDetalhe /></PrivateRoute>} />
<Route path="/discipuladores" element={<LiderOrPastorRoute><Discipuladores /></LiderOrPastorRoute>} />
<Route path="/modulos" element={<LiderOrPastorRoute><Modulos /></LiderOrPastorRoute>} />

{/* Rotas de ESCRITA — somente admin e lider */}
<Route path="/convertidos/novo" element={<LiderRoute><NovoConvertido /></LiderRoute>} />
<Route path="/convertidos/:id/editar" element={<LiderRoute><EditarConvertido /></LiderRoute>} />
<Route path="/usuarios" element={<LiderRoute><GerenciarUsuarios /></LiderRoute>} />
```

---

## Arquivo 3 — `src/pages/Convertidos.tsx`

Trocar `isLider` por `canEdit` no botão "Novo Convertido":

```tsx
// ANTES:
const { isLider } = useAuth()
// ...
{isLider && (
  <Link to="/convertidos/novo">
    <Button>...</Button>
  </Link>
)}

// DEPOIS:
const { canEdit } = useAuth()
// ...
{canEdit && (
  <Link to="/convertidos/novo">
    <Button>...</Button>
  </Link>
)}
```

---

## Arquivo 4 — `src/pages/ConvertidoDetalhe.tsx`

Importar `canEdit` do useAuth e envolver os 3 botões (Editar, Status, Excluir):

```tsx
// Adicionar canEdit no destructuring:
const { canEdit } = useAuth()

// Envolver os botões de ação:
{canEdit && (
  <div className="flex flex-col gap-2">
    <Button size="sm" variant="outline" onClick={() => navigate(`/convertidos/${id}/editar`)}>
      <Pencil size={13} />
      Editar
    </Button>
    <Button size="sm" variant="outline" onClick={() => { setNovoStatus(convertido.status); setShowStatusDialog(true) }}>
      <Edit size={13} />
      Status
    </Button>
    <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setShowDeleteDialog(true)}>
      <Trash2 size={13} />
      Excluir
    </Button>
  </div>
)}
```

---

## Arquivo 5 — `src/pages/Discipulado.tsx`

Trocar `isLider` por `canEdit` no botão "Novo Grupo" e na lógica de filtro de dados:

```tsx
// ANTES:
const { isLider, isDiscipulador, user } = useAuth()
// ...
{isLider && (
  <Button onClick={...}>Novo Grupo</Button>
)}

// DEPOIS:
const { canEdit, isLiderOrPastor, isDiscipulador, user } = useAuth()
// ...
{canEdit && (
  <Button onClick={...}>Novo Grupo</Button>
)}
```

Na query que filtra grupos, atualizar o `enabled`:
```tsx
// ANTES:
enabled: isLider || (isDiscipulador && meuDiscipulador !== undefined)
// DEPOIS:
enabled: isLiderOrPastor || (isDiscipulador && meuDiscipulador !== undefined)
```

---

## Arquivo 6 — `src/pages/GrupoDetalhe.tsx`

Importar `canEdit` e `isDiscipulador` do useAuth. O discipulador pode MARCAR aulas, mas o pastor NÃO pode fazer nada.

```tsx
const { canEdit, isDiscipulador } = useAuth()
const podeMarcarAula = canEdit || isDiscipulador
```

Envolver o botão "Adicionar membro" com `canEdit`:
```tsx
{canEdit && (
  <Button size="sm" variant="secondary" onClick={() => setShowAddMembro(true)}>
    <UserPlus size={14} />
    Adicionar membro
  </Button>
)}
```

Envolver o botão de remover membro com `canEdit`:
```tsx
{canEdit && (
  <button onClick={() => setConfirmRemoveId(m.id)} ...>
    <X size={14} />
  </button>
)}
```

Trocar o botão de toggle de aula para usar `podeMarcarAula`:
```tsx
{podeMarcarAula ? (
  <button onClick={() => toggleAula.mutate(...)} ...>
    {/* ícone de check/circle */}
  </button>
) : (
  <div className="w-8 h-8 flex items-center justify-center">
    {status === 'realizada' ? <CheckCircle2 size={18} className="text-emerald-600" /> : <Circle size={18} className="text-stone-300" />}
  </div>
)}
```

---

## Arquivo 7 — `src/pages/Discipuladores.tsx`

Importar `canEdit` do useAuth. Envolver todos os botões de ação:

```tsx
const { canEdit } = useAuth()
```

Envolver o botão "Novo Discipulador":
```tsx
{canEdit && (
  <Button onClick={() => setShowDialog(true)}>
    <Plus size={16} />
    Novo Discipulador
  </Button>
)}
```

Envolver os botões Editar, Excluir e Desativar/Reativar em cada card:
```tsx
{canEdit && (
  <div className="flex items-center justify-between mt-3">
    <button onClick={() => toggleAtivo.mutate(...)} ...>
      {d.ativo ? 'Desativar' : 'Reativar'}
    </button>
    <div className="flex items-center gap-3">
      <button onClick={() => setEditTarget(d)} ...>
        <Pencil size={11} /> Editar
      </button>
      <button onClick={() => setDeleteTarget(...)} ...>
        <Trash2 size={11} /> Excluir
      </button>
    </div>
  </div>
)}
```

---

## Arquivo 8 — `src/pages/Modulos.tsx`

Importar `canEdit` do useAuth. Envolver botão "Novo Módulo" e botões de editar/excluir em cada item:

```tsx
const { canEdit } = useAuth()

// Botão Novo Módulo:
{canEdit && (
  <Button onClick={openCreate}>
    <Plus size={16} />
    Novo Módulo
  </Button>
)}

// Botões de editar/excluir em cada módulo:
{canEdit && (
  <div className="flex gap-2">
    <button onClick={() => openEdit(m)} ...>editar</button>
    <button onClick={() => setConfirmDeleteId(m.id)} ...>excluir</button>
  </div>
)}
```

---

## Arquivo 9 — `src/components/layout/Sidebar.tsx`

O item "Usuários" deve aparecer APENAS para admin e lider (não para pastor).

```tsx
// Adicionar canEdit no destructuring:
const { profile, signOut, isLider, canEdit } = useAuth()

// Mover o item Usuários para um array separado ou filtrar condicionalmente:
const NAV_LIDER = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/convertidos', icon: Users, label: 'Convertidos' },
  { to: '/discipulado', icon: BookOpen, label: 'Discipulado' },
  { to: '/discipuladores', icon: UserCheck, label: 'Discipuladores' },
  { to: '/modulos', icon: GraduationCap, label: 'Módulos' },
]

// Renderizar Usuários condicionalmente:
// Dentro do <nav>, após mapear NAV_LIDER:
{canEdit && (
  <NavLink to="/usuarios" ... >
    <KeyRound size={18} />
    Usuários
  </NavLink>
)}
```

**Atenção**: a `isLiderOrPastor` deve ser usada para decidir qual nav mostrar (se lider ou discipulador).
Trocar `isLider` por `isLiderOrPastor` na linha `const nav = isLider ? NAV_LIDER : NAV_DISCIPULADOR`:

```tsx
const { profile, signOut, isLiderOrPastor, canEdit } = useAuth()
const nav = isLiderOrPastor ? NAV_LIDER : NAV_DISCIPULADOR
```

---

## Checklist de execução

- [ ] `src/contexts/AuthContext.tsx` — interface + return do provider
- [ ] `src/App.tsx` — adicionar LiderOrPastorRoute + atualizar rotas
- [ ] `src/pages/Convertidos.tsx` — isLider → canEdit no botão
- [ ] `src/pages/ConvertidoDetalhe.tsx` — envolver 3 botões com canEdit
- [ ] `src/pages/Discipulado.tsx` — canEdit no botão + isLiderOrPastor no enabled
- [ ] `src/pages/GrupoDetalhe.tsx` — canEdit nos botões admin + podeMarcarAula no toggle
- [ ] `src/pages/Discipuladores.tsx` — canEdit em todos os botões de ação
- [ ] `src/pages/Modulos.tsx` — canEdit em todos os botões de ação
- [ ] `src/components/layout/Sidebar.tsx` — isLiderOrPastor no nav + canEdit no item Usuários
- [ ] `npm run build` — zero erros
- [ ] Commit + push + vercel deploy
