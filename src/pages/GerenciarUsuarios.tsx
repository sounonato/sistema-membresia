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
          <Select
            label="Perfil de acesso"
            value={form.perfil}
            onChange={(e) => setForm(f => ({ ...f, perfil: e.target.value, discipulador_id: '', nome: '' }))}
            options={PERFIS}
          />

          {/* Discipulador: seleciona da lista e nome preenche automático */}
          {form.perfil === 'discipulador' && semLogin.length > 0 ? (
            <Select
              label="Selecionar discipulador"
              placeholder="Escolha o discipulador..."
              value={form.discipulador_id}
              onChange={(e) => {
                const disc = semLogin.find((d: any) => d.id === e.target.value) as any
                setForm(f => ({ ...f, discipulador_id: e.target.value, nome: disc?.nome ?? '' }))
              }}
              options={semLogin.map((d: any) => ({ value: d.id, label: d.nome }))}
            />
          ) : (
            /* Líder/Pastor/Admin: digita o nome manualmente */
            <Input
              label="Nome completo"
              placeholder="Nome do usuário"
              value={form.nome}
              onChange={(e) => setForm(f => ({ ...f, nome: e.target.value }))}
            />
          )}

          {/* Nome preenchido automaticamente (somente leitura) */}
          {form.perfil === 'discipulador' && form.nome && (
            <div className="px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl">
              <p className="text-xs text-stone-400 mb-0.5">Nome</p>
              <p className="text-sm font-medium text-stone-900">{form.nome}</p>
            </div>
          )}

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
