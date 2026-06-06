import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, BookOpen, Users } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/card'
import { Badge, statusGrupoBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Dialog } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Avatar } from '@/components/ui/avatar'
import { formatDate } from '@/lib/utils'
import type { GrupoDiscipulado, Discipulador, ModuloDiscipulado } from '@/types'

const schema = z.object({
  nome: z.string().min(2, 'Nome obrigatório'),
  discipulador_id: z.string().min(1, 'Discipulador obrigatório'),
  tipo: z.enum(['individual', 'grupo']),
  modulo_id: z.string().optional(),
  data_inicio: z.string().optional(),
  observacoes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

async function fetchGrupos(discipuladorIdFilter?: string | null) {
  let query = supabase
    .from('grupos_discipulado')
    .select('*, discipulador:discipuladores(*), modulo:modulos_discipulado(*), membros:grupo_membros(id, status), progresso:progresso_aulas(*)')
    .order('criado_em', { ascending: false })

  if (discipuladorIdFilter) {
    query = query.eq('discipulador_id', discipuladorIdFilter)
  }

  const { data } = await query
  return (data ?? []) as GrupoDiscipulado[]
}

async function fetchDiscipuladores() {
  const { data } = await supabase.from('discipuladores').select('*').eq('ativo', true).order('nome')
  return (data ?? []) as Discipulador[]
}

async function fetchModulos() {
  const { data } = await supabase.from('modulos_discipulado').select('*').eq('ativo', true).order('ordem')
  return (data ?? []) as ModuloDiscipulado[]
}

export default function Discipulado() {
  const { isLider, isDiscipulador, user } = useAuth()
  const [showDialog, setShowDialog] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [grupoError, setGrupoError] = useState('')
  const queryClient = useQueryClient()

  // Para discipulador, buscar seu próprio registro antes de carregar grupos
  const { data: meuDiscipulador } = useQuery({
    queryKey: ['meu-discipulador-disc', user?.id],
    queryFn: async () => {
      if (!user) return null
      const { data } = await supabase.from('discipuladores').select('id').eq('usuario_id', user.id).single()
      return data as { id: string } | null
    },
    enabled: !!user && isDiscipulador,
  })

  const discipuladorIdFilter = isDiscipulador ? (meuDiscipulador?.id ?? null) : null

  const { data: grupos = [], isLoading } = useQuery({
    queryKey: ['grupos', discipuladorIdFilter],
    queryFn: () => fetchGrupos(discipuladorIdFilter),
    enabled: isLider || (isDiscipulador && meuDiscipulador !== undefined),
  })
  const { data: discipuladores = [] } = useQuery({ queryKey: ['discipuladores'], queryFn: fetchDiscipuladores })
  const { data: modulos = [] } = useQuery({ queryKey: ['modulos'], queryFn: fetchModulos })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { tipo: 'individual', data_inicio: new Date().toISOString().split('T')[0] },
  })

  const createGrupo = useMutation({
    mutationFn: async (data: FormData) => {
      const { error } = await supabase.from('grupos_discipulado').insert({
        ...data,
        modulo_id: data.modulo_id || null,
        status: 'ativo',
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grupos'] })
      setShowDialog(false)
      reset()
      setGrupoError('')
    },
    onError: (err: any) => setGrupoError(err.message ?? 'Erro ao criar grupo'),
  })

  const filtered = statusFilter ? grupos.filter((g) => g.status === statusFilter) : grupos

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-900">Discipulado</h1>
          <p className="text-sm text-stone-500 mt-1">{grupos.length} grupos cadastrados</p>
        </div>
        {isLider && (
          <Button onClick={() => setShowDialog(true)}>
            <Plus size={16} />
            Novo Grupo
          </Button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: '', label: 'Todos' },
          { value: 'ativo', label: 'Em andamento' },
          { value: 'encerrado', label: 'Concluídos' },
          { value: 'pausado', label: 'Descontinuado' },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
              statusFilter === opt.value
                ? 'bg-amber-700 text-white shadow-sm'
                : 'bg-white text-stone-600 border border-stone-200 hover:border-amber-300 hover:text-stone-900'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Grupos */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 bg-stone-100 animate-pulse rounded-2xl border border-stone-200" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <BookOpen size={40} className="text-stone-300 mx-auto mb-4" />
          <p className="text-stone-500 font-medium">Nenhum grupo encontrado</p>
          <p className="text-sm text-stone-400 mt-1">Crie o primeiro grupo de discipulado</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((grupo) => {
            const { variant, label } = statusGrupoBadge(grupo.status)
            const membrosAtivos = (grupo.membros as any[])?.filter((m) => m.status === 'ativo').length ?? 0
            const realizadas = (grupo.progresso as any[])?.filter((p) => p.status === 'realizada').length ?? 0
            const totalAulas = grupo.modulo?.total_aulas ?? 0

            return (
              <Link key={grupo.id} to={`/discipulado/${grupo.id}`}>
                <Card className="p-5 hover:border-amber-300 transition-all cursor-pointer h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif text-lg font-bold text-stone-900 truncate">{grupo.nome}</h3>
                        <p className="text-xs text-stone-500 mt-0.5">{grupo.modulo?.nome ?? 'Módulo não definido'}</p>
                      </div>
                      <Badge variant={variant}>{label}</Badge>
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                      <Avatar name={grupo.discipulador?.nome ?? '?'} size="sm" />
                      <div>
                        <p className="text-xs text-stone-400">Discipulador</p>
                        <p className="text-sm font-semibold text-stone-800">{grupo.discipulador?.nome ?? '—'}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        {membrosAtivos} {grupo.tipo === 'individual' ? 'pessoa' : 'pessoas'}
                      </span>
                      <span className="font-medium text-amber-700">
                        {totalAulas > 0 ? `${realizadas}/${totalAulas} aulas` : 'Aulas não definidas'}
                      </span>
                    </div>

                    {totalAulas > 0 && (
                      <Progress value={realizadas} max={totalAulas} color={realizadas === totalAulas ? 'green' : 'primary'} />
                    )}

                    <p className="text-xs text-stone-400 mt-3">Início: {formatDate(grupo.data_inicio)}</p>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      {/* Dialog: Novo Grupo */}
      <Dialog
        open={showDialog}
        onOpenChange={(open) => { setShowDialog(open); if (!open) setGrupoError('') }}
        title="Novo Grupo de Discipulado"
        description="Preencha as informações do grupo"
      >
        <form onSubmit={handleSubmit((data) => createGrupo.mutate(data))} className="space-y-4">
          {grupoError && <p className="text-sm text-red-500">{grupoError}</p>}
          <Input label="Nome do grupo" placeholder="Ex: Grupo da Manhã" error={errors.nome?.message} required {...register('nome')} />
          <Select
            label="Discipulador"
            required
            error={errors.discipulador_id?.message}
            placeholder="Selecionar..."
            options={discipuladores.map((d) => ({ value: d.id, label: d.nome }))}
            {...register('discipulador_id')}
          />
          <Select
            label="Tipo"
            options={[{ value: 'individual', label: 'Individual (1:1)' }, { value: 'grupo', label: 'Grupo' }]}
            {...register('tipo')}
          />
          <Select
            label="Módulo"
            placeholder="Selecionar módulo..."
            options={modulos.map((m) => ({ value: m.id, label: `${m.nome} (${m.total_aulas} aulas)` }))}
            {...register('modulo_id')}
          />
          <Input label="Data de início" type="date" {...register('data_inicio')} />

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button type="submit" loading={createGrupo.isPending}>Criar Grupo</Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
