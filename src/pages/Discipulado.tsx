import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, BookOpen, Users } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
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

async function fetchGrupos() {
  const { data } = await supabase
    .from('grupos_discipulado')
    .select('*, discipulador:discipuladores(*), modulo:modulos_discipulado(*), membros:grupo_membros(id, status), progresso:progresso_aulas(*)')
    .order('criado_em', { ascending: false })
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
  const [showDialog, setShowDialog] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const queryClient = useQueryClient()

  const { data: grupos = [], isLoading } = useQuery({ queryKey: ['grupos'], queryFn: fetchGrupos })
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
    },
  })

  const filtered = statusFilter ? grupos.filter((g) => g.status === statusFilter) : grupos

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discipulado</h1>
          <p className="text-sm text-gray-500 mt-0.5">{grupos.length} grupos cadastrados</p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus size={16} />
          Novo Grupo
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {[
          { value: '', label: 'Todos' },
          { value: 'ativo', label: 'Ativos' },
          { value: 'encerrado', label: 'Encerrados' },
          { value: 'pausado', label: 'Pausados' },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              statusFilter === opt.value
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300'
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
            <div key={i} className="h-40 bg-gray-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BookOpen size={40} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Nenhum grupo encontrado</p>
          <p className="text-sm text-gray-400 mt-1">Crie o primeiro grupo de discipulado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((grupo) => {
            const { variant, label } = statusGrupoBadge(grupo.status)
            const membrosAtivos = (grupo.membros as any[])?.filter((m) => m.status === 'ativo').length ?? 0
            const realizadas = (grupo.progresso as any[])?.filter((p) => p.status === 'realizada').length ?? 0
            const totalAulas = grupo.modulo?.total_aulas ?? 0

            return (
              <Link key={grupo.id} to={`/discipulado/${grupo.id}`}>
                <Card className="p-5 hover:border-primary-200 hover:shadow-md transition-all cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{grupo.nome}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{grupo.modulo?.nome ?? 'Módulo não definido'}</p>
                    </div>
                    <Badge variant={variant}>{label}</Badge>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <Avatar name={grupo.discipulador?.nome ?? '?'} size="sm" />
                    <div>
                      <p className="text-xs text-gray-500">Discipulador</p>
                      <p className="text-sm font-medium text-gray-800">{grupo.discipulador?.nome ?? '—'}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {membrosAtivos} {grupo.tipo === 'individual' ? 'pessoa' : 'pessoas'}
                    </span>
                    <span>
                      {totalAulas > 0 ? `${realizadas}/${totalAulas} aulas` : 'Aulas não definidas'}
                    </span>
                  </div>

                  {totalAulas > 0 && (
                    <Progress value={realizadas} max={totalAulas} color={realizadas === totalAulas ? 'green' : 'primary'} />
                  )}

                  <p className="text-xs text-gray-400 mt-2">Início: {formatDate(grupo.data_inicio)}</p>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      {/* Dialog: Novo Grupo */}
      <Dialog
        open={showDialog}
        onOpenChange={setShowDialog}
        title="Novo Grupo de Discipulado"
        description="Preencha as informações do grupo"
      >
        <form onSubmit={handleSubmit((data) => createGrupo.mutate(data))} className="space-y-4">
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
