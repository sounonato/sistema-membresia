import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

const CATEGORIAS = ['masculino', 'feminino', 'jovem', 'adolescente'] as const

const CORES: Record<string, string> = {
  masculino: '#3b82f6',
  feminino: '#ec4899',
  jovem: '#f59e0b',
  adolescente: '#10b981',
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
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Distribuição por Categoria</h3>
      {total === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">Sem dados</p>
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
              contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
              formatter={(v) => [`${v} pessoas`, '']}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => <span style={{ fontSize: 12, color: '#6b7280' }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
