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
    },
  })

  const removeMembro = useMutation({
    mutationFn: async (membroId: string) => {
      await supabase.from('grupo_membros').update({ status: 'encerrado', data_saida: new Date().toISOString().split('T')[0] }).eq('id', membroId)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['membros-grupo', id] }),
  })

  const toggleAula = useMutation({
    mutationFn: async ({ numeroAula, statusAtual }: { numeroAula: number; statusAtual: StatusAula }) => {
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
  })

  if (isLoading) return <div className="animate-pulse h-64 bg-gray-100 rounded-xl" />
  if (!grupo) return <p className="text-gray-500">Grupo não encontrado.</p>

  const { variant, label } = statusGrupoBadge(grupo.status)
  const totalAulas = grupo.modulo?.total_aulas ?? 0
  const realizadas = progresso.filter((p) => p.status === 'realizada').length
  const aulasArray = totalAulas > 0 ? Array.from({ length: totalAulas }, (_, i) => i + 1) : []

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="Voltar" className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Grupo de Discipulado</h1>
      </div>

      {/* Info do grupo */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{grupo.nome}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{grupo.modulo?.nome ?? 'Módulo não definido'}</p>
            </div>
            <Badge variant={variant}>{label}</Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Avatar name={grupo.discipulador?.nome ?? '?'} size="sm" />
              <div>
                <p className="text-xs text-gray-400">Discipulador</p>
                <p className="font-medium">{grupo.discipulador?.nome}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar size={14} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Início</p>
                <p className="font-medium">{formatDate(grupo.data_inicio)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Users size={14} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Tipo</p>
                <p className="font-medium capitalize">{grupo.tipo}</p>
              </div>
            </div>
          </div>

          {totalAulas > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>Progresso das aulas</span>
                <span className="font-medium text-primary-600">{realizadas}/{totalAulas} realizadas</span>
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
            <CardTitle className="flex items-center gap-2 text-gray-700">
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
            <p className="text-sm text-gray-400 text-center py-4">Nenhum membro no grupo</p>
          ) : (
            membros.map((m: any) => {
              const c = m.convertido as NovoConvertido
              const { variant: sv, label: sl } = statusConvertidoBadge(c.status)
              return (
                <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50">
                  <Avatar name={c.nome} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{c.nome}</p>
                    <p className="text-xs text-gray-400">Desde {formatDate(m.data_entrada)}</p>
                  </div>
                  <Badge variant={sv}>{sl}</Badge>
                  <button
                    onClick={() => setConfirmRemoveId(m.id)}
                    aria-label="Remover membro"
                    className="p-1 rounded text-gray-300 hover:text-red-400 transition-colors"
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
            <CardTitle className="flex items-center gap-2 text-gray-700">
              <BookOpen size={15} />
              Aulas — {grupo.modulo?.nome}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {aulasArray.map((num) => {
                const p = progresso.find((pr) => pr.numero_aula === num)
                const status = p?.status ?? 'pendente'
                const icon =
                  status === 'realizada' ? <CheckCircle2 size={18} className="text-green-500" /> :
                  status === 'cancelada' ? <XCircle size={18} className="text-red-400" /> :
                  <Circle size={18} className="text-gray-300" />

                return (
                  <button
                    key={num}
                    onClick={() => toggleAula.mutate({ numeroAula: num, statusAtual: status as StatusAula })}
                    disabled={grupo.status === 'encerrado'}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      status === 'realizada'
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-100 hover:border-primary-200 hover:bg-gray-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {icon}
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${status === 'realizada' ? 'text-green-700' : 'text-gray-700'}`}>
                        Aula {num}
                      </p>
                      {p?.data_realizada && (
                        <p className="text-xs text-gray-400">{formatDate(p.data_realizada)}</p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {realizadas === totalAulas && (
              <div className="mt-4 p-3 bg-green-50 rounded-xl border border-green-200 text-center">
                <p className="text-sm font-semibold text-green-700">🎉 Módulo concluído!</p>
                <p className="text-xs text-green-600 mt-0.5">Todas as aulas foram realizadas.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog: Adicionar membro */}
      <Dialog
        open={showAddMembro}
        onOpenChange={setShowAddMembro}
        title="Adicionar Membro"
        description="Selecione um convertido para adicionar ao grupo"
      >
        <div className="space-y-4">
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
            className="text-red-600 border-red-300 hover:bg-red-50"
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
