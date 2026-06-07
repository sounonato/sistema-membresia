# Plano: Menu Mobile Lateral + Portal do Convertido

---

## PARTE 1 — Menu mobile lateral (Drawer)

### Contexto
Atualmente no mobile existe um `BottomNav` com ícones na parte de baixo.
O usuário quer substituir por um menu lateral que abre com botão hamburguer no topo.

---

### 1.1 — Atualizar `src/components/layout/AppShell.tsx`

Substituir o conteúdo completo pelo código abaixo:

```tsx
import { useState, type ReactNode } from 'react'
import { Sidebar } from './Sidebar'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar desktop — sempre visível em lg+ */}
      <Sidebar drawerOpen={false} onClose={() => {}} />

      {/* Drawer mobile */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}
      <div className={`fixed top-0 left-0 h-full z-50 lg:hidden transition-transform duration-300 ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar drawerOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </div>

      {/* Main content */}
      <main className="lg:pl-64 min-h-screen">
        {/* Header mobile com hamburguer */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-4 bg-stone-50 border-b border-stone-200 sticky top-0 z-30">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-xl text-stone-600 hover:bg-stone-100 transition-colors"
            aria-label="Abrir menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-amber-700 rounded-lg flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/>
                <line x1="12" y1="18" x2="12" y2="22"/>
                <line x1="8" y1="22" x2="16" y2="22"/>
                <line x1="7" y1="2" x2="7" y2="13"/>
              </svg>
            </div>
            <p className="text-sm font-serif font-bold text-stone-900">A Jornada do Discípulo</p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
```

---

### 1.2 — Atualizar `src/components/layout/Sidebar.tsx`

A Sidebar agora recebe props `drawerOpen` e `onClose`.
Substituir o conteúdo completo:

```tsx
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, BookOpen, UserCheck,
  GraduationCap, LogOut, Church, KeyRound, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar } from '@/components/ui/avatar'

const NAV_LIDER = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/convertidos', icon: Users, label: 'Convertidos' },
  { to: '/discipulado', icon: BookOpen, label: 'Discipulado' },
  { to: '/discipuladores', icon: UserCheck, label: 'Discipuladores' },
  { to: '/modulos', icon: GraduationCap, label: 'Módulos' },
  { to: '/usuarios', icon: KeyRound, label: 'Usuários' },
]

const NAV_DISCIPULADOR = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/discipulado', icon: BookOpen, label: 'Meus Grupos' },
]

interface SidebarProps {
  drawerOpen: boolean
  onClose: () => void
}

export function Sidebar({ drawerOpen, onClose }: SidebarProps) {
  const { profile, signOut, isLider } = useAuth()
  const nav = isLider ? NAV_LIDER : NAV_DISCIPULADOR

  return (
    <aside className={cn(
      'flex flex-col w-64 bg-stone-50 border-r border-stone-200 min-h-screen',
      // Desktop: sempre fixo e visível
      'lg:fixed lg:left-0 lg:top-0 lg:bottom-0 lg:flex lg:z-30',
      // Mobile: só renderiza quando drawerOpen
      drawerOpen ? 'flex' : 'hidden lg:flex',
    )}>
      {/* Logo + botão fechar no mobile */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-stone-200">
        <div className="w-9 h-9 bg-amber-700 rounded-xl flex items-center justify-center">
          <Church size={18} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-serif font-bold text-stone-900">A Jornada do</p>
          <p className="text-xs font-semibold text-amber-700">Discípulo</p>
        </div>
        {/* Botão fechar — só mobile */}
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-stone-400 hover:bg-stone-100 transition-colors"
          aria-label="Fechar menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-amber-50 text-amber-800 font-semibold border-l-2 border-amber-600 rounded-r-xl pl-2.5'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 rounded-xl',
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      {profile && (
        <div className="p-4 border-t border-stone-200">
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar name={profile.nome} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-900 truncate">{profile.nome}</p>
              <p className="text-xs text-stone-400 capitalize">{profile.perfil}</p>
            </div>
            <button
              onClick={signOut}
              className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Sair"
              aria-label="Sair"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
```

---

### 1.3 — Deletar `src/components/layout/BottomNav.tsx`

Apagar o arquivo completamente.

---

### 1.4 — Atualizar `src/App.tsx`

Remover o import de BottomNav se existir:
```tsx
// REMOVER esta linha se existir:
import { BottomNav } from '@/components/layout/BottomNav'
```

---

## PARTE 2 — Portal do Convertido

### Contexto
O convertido recebe um e-mail e senha para acessar um portal dedicado onde vê:
- Seu progresso nas aulas do grupo de discipulado
- Aulas já realizadas (pode rever o conteúdo)
- Próximas aulas (bloqueadas até ser feita a anterior)
- Nome do discipulador e do grupo

O portal é uma rota pública separada do sistema admin: `/portal`
Usa o mesmo Supabase Auth, mas com perfil `convertido`.

---

### 2.1 — Criar `src/pages/PortalConvertido.tsx`

```tsx
import { useState, useEffect } from 'react'
import { BookOpen, CheckCircle2, Lock, LogOut, Church, ChevronRight, Award } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'

interface ProgressoAula {
  id: string
  aula_numero: number
  titulo: string
  status: 'realizada' | 'pendente'
  data_realizada?: string
}

interface MeuGrupo {
  id: string
  nome: string
  discipulador: { nome: string }
  modulo: { nome: string; total_aulas: number } | null
  progresso: ProgressoAula[]
}

export default function PortalConvertido() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [grupos, setGrupos] = useState<MeuGrupo[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        carregarDados(session.user.id)
      } else {
        setCarregando(false)
      }
    })
  }, [])

  async function carregarDados(userId: string) {
    setCarregando(true)
    // Buscar profile
    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(prof)

    // Buscar convertido pelo email do usuário
    const { data: conv } = await supabase
      .from('novos_convertidos')
      .select('id, nome')
      .eq('email', prof?.email ?? '')
      .maybeSingle()

    if (!conv) { setCarregando(false); return }

    // Buscar grupos do convertido com progresso
    const { data: membros } = await supabase
      .from('grupo_membros')
      .select(`
        grupo:grupos_discipulado(
          id, nome,
          discipulador:discipuladores(nome),
          modulo:modulos_discipulado(nome, total_aulas),
          progresso:progresso_aulas(id, aula_numero, titulo, status, data_realizada)
        )
      `)
      .eq('convertido_id', conv.id)

    const gruposFormatados = (membros ?? [])
      .map((m: any) => m.grupo)
      .filter(Boolean)
      .map((g: any) => ({
        ...g,
        progresso: (g.progresso ?? []).sort((a: any, b: any) => a.aula_numero - b.aula_numero),
      }))

    setGrupos(gruposFormatados)
    setCarregando(false)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setErro('E-mail ou senha inválidos.')
      setLoading(false)
      return
    }
    setUser(data.user)
    await carregarDados(data.user.id)
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setGrupos([])
  }

  // Tela de login
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
              <Church size={28} className="text-white" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-stone-900">Minha Jornada</h1>
            <p className="text-sm text-stone-500 mt-1">Acompanhe seu discipulado</p>
          </div>

          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  label="E-mail"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Input
                  label="Senha"
                  type="password"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {erro && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                    {erro}
                  </p>
                )}
                <Button type="submit" className="w-full" loading={loading}>
                  Entrar
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Tela de carregando
  if (carregando) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-700 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Dashboard do convertido
  const totalRealizadas = grupos.reduce((acc, g) => acc + g.progresso.filter(p => p.status === 'realizada').length, 0)
  const totalAulas = grupos.reduce((acc, g) => acc + (g.modulo?.total_aulas ?? 0), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-white">
      {/* Header */}
      <div className="bg-stone-50 border-b border-stone-200 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-700 rounded-xl flex items-center justify-center">
            <Church size={15} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-serif font-bold text-stone-900">Minha Jornada</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-red-600 transition-colors"
        >
          <LogOut size={14} />
          Sair
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Saudação */}
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900">
            Olá, {profile?.nome?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-stone-500 mt-0.5">Acompanhe sua caminhada no discipulado</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold text-amber-700">{totalRealizadas}</p>
            <p className="text-xs text-stone-500 mt-1">Aulas realizadas</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold text-stone-700">{totalAulas > 0 ? `${Math.round((totalRealizadas / totalAulas) * 100)}%` : '—'}</p>
            <p className="text-xs text-stone-500 mt-1">Progresso total</p>
          </Card>
        </div>

        {/* Grupos */}
        {grupos.length === 0 ? (
          <Card className="p-8 text-center">
            <BookOpen size={36} className="text-stone-300 mx-auto mb-3" />
            <p className="text-sm text-stone-500">Você ainda não está em nenhum grupo de discipulado.</p>
          </Card>
        ) : (
          grupos.map((grupo) => {
            const realizadas = grupo.progresso.filter(p => p.status === 'realizada').length
            const total = grupo.modulo?.total_aulas ?? grupo.progresso.length
            const pct = total > 0 ? Math.round((realizadas / total) * 100) : 0

            return (
              <Card key={grupo.id} className="overflow-hidden">
                {/* Header do grupo */}
                <div className="p-4 border-b border-stone-100">
                  <div className="flex items-center gap-3">
                    <Avatar name={grupo.discipulador?.nome ?? '?'} size="md" />
                    <div className="flex-1">
                      <p className="font-serif font-bold text-stone-900">{grupo.nome}</p>
                      <p className="text-xs text-stone-500">Discipulador: {grupo.discipulador?.nome}</p>
                      {grupo.modulo && (
                        <p className="text-xs text-amber-700 font-medium mt-0.5">{grupo.modulo.nome}</p>
                      )}
                    </div>
                  </div>

                  {/* Barra de progresso */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-stone-500 mb-1">
                      <span>{realizadas} de {total} aulas</span>
                      <span className="font-semibold text-amber-700">{pct}%</span>
                    </div>
                    <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-600 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Lista de aulas */}
                <div className="divide-y divide-stone-50">
                  {grupo.progresso.map((aula, idx) => {
                    const feita = aula.status === 'realizada'
                    // Aula disponível se for a primeira ou se a anterior já foi realizada
                    const disponivel = feita || idx === 0 || grupo.progresso[idx - 1]?.status === 'realizada'

                    return (
                      <div
                        key={aula.id}
                        className={`flex items-center gap-3 px-4 py-3 ${feita ? 'bg-emerald-50/50' : disponivel ? '' : 'opacity-50'}`}
                      >
                        {feita ? (
                          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                        ) : disponivel ? (
                          <ChevronRight size={20} className="text-amber-600 shrink-0" />
                        ) : (
                          <Lock size={20} className="text-stone-300 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${feita ? 'text-stone-700' : disponivel ? 'text-stone-900' : 'text-stone-400'}`}>
                            Aula {aula.aula_numero} — {aula.titulo || `Aula ${aula.aula_numero}`}
                          </p>
                          {feita && aula.data_realizada && (
                            <p className="text-xs text-emerald-600 mt-0.5">
                              Realizada em {new Date(aula.data_realizada).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                          {!disponivel && (
                            <p className="text-xs text-stone-400 mt-0.5">Disponível após a aula anterior</p>
                          )}
                        </div>
                        {feita && <Award size={14} className="text-amber-500 shrink-0" />}
                      </div>
                    )
                  })}
                </div>
              </Card>
            )
          })
        )}

        <p className="text-xs text-stone-400 text-center pb-4">
          Que Deus abençoe sua jornada! 🙏
        </p>
      </div>
    </div>
  )
}
```

---

### 2.2 — Atualizar `src/App.tsx`

Adicionar import e rota pública:
```tsx
import PortalConvertido from '@/pages/PortalConvertido'
// dentro de <Routes> — ANTES do catch-all *:
<Route path="/portal" element={<PortalConvertido />} />
```

---

## Checklist de execução

- [ ] Substituir `src/components/layout/AppShell.tsx`
- [ ] Substituir `src/components/layout/Sidebar.tsx`
- [ ] Deletar `src/components/layout/BottomNav.tsx`
- [ ] Criar `src/pages/PortalConvertido.tsx`
- [ ] Atualizar `src/App.tsx` (remover BottomNav import + adicionar rota /portal)
- [ ] `npm run build` — zero erros
- [ ] Commit + push + vercel deploy
