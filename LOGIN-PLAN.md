# Plano: Criação de Logins pelo Líder

## Contexto
Atualmente não existe tela para criar contas de usuário. O líder precisa conseguir
criar logins para discipuladores e outros líderes diretamente pelo sistema.

## Fluxo desejado
1. Líder acessa a tela de Discipuladores
2. Clica em "Criar Acesso" num discipulador que ainda não tem login
3. Preenche: e-mail + senha temporária + perfil (lider/discipulador)
4. Sistema cria o usuário no Supabase Auth + vincula ao discipulador
5. Discipulador recebe login e já consegue entrar

---

## Fase 1 — Edge Function `create-user`

Criar: `supabase/functions/create-user/index.ts`

```ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Verificar que quem chama é admin/pastor/lider
  const token = authHeader.replace('Bearer ', '')
  const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !caller) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

  const { data: callerProfile } = await supabaseAdmin
    .from('profiles').select('perfil').eq('id', caller.id).single()

  if (!callerProfile || !['admin', 'pastor', 'lider'].includes(callerProfile.perfil)) {
    return new Response('Forbidden', { status: 403, headers: corsHeaders })
  }

  const { email, password, nome, perfil, discipulador_id } = await req.json()

  // Validações básicas
  if (!email || !password || !nome || !perfil) {
    return new Response(JSON.stringify({ error: 'Campos obrigatórios: email, password, nome, perfil' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
  if (password.length < 6) {
    return new Response(JSON.stringify({ error: 'Senha deve ter pelo menos 6 caracteres' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Criar usuário no Supabase Auth
  const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // já confirma o email automaticamente
    user_metadata: { nome, perfil },
  })

  if (createError) {
    return new Response(JSON.stringify({ error: createError.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Criar profile manualmente (trigger pode não rodar imediatamente)
  await supabaseAdmin.from('profiles').upsert({
    id: newUser.user!.id,
    nome,
    perfil,
    email,
  })

  // Se informou discipulador_id, vincular usuario_id ao discipulador
  if (discipulador_id) {
    await supabaseAdmin
      .from('discipuladores')
      .update({ usuario_id: newUser.user!.id })
      .eq('id', discipulador_id)
  }

  return new Response(JSON.stringify({ success: true, user_id: newUser.user!.id }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})
```

---

## Fase 2 — Adicionar `createUser` em `src/lib/api.ts`

Abrir `src/lib/api.ts` e adicionar ao final:

```ts
export async function createUser(data: {
  email: string
  password: string
  nome: string
  perfil: string
  discipulador_id?: string
}) {
  const headers = await authHeaders()
  const res = await fetch(`${FUNCTIONS_URL}/create-user`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'Erro ao criar usuário')
  }
  return res.json()
}
```

---

## Fase 3 — Nova página `src/pages/GerenciarUsuarios.tsx`

Criar uma página completa para gerenciar logins:

```tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserPlus, Shield, Users, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { createUser } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Dialog } from '@/components/ui/dialog'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

const PERFIS = [
  { value: 'discipulador', label: 'Discipulador' },
  { value: 'lider', label: 'Líder' },
  { value: 'pastor', label: 'Pastor' },
  { value: 'admin', label: 'Administrador' },
]

const PERFIL_COLORS: Record<string, string> = {
  admin: 'warning',
  pastor: 'warning',
  lider: 'info',
  discipulador: 'default',
}

async function fetchUsuarios() {
  const { data } = await supabase
    .from('profiles')
    .select('id, nome, perfil, email')
    .order('nome')
  return data ?? []
}

async function fetchDiscipuladores() {
  const { data } = await supabase
    .from('discipuladores')
    .select('id, nome, usuario_id')
    .eq('ativo', true)
    .order('nome')
  return data ?? []
}

export default function GerenciarUsuarios() {
  const queryClient = useQueryClient()
  const [showDialog, setShowDialog] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const [form, setForm] = useState({
    email: '',
    password: '',
    nome: '',
    perfil: 'discipulador',
    discipulador_id: '',
  })

  const { data: usuarios = [], isLoading } = useQuery({ queryKey: ['usuarios'], queryFn: fetchUsuarios })
  const { data: discipuladores = [] } = useQuery({ queryKey: ['discipuladores-vincular'], queryFn: fetchDiscipuladores })

  // Discipuladores ainda sem login
  const semLogin = discipuladores.filter((d: any) => !d.usuario_id)

  const criar = useMutation({
    mutationFn: () => createUser(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      queryClient.invalidateQueries({ queryKey: ['discipuladores-vincular'] })
      setShowDialog(false)
      setForm({ email: '', password: '', nome: '', perfil: 'discipulador', discipulador_id: '' })
      setServerError('')
    },
    onError: (err: any) => setServerError(err.message ?? 'Erro ao criar usuário'),
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-900">Usuários</h1>
          <p className="text-sm text-stone-500 mt-1">Gerencie os acessos ao sistema</p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <UserPlus size={16} />
          Criar Acesso
        </Button>
      </div>

      {/* Aviso discipuladores sem login */}
      {semLogin.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <Shield size={18} className="text-amber-700 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {semLogin.length} discipulador{semLogin.length > 1 ? 'es' : ''} sem acesso ao sistema
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              {semLogin.map((d: any) => d.nome).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Lista de usuários */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-stone-100 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="hidden sm:grid grid-cols-[2fr_1.5fr_1fr] gap-4 px-5 py-3 bg-stone-50 border-b border-stone-100 text-xs font-semibold text-stone-500 uppercase tracking-wide">
            <span>Nome</span>
            <span>E-mail</span>
            <span>Perfil</span>
          </div>
          <div className="divide-y divide-stone-100">
            {usuarios.map((u: any) => (
              <div key={u.id} className="flex sm:grid sm:grid-cols-[2fr_1.5fr_1fr] items-center gap-4 px-5 py-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={u.nome} size="md" />
                  <p className="text-sm font-medium text-stone-900 truncate">{u.nome}</p>
                </div>
                <p className="hidden sm:block text-sm text-stone-500 truncate">{u.email}</p>
                <Badge variant={PERFIL_COLORS[u.perfil] as any ?? 'default'} className="capitalize w-fit">
                  {u.perfil}
                </Badge>
              </div>
            ))}
            {usuarios.length === 0 && (
              <div className="p-10 text-center">
                <Users size={36} className="text-stone-300 mx-auto mb-3" />
                <p className="text-sm text-stone-500">Nenhum usuário cadastrado</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Dialog criar usuário */}
      <Dialog
        open={showDialog}
        onOpenChange={(open) => { setShowDialog(open); setServerError('') }}
        title="Criar Acesso"
        description="Crie um login para um líder ou discipulador acessar o sistema."
      >
        <div className="space-y-4">
          <Input
            label="Nome completo"
            placeholder="Nome do usuário"
            value={form.nome}
            onChange={(e) => setForm(f => ({ ...f, nome: e.target.value }))}
          />
          <Input
            label="E-mail"
            type="email"
            placeholder="email@igreja.com"
            value={form.email}
            onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
          />
          <div className="relative">
            <Input
              label="Senha temporária"
              type={showPassword ? 'text' : 'password'}
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
            />
            <button
              type="button"
              onClick={() => setShowPassword(s => !s)}
              className="absolute right-3 top-8 text-stone-400 hover:text-stone-600"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <Select
            label="Perfil de acesso"
            value={form.perfil}
            onChange={(e) => setForm(f => ({ ...f, perfil: e.target.value }))}
            options={PERFIS}
          />
          {form.perfil === 'discipulador' && semLogin.length > 0 && (
            <Select
              label="Vincular a um discipulador (opcional)"
              placeholder="Selecionar discipulador..."
              value={form.discipulador_id}
              onChange={(e) => setForm(f => ({ ...f, discipulador_id: e.target.value }))}
              options={semLogin.map((d: any) => ({ value: d.id, label: d.nome }))}
            />
          )}
          {serverError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
              {serverError}
            </p>
          )}
          <div className="flex gap-3 justify-end pt-1">
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={() => criar.mutate()} loading={criar.isPending}>
              <CheckCircle2 size={15} />
              Criar Acesso
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
```

---

## Fase 4 — Adicionar rota e nav

### `src/App.tsx`
Importar e adicionar rota:
```tsx
import GerenciarUsuarios from '@/pages/GerenciarUsuarios'
// dentro de <Routes>:
<Route path="/usuarios" element={<LiderRoute><GerenciarUsuarios /></LiderRoute>} />
```

### `src/components/layout/Sidebar.tsx`
Importar `KeyRound` do lucide-react e adicionar ao array `NAV_LIDER`:
```ts
{ to: '/usuarios', icon: KeyRound, label: 'Usuários' },
```

### `src/components/layout/BottomNav.tsx`
Importar `KeyRound` e adicionar ao array `NAV_LIDER`:
```ts
{ to: '/usuarios', icon: KeyRound, label: 'Usuários' },
```

---

## Checklist de execução

- [ ] Criar `supabase/functions/create-user/index.ts`
- [ ] Adicionar `createUser()` em `src/lib/api.ts`
- [ ] Criar `src/pages/GerenciarUsuarios.tsx`
- [ ] Atualizar `src/App.tsx` — nova rota `/usuarios`
- [ ] Atualizar `src/components/layout/Sidebar.tsx` — novo item nav
- [ ] Atualizar `src/components/layout/BottomNav.tsx` — novo item nav
- [ ] `npm run build` — zero erros
- [ ] Deploy Edge Function:
  ```bash
  npx supabase functions deploy create-user
  ```
- [ ] Commit + push + vercel:
  ```bash
  git add -A
  git commit -m "feat: tela de gerenciamento de usuários e criação de logins"
  git push origin main
  vercel --prod --yes
  ```
