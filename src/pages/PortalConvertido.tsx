import { useState } from 'react'
import { BookOpen, CheckCircle2, Lock, Church, ChevronRight, Award, Search, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

interface ProgressoAula {
  id: string
  aula_numero: number
  titulo: string
  status: 'realizada' | 'pendente'
  data_realizada?: string
}

interface Grupo {
  id: string
  nome: string
  discipulador: { nome: string; telefone: string } | null
  modulo: { nome: string; total_aulas: number } | null
  progresso: ProgressoAula[]
}

interface Dados {
  convertido: { id: string; nome: string; data_conversao: string }
  grupos: Grupo[]
}

export default function PortalConvertido() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [dados, setDados] = useState<Dados | null>(null)

  async function buscar(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setErro('')
    setDados(null)

    try {
      const res = await fetch(`${FUNCTIONS_URL}/portal-convertido`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': ANON_KEY,
        },
        body: JSON.stringify({ email: email.trim() }),
      })
      const json = await res.json()
      if (!res.ok) {
        setErro(json.error ?? 'Erro ao buscar dados.')
      } else {
        setDados(json)
      }
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const totalRealizadas = dados?.grupos.reduce(
    (acc, g) => acc + g.progresso.filter(p => p.status === 'realizada').length, 0
  ) ?? 0
  const totalAulas = dados?.grupos.reduce(
    (acc, g) => acc + (g.modulo?.total_aulas ?? g.progresso.length), 0
  ) ?? 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-white">
      {/* Header */}
      <div className="bg-stone-50 border-b border-stone-200 px-4 py-4 flex items-center gap-3">
        <div className="w-9 h-9 bg-amber-700 rounded-xl flex items-center justify-center">
          <Church size={18} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-serif font-bold text-stone-900">A Jornada do Discípulo</p>
          <p className="text-xs text-amber-700 font-medium">Acompanhamento</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">

        {/* Busca por e-mail */}
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-stone-700 mb-3">
              Digite seu e-mail para ver seu progresso no discipulado
            </p>
            <form onSubmit={buscar} className="flex gap-2">
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErro(''); setDados(null) }}
                className="flex-1"
              />
              <Button type="submit" loading={loading}>
                <Search size={16} />
                Buscar
              </Button>
            </form>
            {erro && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mt-3">
                {erro}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Resultado */}
        {dados && (
          <>
            {/* Saudação */}
            <div>
              <h1 className="text-2xl font-serif font-bold text-stone-900">
                Olá, {dados.convertido.nome.split(' ')[0]}! 👋
              </h1>
              <p className="text-sm text-stone-500 mt-0.5">
                Convertido em {new Date(dados.convertido.data_conversao).toLocaleDateString('pt-BR')}
              </p>
            </div>

            {/* KPIs */}
            {totalAulas > 0 && (
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-4 text-center">
                  <p className="text-3xl font-bold text-amber-700">{totalRealizadas}</p>
                  <p className="text-xs text-stone-500 mt-1">Aulas realizadas</p>
                </Card>
                <Card className="p-4 text-center">
                  <p className="text-3xl font-bold text-stone-700">
                    {Math.round((totalRealizadas / totalAulas) * 100)}%
                  </p>
                  <p className="text-xs text-stone-500 mt-1">Progresso</p>
                </Card>
              </div>
            )}

            {/* Grupos */}
            {dados.grupos.length === 0 ? (
              <Card className="p-8 text-center">
                <BookOpen size={36} className="text-stone-300 mx-auto mb-3" />
                <p className="text-sm text-stone-500">
                  Você ainda não está em nenhum grupo de discipulado.
                </p>
                <p className="text-xs text-stone-400 mt-1">
                  Fale com o seu líder para ser adicionado a um grupo.
                </p>
              </Card>
            ) : (
              dados.grupos.map((grupo) => {
                const realizadas = grupo.progresso.filter(p => p.status === 'realizada').length
                const total = grupo.modulo?.total_aulas ?? grupo.progresso.length
                const pct = total > 0 ? Math.round((realizadas / total) * 100) : 0

                return (
                  <Card key={grupo.id} className="overflow-hidden">
                    {/* Header do grupo */}
                    <div className="p-4 border-b border-stone-100">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar name={grupo.discipulador?.nome ?? '?'} size="md" />
                        <div className="flex-1">
                          <p className="font-serif font-bold text-stone-900">{grupo.nome}</p>
                          <p className="text-xs text-stone-500">
                            Discipulador: <span className="font-medium">{grupo.discipulador?.nome}</span>
                          </p>
                          {grupo.discipulador?.telefone && (
                            <a
                              href={`https://wa.me/55${grupo.discipulador.telefone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-amber-700 font-medium mt-0.5 hover:underline"
                            >
                              <Phone size={10} />
                              Falar no WhatsApp
                            </a>
                          )}
                          {grupo.modulo && (
                            <p className="text-xs text-stone-400 mt-0.5">{grupo.modulo.nome}</p>
                          )}
                        </div>
                      </div>

                      {/* Barra de progresso */}
                      <div>
                        <div className="flex justify-between text-xs text-stone-500 mb-1">
                          <span>{realizadas} de {total} aulas concluídas</span>
                          <span className="font-semibold text-amber-700">{pct}%</span>
                        </div>
                        <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-600 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Lista de aulas */}
                    <div className="divide-y divide-stone-50">
                      {grupo.progresso.length === 0 ? (
                        <p className="text-sm text-stone-400 text-center py-6">
                          Nenhuma aula registrada ainda.
                        </p>
                      ) : (
                        grupo.progresso.map((aula, idx) => {
                          const feita = aula.status === 'realizada'
                          const disponivel = feita || idx === 0 || grupo.progresso[idx - 1]?.status === 'realizada'

                          return (
                            <div
                              key={aula.id}
                              className={`flex items-center gap-3 px-4 py-3 ${feita ? 'bg-emerald-50/40' : ''}`}
                            >
                              {feita ? (
                                <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                              ) : disponivel ? (
                                <ChevronRight size={20} className="text-amber-500 shrink-0" />
                              ) : (
                                <Lock size={20} className="text-stone-300 shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${feita ? 'text-stone-700' : disponivel ? 'text-stone-900' : 'text-stone-400'}`}>
                                  Aula {aula.aula_numero}
                                  {aula.titulo ? ` — ${aula.titulo}` : ''}
                                </p>
                                {feita && aula.data_realizada && (
                                  <p className="text-xs text-emerald-600 mt-0.5">
                                    Realizada em {new Date(aula.data_realizada).toLocaleDateString('pt-BR')}
                                  </p>
                                )}
                                {!disponivel && (
                                  <p className="text-xs text-stone-400 mt-0.5">
                                    Disponível após a aula anterior
                                  </p>
                                )}
                              </div>
                              {feita && <Award size={14} className="text-amber-500 shrink-0" />}
                            </div>
                          )
                        })
                      )}
                    </div>
                  </Card>
                )
              })
            )}

            <p className="text-xs text-stone-400 text-center pb-4">
              Que Deus abençoe sua jornada! 🙏
            </p>
          </>
        )}
      </div>
    </div>
  )
}
