import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { CHART_COLORS } from '@/lib/chartColors'

const CATEGORIAS = ['masculino', 'feminino', 'jovem', 'adolescente'] as const

const CORES: Record<string, string> = {
  masculino: CHART_COLORS.primary,
  feminino: CHART_COLORS.secondary,
  jovem: CHART_COLORS.tertiary,
  adolescente: CHART_COLORS.quaternary,
}

const LABELS: Record<string, string> = {
  masculino: 'Masculino',
  feminino: 'Feminino',
  jovem: 'Jovem',
  adolescente: 'Adolescente',
}

async function fetchDistribuicao() {
  const { data } = await supabase.from('novos_convertidos').select('genero')

  const counts: Record<string, number> = {
    masculino: 0,
    feminino: 0,
    jovem: 0,
    adolescente: 0,
  }

  for (const row of data ?? []) {
    const g = row.genero as string | null
    if (g && g in counts) counts[g]++
  }

  return CATEGORIAS
    .filter((key) => counts[key] > 0)
    .map((key) => ({
      name: LABELS[key],
      value: counts[key],
      color: CORES[key],
    }))
}

export function GeneroChart() {
  const { data = [] } = useQuery({
    queryKey: ['chart-genero'],
    queryFn: fetchDistribuicao,
    staleTime: 1000 * 60 * 5,
  })

  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <Card className="p-5">
      <h3 className="text-base font-serif font-semibold text-stone-900 mb-4">Distribuição por Gênero / Faixa</h3>
      {total === 0 ? (
        <p className="text-sm text-stone-400 text-center py-12">Sem dados</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: 12, border: '1px solid #E8E2D9', fontSize: 13, color: '#1C1917' }}
              formatter={(v) => [`${v} pessoas`, '']}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => <span style={{ fontSize: 12, color: '#78716C' }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
