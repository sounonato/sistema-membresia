import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, Filter, Users, Link2, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Avatar } from '@/components/ui/avatar'
import { Badge, statusConvertidoBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatDate, formatPhone } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import type { NovoConvertido, StatusConvertido } from '@/types'

async function fetchConvertidos(search: string, status: string) {
  let query = supabase
    .from('novos_convertidos')
    .select('*')
    .order('criado_em', { ascending: false })

  if (search) query = query.ilike('nome', `%${search}%`)
  if (status) query = query.eq('status', status)

  const { data } = await query
  return (data ?? []) as NovoConvertido[]
}

const statusOptions: { value: StatusConvertido | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'ativo', label: 'Ativo' },
  { value: 'em_discipulado', label: 'Em Discipulado' },
  { value: 'encerrado', label: 'Encerrado' },
  { value: 'inativo', label: 'Inativo' },
]

export default function Convertidos() {
  const { canEdit } = useAuth()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusConvertido | ''>('')
  const [copiado, setCopiado] = useState(false)

  function copiarLink() {
    const link = `${window.location.origin}/formulario`
    navigator.clipboard.writeText(link)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  const { data: convertidos = [], isLoading } = useQuery({
    queryKey: ['convertidos', search, statusFilter],
    queryFn: () => fetchConvertidos(search, statusFilter),
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-900">Convertidos</h1>
          <p className="text-sm text-stone-500 mt-1">{convertidos.length} cadastrados</p>
        </div>
        <div className="flex gap-2">
          <Button size="md" variant="outline" onClick={copiarLink}>
            {copiado ? <Check size={15} className="text-green-500" /> : <Link2 size={15} />}
            {copiado ? 'Copiado!' : 'Copiar link'}
          </Button>
          {canEdit && (
            <Link to="/convertidos/novo">
              <Button size="md">
                <Plus size={16} />
                Novo Convertido
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white text-stone-900 placeholder:text-stone-400 transition-all"
          />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusConvertido | '')}
            className="pl-9 pr-8 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white text-stone-900 transition-all"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-stone-100 h-20 animate-pulse rounded-2xl border border-stone-200" />
          ))}
        </div>
      ) : convertidos.length === 0 ? (
        <Card className="p-10 text-center">
          <Users size={40} className="text-stone-300 mx-auto mb-4" />
          <p className="text-stone-500 font-medium">Nenhum convertido encontrado</p>
          <p className="text-sm text-stone-400 mt-1">Tente outro filtro ou cadastre um novo</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {/* Desktop table header */}
          <div className="hidden sm:grid grid-cols-[2fr_1.5fr_1.5fr_120px] gap-4 px-5 py-3 bg-stone-50 border-b border-stone-100 text-xs font-semibold text-stone-500 uppercase tracking-wide">
            <span>Nome</span>
            <span>Telefone</span>
            <span>Conversão</span>
            <span>Status</span>
          </div>

          <div className="divide-y divide-stone-100">
            {convertidos.map((c) => {
              const { variant, label } = statusConvertidoBadge(c.status)
              return (
                <Link
                  key={c.id}
                  to={`/convertidos/${c.id}`}
                  className="flex sm:grid sm:grid-cols-[2fr_1.5fr_1.5fr_120px] items-center gap-4 px-5 py-3.5 hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={c.nome} size="md" src={c.foto_url} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-stone-900 truncate">{c.nome}</p>
                      <p className="text-xs text-stone-400 sm:hidden">{formatDate(c.data_conversao)}</p>
                    </div>
                  </div>
                  <span className="hidden sm:block text-sm text-stone-600">{formatPhone(c.telefone)}</span>
                  <span className="hidden sm:block text-sm text-stone-600">{formatDate(c.data_conversao)}</span>
                  <Badge variant={variant}>{label}</Badge>
                </Link>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
