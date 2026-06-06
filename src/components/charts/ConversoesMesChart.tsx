import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { CHART_COLORS } from '@/lib/chartColors'

async function fetchConversoesPorMes() {
  // Busca convertidos dos últimos 6 meses
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  sixMonthsAgo.setDate(1)

  const { data } = await supabase
    .from('novos_convertidos')
    .select('data_conversao')
    .gte('data_conversao', sixMonthsAgo.toISOString().split('T')[0])
    .order('data_conversao', { ascending: true })

  // Agrupa por mês
  const counts: Record<string, number> = {}
  const now = new Date()

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    counts[key] = 0
  }

  for (const row of data ?? []) {
    if (!row.data_conversao) continue
    const key = row.data_conversao.slice(0, 7)
    if (key in counts) counts[key]++
  }

  const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

  return Object.entries(counts).map(([key, value]) => {
    const [, mes] = key.split('-')
    return { mes: MESES[parseInt(mes) - 1], total: value }
  })
}

export function ConversoesMesChart() {
  const { data = [] } = useQuery({
    queryKey: ['chart-conversoes-mes'],
    queryFn: fetchConversoesPorMes,
    staleTime: 1000 * 60 * 5,
  })

  return (
    <Card className="p-5">
      <h3 className="text-base font-serif font-semibold text-stone-900 mb-4">Conversões por Mês</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D9" />
          <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#A8A29E' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: '#A8A29E' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: '1px solid #E8E2D9', fontSize: 13, color: '#1C1917' }}
            formatter={(v) => [v, 'Conversões']}
          />
          <Bar dataKey="total" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
