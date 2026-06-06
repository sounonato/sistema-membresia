import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { CHART_SERIES } from '@/lib/chartColors'

const FAIXAS = [
  { label: '< 18', min: 0, max: 17 },
  { label: '18–25', min: 18, max: 25 },
  { label: '26–35', min: 26, max: 35 },
  { label: '36–45', min: 36, max: 45 },
  { label: '46–60', min: 46, max: 60 },
  { label: '> 60', min: 61, max: 999 },
]

async function fetchFaixaEtaria() {
  const { data } = await supabase
    .from('novos_convertidos')
    .select('data_nascimento')
    .not('data_nascimento', 'is', null)

  const counts = FAIXAS.map((f) => ({ label: f.label, total: 0 }))
  const hoje = new Date()

  for (const row of data ?? []) {
    if (!row.data_nascimento) continue
    const nasc = new Date(row.data_nascimento)
    const idade = hoje.getFullYear() - nasc.getFullYear() -
      (hoje < new Date(hoje.getFullYear(), nasc.getMonth(), nasc.getDate()) ? 1 : 0)

    const idx = FAIXAS.findIndex((f) => idade >= f.min && idade <= f.max)
    if (idx !== -1) counts[idx].total++
  }

  return counts.filter((c) => c.total > 0).length > 0 ? counts : counts
}

export function FaixaEtariaChart() {
  const { data = [] } = useQuery({
    queryKey: ['chart-faixa-etaria'],
    queryFn: fetchFaixaEtaria,
    staleTime: 1000 * 60 * 5,
  })

  return (
    <Card className="p-5">
      <h3 className="text-base font-serif font-semibold text-stone-900 mb-4">Faixa Etária</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D9" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#A8A29E' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: '#A8A29E' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: '1px solid #E8E2D9', fontSize: 13, color: '#1C1917' }}
            formatter={(v) => [v, 'Pessoas']}
          />
          <Bar dataKey="total" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_SERIES[i % CHART_SERIES.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
