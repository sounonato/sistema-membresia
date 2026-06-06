import { useQuery } from '@tanstack/react-query'
import { Users, BookOpen, UserCheck, TrendingUp, CalendarCheck, Award } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { StatCard } from '@/components/ui/card'
import { Badge, statusConvertidoBadge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { formatDate, formatRelative } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { ConversoesMesChart } from '@/components/charts/ConversoesMesChart'
import { GeneroChart } from '@/components/charts/GeneroChart'
import { FaixaEtariaChart } from '@/components/charts/FaixaEtariaChart'
import type { NovoConvertido } from '@/types'

async function fetchStats() {
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [totalRes, mesRes, discipuladoRes, gruposRes] = await Promise.all([
    supabase.from('novos_convertidos').select('id', { count: 'exact', head: true }),
    supabase.from('novos_convertidos').select('id', { count: 'exact', head: true }).gte('criado_em', firstDayOfMonth),
    supabase.from('novos_convertidos').select('id', { count: 'exact', head: true }).eq('status', 'em_discipulado'),
    supabase.from('grupos_discipulado').select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
  ])

  return {
    total: totalRes.count ?? 0,
    mes: mesRes.count ?? 0,
    em_discipulado: discipuladoRes.count ?? 0,
    grupos: gruposRes.count ?? 0,
  }
}

async function fetchRecentes() {
  const { data } = await supabase
    .from('novos_convertidos')
    .select('*')
    .order('criado_em', { ascending: false })
    .limit(8)
  return (data ?? []) as NovoConvertido[]
}

export default function DashboardLider() {
  const { profile } = useAuth()
  const { data: stats } = useQuery({ queryKey: ['stats'], queryFn: fetchStats })
  const { data: recentes } = useQuery({ queryKey: ['recentes'], queryFn: fetchRecentes })

  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {saudacao}, {profile?.nome?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">Acompanhamento do ministério de discipulado</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Convertidos" value={stats?.total ?? '—'} icon={<Users size={20} />} color="blue" />
        <StatCard title="Este Mês" value={stats?.mes ?? '—'} icon={<TrendingUp size={20} />} color="green" sub="novos convertidos" />
        <StatCard title="Em Discipulado" value={stats?.em_discipulado ?? '—'} icon={<BookOpen size={20} />} color="purple" />
        <StatCard title="Grupos Ativos" value={stats?.grupos ?? '—'} icon={<UserCheck size={20} />} color="orange" />
      </div>

      {/* Gráficos */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Análises do Ministério</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <ConversoesMesChart />
          </div>
          <div>
            <GeneroChart />
          </div>
        </div>
        <div className="mt-4">
          <FaixaEtariaChart />
        </div>
      </div>

      {/* Últimos convertidos */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Últimos Convertidos</h2>
          <Link to="/convertidos" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            Ver todos →
          </Link>
        </div>

        {!recentes?.length ? (
          <div className="p-8 text-center">
            <Award size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Nenhum convertido cadastrado ainda.</p>
            <Link to="/convertidos/novo" className="text-sm text-primary-600 font-medium mt-2 block">
              Cadastrar primeiro convertido →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentes.map((c) => {
              const { variant, label } = statusConvertidoBadge(c.status)
              return (
                <Link
                  key={c.id}
                  to={`/convertidos/${c.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors"
                >
                  <Avatar name={c.nome} size="md" src={c.foto_url} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{c.nome}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <CalendarCheck size={12} className="text-gray-400" />
                      <p className="text-xs text-gray-500">Convertido em {formatDate(c.data_conversao)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={variant}>{label}</Badge>
                    <span className="text-xs text-gray-400 hidden sm:block">{formatRelative(c.criado_em)}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
