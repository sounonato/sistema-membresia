import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Plus, CheckCircle2, Circle, XCircle,
  Users, Calendar, BookOpen, Trash2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Avatar } from '@/components/ui/avatar'
import { Badge, statusGrupoBadge, statusConvertidoBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Select } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { formatDate } from '@/lib/utils'
import type { GrupoDiscipulado, NovoConvertido, ProgressoAula, StatusAula } from '@/types'

async function fetchGrupo(id: string) {
  const { data } = await supabase
    .from('grupos_discipulado')
    .select('*, discipulador:discipuladores(*), modulo:modulos_discipulado(*)')
    .eq('id', id)
    .single()
  return data as GrupoDiscipulado
}

async function fetchMembros(grupoId: string) {
  const { data } = await supabase
    .from('grupo_membros')
    .select('*, convertido:novos_convertidos(*)')
    .eq('grupo_id', grupoId)
    .eq('status', 'ativo')
  return data ?? []
}

async function fetchProgresso(grupoId: string) {
  const { data } = await supabase
    .from('progresso_aulas')
    .select('*')
    .eq('grupo_id', grupoId)
    .order('numero_aula')
  return (data ?? []) as ProgressoAula[]
}

async function fetchConvertidosDisponiveis() {
  const { data } = await supabase
    .from('novos_convertidos')
    .select('*')
    .in('status', ['ativo', 'em_discipulado'])
    .order('nome')
  return (data ?? []) as NovoConvertido[]
}

export default function GrupoDetalhe() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showAddMembro, setShowAddMembro] = useState(false)
  const [convertidoSelecionado, setConvertidoSelecionado] = useState('')
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)
  const [membroError, setMembroError] = useState('')
  const [aulaError, setAulaError] = useState('')

  const { data: grupo, isLoading } = useQuery({
    queryKey: ['grupo', id],
    queryFn: () => fetchGrupo(id!),
    enabled: !!id,
  })

  const { data: membros = [] } = useQuery({
    queryKey: ['membros-grupo', id],
    queryFn: () => fetchMembros(id!),
    enabled: !!id,
  })

  const { data: progresso = [] } = useQuery({
    queryKey: ['progresso', id],
    queryFn: () => fetchProgresso(id!),
    enabled: !!id,
  })

  const { data: convertidosDisponiveis = [] } = useQuery({
    queryKey: ['convertidos-disponiveis'],
    queryFn: fetchConvertidosDisponiveis,
    enabled: showAddMembro,
  })

  const addMembro = useMutation({
    mutationFn: async (convertidoId: string) => {
      await supabase.from('grupo_membros').insert({
        grupo_id: id,
        convertido_id: convertidoId,
        data_entrada: new Date().toISOString().split('T')[0],
        status: 'ativo',
      })
      await supabase.from('novos_convertidos').update({ status: 'em_discipulado' }).eq('id', convertidoId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membros-grupo', id] })
      queryClient.invalidateQueries({ queryKey: ['convertidos'] })
      setShowAddMembro(false)
      setConvertidoSelecionado('')
      setMembroError('')
    },
    onError: (err: any) => setMembroError(err.message ?? 'Erro ao adicionar membro'),
  })

  const removeMembro = useMutation({
    mutationFn: async (membroId: string) => {
      await supabase.from('grupo_membros').update({ status: 'encerrado', data_saida: new Date().toISOString().split('T')[0] }).eq('id', membroId)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['membros-grupo', id] }),
  })

  const toggleAula = useMutation({
    mutationFn: async ({ numeroAula, statusAtual }: { numeroAula: number; statusAtual: StatusAula }) => {
      setAulaError('')
      const novoStatus: StatusAula = statusAtual === 'realizada' ? 'pendente' : 'realizada'
      const existing = progresso.find((p) => p.numero_aula === numeroAula)
      if (existing) {
        await supabase.from('progresso_aulas').update({
          status: novoStatus,
          data_realizada: novoStatus === 'realizada' ? new Date().toISOString().split('T')[0] : null,
        }).eq('id', existing.id)
      } else {
        await supabase.from('progresso_aulas').insert({
          grupo_id: id,
          numero_aula: numeroAula,
          status: 'realizada',
          data_realizada: new Date().toISOString().split('T')[0],
        })
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['progresso', id] }),
    onError: (err: any) => setAulaError(err.message ?? 'Erro ao atualizar aula'),
  })

  if (isLoading) return <div className="animate-pulse h-64 bg-stone-100 border border-stone-200 rounded-2xl" />
  if (!grupo) return <p className="text-stone-50">Grupo não encontrado.</p>

  const { variant, label } = statusGrupoBadge(grupo.status)
  const totalAulas = grupo.modulo?.total_aulas ?? 0
  const realizadas = progresso.filter((p) => p.status === 'realizada').length
  const aulasArray = totalAulas > 0 ? Array.from({ length: totalAulas }, (_, i) => i + 1) : []

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="Voltar" className="p-2 rounded-xl text-stone-500 hover:bg-stone-100 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-serif font-bold text-stone-900">Grupo de Discipulado</h1>
      </div>

      {/* Info do grupo */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-serif font-bold text-stone-900">{grupo.nome}</h2>
              <p className="text-sm text-stone-500 mt-0.5">{grupo.modulo?.nome ?? 'Módulo não definido'}</p>
            </div>
            <Badge variant={variant}>{label}</Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2 text-stone-600">
              <Avatar name={grupo.discipulador?.nome ?? '?'} size="sm" />
              <div>
                <p className="text-xs text-stone-400">Discipulador</p>
                <p className="font-semibold text-stone-800">{grupo.discipulador?.nome}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-stone-600">
              <Calendar size={14} className="text-stone-400" />
              <div>
                <p className="text-xs text-stone-400">Início</p>
                <p className="font-semibold text-stone-800">{formatDate(grupo.data_inicio)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-stone-600">
              <Users size={14} className="text-stone-400" />
              <div>
                <p className="text-xs text-stone-400">Tipo</p>
                <p className="font-semibold text-stone-800 capitalize">{grupo.tipo}</p>
              </div>
            </div>
          </div>

          {totalAulas > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-stone-500 mb-1.5">
                <span>Progresso das aulas</span>
                <span className="font-medium text-amber-700">{realizadas}/{totalAulas} realizadas</span>
              </div>
              <Progress value={realizadas} max={totalAulas} color={realizadas === totalAulas ? 'green' : 'primary'} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Membros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-stone-700">
              <Users size={15} />
              Membros ({membros.length})
            </CardTitle>
            <Button size="sm" variant="secondary" onClick={() => setShowAddMembro(true)}>
              <Plus size={13} />
              Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {membros.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-4">Nenhum membro no grupo</p>
          ) : (
            membros.map((m: any) => {
              const c = m.convertido as NovoConvertido
              const { variant: sv, label: sl } = statusConvertidoBadge(c.status)
              return (
                <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-stone-50/70 border border-transparent hover:shadow-[0_1px_4px_rgba(28,25,23,0.06)] transition-all">
                  <Avatar name={c.nome} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-900 truncate">{c.nome}</p>
                    <p className="text-xs text-stone-400">Desde {formatDate(m.data_entrada)}</p>
                  </div>
                  <Badge variant={sv}>{sl}</Badge>
                  <button
                    onClick={() => setConfirmRemoveId(m.id)}
                    aria-label="Remover membro"
                    className="p-1.5 rounded text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Progresso de Aulas */}
      {totalAulas > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-stone-700">
              <BookOpen size={15} />
              Aulas — {grupo.modulo?.nome}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {aulaError && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 mb-4">
                {aulaError}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {aulasArray.map((num) => {
                const p = progresso.find((pr) => pr.numero_aula === num)
                const status = p?.status ?? 'pendente'
                const icon =
                  status === 'realizada' ? <CheckCircle2 size={18} className="text-emerald-600" /> :
                  status === 'cancelada' ? <XCircle size={18} className="text-red-500" /> :
                  <Circle size={18} className="text-stone-300" />
 
                return (
                  <button
                    key={num}
                    onClick={() => toggleAula.mutate({ numeroAula: num, statusAtual: status as StatusAula })}
                    disabled={grupo.status === 'encerrado'}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      status === 'realizada'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border-stone-100 hover:border-amber-200 hover:bg-stone-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {icon}
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${status === 'realizada' ? 'text-emerald-800' : 'text-stone-700'}`}>
                        Aula {num}
                      </p>
                      {p?.data_realizada && (
                        <p className="text-xs text-stone-400">{formatDate(p.data_realizada)}</p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {realizadas === totalAulas && (
              <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                <p className="text-sm font-semibold text-emerald-800">🎉 Módulo concluído!</p>
                <p className="text-xs text-emerald-700 mt-0.5">Todas as aulas foram realizadas.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog: Adicionar membro */}
      <Dialog
        open={showAddMembro}
        onOpenChange={(open) => { setShowAddMembro(open); if (!open) setMembroError('') }}
        title="Adicionar Membro"
        description="Selecione um convertido para adicionar ao grupo"
      >
        <div className="space-y-4">
          {membroError && <p className="text-sm text-red-500">{membroError}</p>}
          <Select
            label="Convertido"
            value={convertidoSelecionado}
            onChange={(e) => setConvertidoSelecionado(e.target.value)}
            placeholder="Selecionar convertido..."
            options={convertidosDisponiveis.map((c) => ({ value: c.id, label: c.nome }))}
          />
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowAddMembro(false)}>Cancelar</Button>
            <Button
              disabled={!convertidoSelecionado}
              loading={addMembro.isPending}
              onClick={() => addMembro.mutate(convertidoSelecionado)}
            >
              Adicionar
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Dialog: Confirmar remoção de membro */}
      <Dialog
        open={confirmRemoveId !== null}
        onOpenChange={() => setConfirmRemoveId(null)}
        title="Remover membro"
        description="Tem certeza que deseja remover este membro do grupo? Essa ação não pode ser desfeita."
      >
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setConfirmRemoveId(null)}>Cancelar</Button>
          <Button
            variant="outline"
            className="text-red-700 border-red-200 hover:bg-red-50 bg-white"
            loading={removeMembro.isPending}
            onClick={() => { removeMembro.mutate(confirmRemoveId!); setConfirmRemoveId(null) }}
          >
            Remover
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
