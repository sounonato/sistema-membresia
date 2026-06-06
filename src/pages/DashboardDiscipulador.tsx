import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BookOpen, Users, CheckSquare, Phone, MessageSquare, Calendar, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { StatCard } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { formatRelative } from '@/lib/utils'
import type { Acompanhamento } from '@/types'

async function fetchMeuDiscipulador(userId: string) {
  const { data } = await supabase
    .from('discipuladores')
    .select('id, nome')
    .eq('usuario_id', userId)
    .single()
  return data as { id: string; nome: string } | null
}

async function fetchMeusGrupos(discipuladorId: string) {
  const { data } = await supabase
    .from('grupos_discipulado')
    .select(`
      *,
      modulo:modulos_discipulado(nome, total_aulas),
      membros:grupo_membros(id, status, data_entrada, convertido:novos_convertidos(id, nome, foto_url, telefone)),
      progresso:progresso_aulas(numero_aula, status)
    `)
    .eq('discipulador_id', discipuladorId)
    .eq('status', 'ativo')
    .order('criado_em', { ascending: false })
  return data ?? []
}

async function fetchUltimosAcompanhamentos(discipuladorId: string) {
  const { data } = await supabase
    .from('acompanhamentos')
    .select('convertido_id, data_contato, tipo_contato, observacao')
    .eq('discipulador_id', discipuladorId)
    .order('data_contato', { ascending: false })
    .limit(200)
  return (data ?? []) as Pick<Acompanhamento, 'convertido_id' | 'data_contato' | 'tipo_contato' | 'observacao'>[]
}

const TIPO_ICONS: Record<string, React.ReactNode> = {
  presencial: <Users size={12} />,
  telefone: <Phone size={12} />,
  mensagem: <MessageSquare size={12} />,
  outro: <Calendar size={12} />,
}

interface RegistroDialogProps {
  open: boolean
  onClose: () => void
  convertidoId: string
  convertidoNome: string
  grupoId: string
  discipuladorId: string
}

function RegistroDialog({ open, onClose, convertidoId, convertidoNome, grupoId, discipuladorId }: RegistroDialogProps) {
  const queryClient = useQueryClient()
  const [data_contato, setDataContato] = useState(new Date().toISOString().split('T')[0])
  const [tipo_contato, setTipoContato] = useState('presencial')
  const [observacao, setObservacao] = useState('')

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('acompanhamentos').insert({
        convertido_id: convertidoId,
        grupo_id: grupoId,
        discipulador_id: discipuladorId,
        data_contato,
        tipo_contato,
        observacao: observacao || null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meus-acompanhamentos', discipuladorId] })
      setObservacao('')
      onClose()
    },
  })

  return (
    <Dialog open={open} onOpenChange={onClose} title={`Registrar contato`} description={convertidoNome}>
      <div className="space-y-4">
        <Input
          label="Data do contato"
          type="date"
          value={data_contato}
          onChange={(e) => setDataContato(e.target.value)}
        />
        <Select
          label="Tipo de contato"
          value={tipo_contato}
          onChange={(e) => setTipoContato(e.target.value)}
          options={[
            { value: 'presencial', label: 'Presencial' },
            { value: 'telefone', label: 'Telefone / Ligação' },
            { value: 'mensagem', label: 'WhatsApp / Mensagem' },
            { value: 'outro', label: 'Outro' },
          ]}
        />
        <Textarea
          label="Observação (opcional)"
          placeholder="Como foi o contato? Algum ponto de oração?"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
        />
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => save.mutate()} loading={save.isPending}>
            Salvar
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

export default function DashboardDiscipulador() {
  const { user, profile } = useAuth()
  const [dialogState, setDialogState] = useState<{
    open: boolean
    convertidoId: string
    convertidoNome: string
    grupoId: string
  }>({ open: false, convertidoId: '', convertidoNome: '', grupoId: '' })

  const { data: discipulador, isLoading: loadingDisc } = useQuery({
    queryKey: ['meu-discipulador', user?.id],
    queryFn: () => fetchMeuDiscipulador(user!.id),
    enabled: !!user,
  })

  const { data: grupos = [], isLoading: loadingGrupos } = useQuery({
    queryKey: ['meus-grupos', discipulador?.id],
    queryFn: () => fetchMeusGrupos(discipulador!.id),
    enabled: !!discipulador?.id,
  })

  const { data: acompanhamentos = [] } = useQuery({
    queryKey: ['meus-acompanhamentos', discipulador?.id],
    queryFn: () => fetchUltimosAcompanhamentos(discipulador!.id),
    enabled: !!discipulador?.id,
  })

  // Calcular KPIs
  const totalMembros = grupos.reduce((acc: number, g: any) => {
    return acc + (g.membros?.filter((m: any) => m.status === 'ativo').length ?? 0)
  }, 0)

  const aulasRealizadas = grupos.reduce((acc: number, g: any) => {
    return acc + (g.progresso?.filter((p: any) => p.status === 'realizada').length ?? 0)
  }, 0)

  // Último acompanhamento por convertido
  const ultimoAcomp = (convertidoId: string) =>
    acompanhamentos.find((a) => a.convertido_id === convertidoId)

  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  if (loadingDisc || loadingGrupos) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-xl" />)}
      </div>
    )
  }

  if (!discipulador) {
    return (
      <div className="text-center py-16">
        <BookOpen size={48} className="text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Você ainda não está cadastrado como discipulador.</p>
        <p className="text-sm text-gray-400 mt-1">Peça ao líder para vincular seu usuário a um discipulador.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {saudacao}, {profile?.nome?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Seu painel de discipulado</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Grupos Ativos" value={grupos.length} icon={<BookOpen size={20} />} color="purple" />
        <StatCard title="Convertidos" value={totalMembros} icon={<Users size={20} />} color="blue" />
        <StatCard title="Aulas Realizadas" value={aulasRealizadas} icon={<CheckSquare size={20} />} color="green" />
      </div>

      {/* Grupos */}
      {grupos.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BookOpen size={40} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Nenhum grupo ativo atribuído a você</p>
          <p className="text-sm text-gray-400 mt-1">O líder vai designar seus grupos em breve.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {grupos.map((grupo: any) => {
            const membrosAtivos = grupo.membros?.filter((m: any) => m.status === 'ativo') ?? []
            const realizadas = grupo.progresso?.filter((p: any) => p.status === 'realizada').length ?? 0
            const totalAulas = grupo.modulo?.total_aulas ?? 0

            return (
              <div key={grupo.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Header do grupo */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{grupo.nome}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{grupo.modulo?.nome ?? 'Módulo não definido'}</p>
                  </div>
                  {totalAulas > 0 && (
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary-600">{realizadas}/{totalAulas}</p>
                      <p className="text-xs text-gray-400">aulas</p>
                    </div>
                  )}
                </div>

                {totalAulas > 0 && (
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                    <Progress value={realizadas} max={totalAulas} color={realizadas === totalAulas ? 'green' : 'primary'} />
                  </div>
                )}

                {/* Membros */}
                <div className="divide-y divide-gray-50">
                  {membrosAtivos.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">Nenhum membro ativo</p>
                  ) : (
                    membrosAtivos.map((m: any) => {
                      const c = m.convertido
                      const ultimo = ultimoAcomp(c.id)
                      return (
                        <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                          <Avatar name={c.nome} size="md" src={c.foto_url} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{c.nome}</p>
                            {ultimo ? (
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-gray-400">{TIPO_ICONS[ultimo.tipo_contato]}</span>
                                <p className="text-xs text-gray-400">
                                  Último contato {formatRelative(ultimo.data_contato)}
                                </p>
                              </div>
                            ) : (
                              <p className="text-xs text-amber-500 mt-0.5">Sem registro de contato</p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setDialogState({
                              open: true,
                              convertidoId: c.id,
                              convertidoNome: c.nome,
                              grupoId: grupo.id,
                            })}
                          >
                            <Plus size={13} />
                            Contato
                          </Button>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Footer com link para aulas */}
                <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
                  <Link
                    to={`/discipulado/${grupo.id}`}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Gerenciar aulas do grupo →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Dialog de registro */}
      {dialogState.open && discipulador && (
        <RegistroDialog
          open={dialogState.open}
          onClose={() => setDialogState(s => ({ ...s, open: false }))}
          convertidoId={dialogState.convertidoId}
          convertidoNome={dialogState.convertidoNome}
          grupoId={dialogState.grupoId}
          discipuladorId={discipulador.id}
        />
      )}
    </div>
  )
}
