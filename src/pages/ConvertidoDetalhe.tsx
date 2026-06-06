import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Phone, Mail, MapPin, Calendar, Edit, BookOpen,
  Church, Baby, Briefcase, Heart, Users
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Avatar } from '@/components/ui/avatar'
import { Badge, statusConvertidoBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Select } from '@/components/ui/select'
import { formatDate, formatPhone, COMO_CONHECEU_LABELS, ESTADO_CIVIL_LABELS } from '@/lib/utils'
import type { NovoConvertido, StatusConvertido, GrupoDiscipulado } from '@/types'

async function fetchConvertido(id: string) {
  const { data } = await supabase.from('novos_convertidos').select('*').eq('id', id).single()
  return data as NovoConvertido
}

async function fetchGruposDoConvertido(id: string) {
  const { data } = await supabase
    .from('grupo_membros')
    .select('*, grupo:grupos_discipulado(*, discipulador:discipuladores(*), modulo:modulos_discipulado(*), progresso:progresso_aulas(*))')
    .eq('convertido_id', id)
  return data ?? []
}

interface InfoRowProps {
  icon: React.ElementType
  label: string
  value: string | null | undefined
}

function InfoRow({ icon: Icon, label, value }: InfoRowProps) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3">
      <Icon size={15} className="text-stone-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-stone-400">{label}</p>
        <p className="text-sm text-stone-900 font-medium">{value}</p>
      </div>
    </div>
  )
}

export default function ConvertidoDetalhe() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [novoStatus, setNovoStatus] = useState<StatusConvertido>('ativo')

  const { data: convertido, isLoading } = useQuery({
    queryKey: ['convertido', id],
    queryFn: () => fetchConvertido(id!),
    enabled: !!id,
  })

  const { data: grupos = [] } = useQuery({
    queryKey: ['grupos-convertido', id],
    queryFn: () => fetchGruposDoConvertido(id!),
    enabled: !!id,
  })

  const updateStatus = useMutation({
    mutationFn: async (status: StatusConvertido) => {
      await supabase.from('novos_convertidos').update({ status }).eq('id', id!)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['convertido', id] })
      queryClient.invalidateQueries({ queryKey: ['convertidos'] })
      setShowStatusDialog(false)
    },
  })

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-stone-100 border border-stone-200 rounded-lg w-48" />
        <div className="h-48 bg-stone-100 border border-stone-200 rounded-2xl" />
      </div>
    )
  }

  if (!convertido) return <p className="text-stone-500">Convertido não encontrado.</p>

  const { variant, label } = statusConvertidoBadge(convertido.status)

  const endereco = [convertido.endereco, convertido.bairro, convertido.cidade]
    .filter(Boolean).join(', ')

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="Voltar" className="p-2 rounded-xl text-stone-500 hover:bg-stone-100 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-serif font-bold text-stone-900">Perfil do Convertido</h1>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="flex items-center gap-4 p-5">
          <Avatar name={convertido.nome} size="xl" src={convertido.foto_url} />
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-serif font-bold text-stone-900">{convertido.nome}</h2>
            <p className="text-sm text-stone-500 mt-0.5">
              Convertido em {formatDate(convertido.data_conversao)}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={variant}>{label}</Badge>
              {convertido.batizado && <Badge variant="info">Batizado</Badge>}
              {convertido.quer_batismo && <Badge variant="warning">Quer Batismo</Badge>}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button size="sm" variant="outline" onClick={() => {
              setNovoStatus(convertido.status)
              setShowStatusDialog(true)
            }}>
              <Edit size={13} />
              Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contato */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-stone-700">
            <Phone size={15} />
            Contato
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow icon={Phone} label="Telefone" value={formatPhone(convertido.telefone)} />
          <InfoRow icon={Mail} label="E-mail" value={convertido.email} />
          <InfoRow icon={MapPin} label="Endereço" value={endereco || undefined} />
        </CardContent>
      </Card>

      {/* Informações pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-stone-700">
            <Heart size={15} />
            Informações Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow icon={Calendar} label="Data de nascimento" value={formatDate(convertido.data_nascimento)} />
          <InfoRow icon={Users} label="Estado civil" value={convertido.estado_civil ? ESTADO_CIVIL_LABELS[convertido.estado_civil] : null} />
          <InfoRow icon={Baby} label="Filhos" value={convertido.tem_filhos ? `Sim (${convertido.qtd_filhos})` : 'Não'} />
          <InfoRow icon={Briefcase} label="Profissão" value={convertido.profissao} />
          <InfoRow icon={Church} label="Como conheceu" value={convertido.como_conheceu ? COMO_CONHECEU_LABELS[convertido.como_conheceu] : null} />
          {convertido.ja_frequentava_igreja && (
            <InfoRow icon={Church} label="Igreja anterior" value={convertido.igreja_anterior ?? 'Não informado'} />
          )}
        </CardContent>
      </Card>

      {/* Discipulado */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-stone-700">
              <BookOpen size={15} />
              Discipulado
            </CardTitle>
            <Link to="/discipulado">
              <Button size="sm" variant="secondary">
                <BookOpen size={13} />
                Adicionar a grupo
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {grupos.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-4">
              Não está em nenhum grupo de discipulado ainda.
            </p>
          ) : (
            <div className="space-y-3">
              {grupos.map((gm: any) => {
                const grupo = gm.grupo as GrupoDiscipulado
                const realizadas = grupo.progresso?.filter((p: any) => p.status === 'realizada').length ?? 0
                const total = grupo.modulo?.total_aulas ?? 0
                return (
                  <Link
                    key={gm.id}
                    to={`/discipulado/${grupo.id}`}
                    className="flex items-center justify-between p-3 rounded-xl border border-stone-100 hover:border-amber-200 hover:bg-amber-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-stone-900">{grupo.nome}</p>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Discipulador: {grupo.discipulador?.nome} · {grupo.modulo?.nome ?? 'Módulo não definido'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-amber-700">
                        {realizadas}/{total > 0 ? total : '—'}
                      </p>
                      <p className="text-xs text-stone-400">aulas</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Observações */}
      {convertido.observacoes && (
        <Card>
          <CardHeader><CardTitle>Observações</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-stone-600 leading-relaxed">{convertido.observacoes}</p>
          </CardContent>
        </Card>
      )}

      {/* Status Dialog */}
      <Dialog
        open={showStatusDialog}
        onOpenChange={setShowStatusDialog}
        title="Alterar Status"
        description="Selecione o novo status do convertido"
      >
        <div className="space-y-4">
          <Select
            label="Status"
            value={novoStatus}
            onChange={(e) => setNovoStatus(e.target.value as StatusConvertido)}
            options={[
              { value: 'ativo', label: 'Ativo' },
              { value: 'em_discipulado', label: 'Em Discipulado' },
              { value: 'encerrado', label: 'Encerrado' },
              { value: 'inativo', label: 'Inativo' },
            ]}
          />
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>Cancelar</Button>
            <Button
              onClick={() => updateStatus.mutate(novoStatus)}
              loading={updateStatus.isPending}
            >
              Alterar Status
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
