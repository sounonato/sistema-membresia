import { useState, useRef, useEffect } from 'react'
import { BookOpen, Send, Bot, User, Loader2, AlertCircle } from 'lucide-react'
import { chatManual } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface Mensagem {
  role: 'user' | 'model'
  content: string
}

const SUGESTOES = [
  'O que o manual diz sobre bebidas alcoólicas?',
  'Quais são as doutrinas fundamentais da Igreja do Nazareno?',
  'O que o manual diz sobre vestimenta e aparência?',
  'Quais são as regras sobre casamento e divórcio?',
  'O que é santificação segundo o manual?',
]

export default function ConsultarManual() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens, loading])

  async function enviar(pergunta?: string) {
    const texto = (pergunta ?? input).trim()
    if (!texto || loading) return

    const novaMensagem: Mensagem = { role: 'user', content: texto }
    const novaLista = [...mensagens, novaMensagem]
    setMensagens(novaLista)
    setInput('')
    setErro('')
    setLoading(true)

    try {
      const historico = novaLista.slice(-7, -1).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        content: m.content,
      }))
      const { resposta } = await chatManual(texto, historico)
      setMensagens(prev => [...prev, { role: 'model', content: resposta }])
    } catch (err: any) {
      setErro(err.message ?? 'Erro ao consultar. Tente novamente.')
      setMensagens(prev => prev.slice(0, -1))
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviar()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-3xl font-serif font-bold text-stone-900 flex items-center gap-3">
          <BookOpen size={28} className="text-amber-700" />
          Consultar Manual
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Tire dúvidas sobre doutrina e conduta com base no Manual da Igreja do Nazareno
        </p>
      </div>

      {/* Área do chat */}
      <Card className="flex-1 overflow-hidden flex flex-col">

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* Estado inicial */}
          {mensagens.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8">
              <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center mb-4">
                <BookOpen size={28} className="text-amber-700" />
              </div>
              <h2 className="text-lg font-serif font-bold text-stone-800 mb-1">
                Manual da Igreja do Nazareno
              </h2>
              <p className="text-sm text-stone-500 mb-6 max-w-sm">
                Faça perguntas sobre doutrina, conduta, casamento, batismo, santificação e muito mais.
              </p>
              <div className="flex flex-col gap-2 w-full max-w-sm">
                {SUGESTOES.map((s) => (
                  <button
                    key={s}
                    onClick={() => enviar(s)}
                    className="text-left text-sm px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:border-amber-300 hover:bg-amber-50 transition-colors text-stone-700"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Histórico de mensagens */}
          {mensagens.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'model' && (
                <div className="w-8 h-8 bg-amber-700 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={16} className="text-white" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-amber-700 text-white rounded-tr-sm'
                  : 'bg-stone-100 text-stone-800 rounded-tl-sm'
              }`}>
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 bg-stone-200 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <User size={16} className="text-stone-600" />
                </div>
              )}
            </div>
          ))}

          {/* Loading */}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 bg-amber-700 rounded-xl flex items-center justify-center shrink-0">
                <Bot size={16} className="text-white" />
              </div>
              <div className="bg-stone-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-amber-700" />
                <span className="text-sm text-stone-500">Consultando o manual...</span>
              </div>
            </div>
          )}

          {/* Erro */}
          {erro && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <AlertCircle size={16} />
              {erro}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-stone-100">
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Faça sua pergunta sobre o manual..."
              rows={1}
              className="flex-1 resize-none rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent max-h-32 overflow-y-auto"
              style={{ minHeight: '46px' }}
            />
            <Button
              onClick={() => enviar()}
              disabled={!input.trim() || loading}
              className="shrink-0 h-[46px] px-4"
            >
              <Send size={16} />
            </Button>
          </div>
          <p className="text-xs text-stone-400 mt-2 text-center">
            Respostas baseadas exclusivamente no Manual da Igreja do Nazareno 2023-2027
          </p>
        </div>
      </Card>
    </div>
  )
}
