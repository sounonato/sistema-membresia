# Plano: IA de Consulta ao Manual da Nazarena

## Visão geral

- Acessível apenas a: discipuladores, líderes, pastores e admin
- IA responde SOMENTE sobre o Manual da Igreja do Nazareno
- Tecnologia: Google Gemini Flash (gratuito)
- Arquitetura: PDF → texto → Supabase Storage → Edge Function → Gemini API → chat UI

---

## PASSO 1 — Extrair texto do PDF

Execute este script Node.js para extrair o texto do manual:

```bash
cd "/Users/andersonnonato/Documents/CLAUDE CODE/sistema-membresia"
npm install pdf-parse --save-dev
node scripts/extract-manual.js
```

Antes de rodar, crie o arquivo `scripts/extract-manual.js`:

```js
const fs = require('fs')
const path = require('path')
const pdf = require('pdf-parse')

const pdfPath = '/Users/andersonnonato/Downloads/Manual-da-Igreja-do-Nazareno_2023-2027.pdf'
const outputPath = path.join(__dirname, '..', 'manual_nazareno.txt')

async function main() {
  const dataBuffer = fs.readFileSync(pdfPath)
  const data = await pdf(dataBuffer)
  fs.writeFileSync(outputPath, data.text, 'utf8')
  const sizeKB = Math.round(fs.statSync(outputPath).size / 1024)
  console.log(`✅ Texto extraído com sucesso!`)
  console.log(`📄 Total de páginas: ${data.numpages}`)
  console.log(`📝 Tamanho do arquivo: ${sizeKB} KB`)
  console.log(`📁 Salvo em: ${outputPath}`)
}

main().catch(console.error)
```

Após rodar, confirme que o arquivo `manual_nazareno.txt` foi criado na raiz do projeto.

---

## PASSO 2 — Fazer upload do texto para o Supabase Storage

Execute este script para enviar o manual para o Supabase Storage:

```bash
node scripts/upload-manual.js
```

Crie o arquivo `scripts/upload-manual.js`:

```js
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Lê variáveis do .env
const envPath = path.join(__dirname, '..', '.env')
const envContent = fs.readFileSync(envPath, 'utf8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=')
  if (key && vals.length) envVars[key.trim()] = vals.join('=').trim()
})

const supabaseUrl = envVars['VITE_SUPABASE_URL']
const supabaseKey = envVars['VITE_SUPABASE_ANON_KEY']

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não encontradas no .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
const filePath = path.join(__dirname, '..', 'manual_nazareno.txt')

async function main() {
  const content = fs.readFileSync(filePath)
  const { error } = await supabase.storage
    .from('documentos')
    .upload('manual_nazareno.txt', content, {
      contentType: 'text/plain',
      upsert: true,
    })

  if (error) {
    console.error('❌ Erro no upload:', error.message)
    console.log('\n⚠️  Se o bucket "documentos" não existir, crie-o no Supabase:')
    console.log('   Supabase Dashboard → Storage → New bucket → nome: "documentos" → Public: OFF')
    process.exit(1)
  }

  console.log('✅ Manual enviado para o Supabase Storage com sucesso!')
  console.log('   Bucket: documentos')
  console.log('   Arquivo: manual_nazareno.txt')
}

main().catch(console.error)
```

### ⚠️ ANTES de rodar o upload:
Acesse o Supabase Dashboard e crie o bucket manualmente:
- URL: https://supabase.com/dashboard/project/nsdljlapyiamvqxqrwbp/storage/buckets
- Clique em **"New bucket"**
- Nome: `documentos`
- Public: **OFF** (privado)
- Clique em **Create bucket**

Depois rode o script de upload.

---

## PASSO 3 — Criar Edge Function `chat-manual`

Criar o arquivo `supabase/functions/chat-manual/index.ts`:

```ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  // Verificar autenticação
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Verificar se usuário está autenticado
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Sessão inválida' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const { pergunta, historico = [] } = await req.json()

  if (!pergunta || typeof pergunta !== 'string' || pergunta.trim().length < 3) {
    return new Response(JSON.stringify({ error: 'Pergunta inválida.' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Buscar o manual do Supabase Storage
  const { data: fileData, error: storageError } = await supabase.storage
    .from('documentos')
    .download('manual_nazareno.txt')

  if (storageError || !fileData) {
    return new Response(JSON.stringify({ error: 'Manual não encontrado. Contate o administrador.' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const manualTexto = await fileData.text()

  // Chamar Gemini API
  const geminiKey = Deno.env.get('GEMINI_API_KEY')
  if (!geminiKey) {
    return new Response(JSON.stringify({ error: 'Configuração de IA incompleta.' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const systemPrompt = `Você é um assistente especialista no Manual da Igreja do Nazareno (edição 2023-2027).

REGRAS ABSOLUTAS:
1. Responda SOMENTE com base no conteúdo do manual fornecido abaixo.
2. Se a pergunta não estiver no manual ou for sobre outro assunto qualquer, responda EXATAMENTE: "Não encontrei essa informação no Manual da Igreja do Nazareno. Recomendo consultar seu líder ou pastor para orientação."
3. NUNCA opine, NUNCA invente, NUNCA use conhecimento externo ao manual.
4. Cite sempre a seção ou parágrafo do manual quando possível.
5. Seja respeitoso, claro e objetivo.
6. Responda em português brasileiro.

CONTEÚDO DO MANUAL:
${manualTexto.substring(0, 800000)}`

  const messages = [
    ...historico.slice(-6).map((h: any) => ({
      role: h.role,
      parts: [{ text: h.content }]
    })),
    {
      role: 'user',
      parts: [{ text: pergunta }]
    }
  ]

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: messages,
        generationConfig: {
          temperature: 0.1,       // baixa temperatura = respostas mais conservadoras/precisas
          maxOutputTokens: 1024,
          topP: 0.8,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ]
      }),
    }
  )

  if (!geminiRes.ok) {
    const err = await geminiRes.text()
    console.error('Gemini error:', err)
    return new Response(JSON.stringify({ error: 'Erro ao consultar a IA. Tente novamente.' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const geminiData = await geminiRes.json()
  const resposta = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Não foi possível gerar uma resposta.'

  return new Response(JSON.stringify({ resposta }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})
```

---

## PASSO 4 — Adicionar `chatManual` em `src/lib/api.ts`

Adicionar ao final do arquivo `src/lib/api.ts`:

```ts
export async function chatManual(pergunta: string, historico: { role: string; content: string }[]) {
  const headers = await authHeaders()
  const res = await fetch(`${FUNCTIONS_URL}/chat-manual`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ pergunta, historico }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'Erro ao consultar o manual')
  }
  return res.json() as Promise<{ resposta: string }>
}
```

---

## PASSO 5 — Criar página `src/pages/ConsultarManual.tsx`

```tsx
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
```

---

## PASSO 6 — Adicionar rota e nav em `src/App.tsx`

```tsx
import ConsultarManual from '@/pages/ConsultarManual'

// Adicionar rota (dentro de <Routes>, antes do catch-all):
<Route path="/manual" element={<PrivateRoute><ConsultarManual /></PrivateRoute>} />
```

---

## PASSO 7 — Adicionar item no menu `src/components/layout/Sidebar.tsx`

Importar `BookMarked` do lucide-react e adicionar em AMBOS os arrays de nav (NAV_LIDER e NAV_DISCIPULADOR):

```ts
import { ..., BookMarked } from 'lucide-react'

const NAV_LIDER = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/convertidos', icon: Users, label: 'Convertidos' },
  { to: '/discipulado', icon: BookOpen, label: 'Discipulado' },
  { to: '/discipuladores', icon: UserCheck, label: 'Discipuladores' },
  { to: '/modulos', icon: GraduationCap, label: 'Módulos' },
  { to: '/manual', icon: BookMarked, label: 'Consultar Manual' },  // ← adicionar
]

const NAV_DISCIPULADOR = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/discipulado', icon: BookOpen, label: 'Meus Grupos' },
  { to: '/manual', icon: BookMarked, label: 'Consultar Manual' },  // ← adicionar
]
```

---

## PASSO 8 — Deploy das Edge Functions e build

```bash
cd "/Users/andersonnonato/Documents/CLAUDE CODE/sistema-membresia"

# Build para verificar erros TypeScript
npm run build

# Deploy da Edge Function
npx supabase functions deploy chat-manual

# Commit e push
git add -A
git commit -m "feat: IA de consulta ao Manual da Igreja do Nazareno"
git push origin main

# Deploy Vercel
npx vercel --prod --yes
```

---

## PASSO 9 — ⚠️ INSTRUÇÕES DE CONFIGURAÇÃO DA API KEY (mostrar ao usuário)

Após completar todos os passos acima, exiba as seguintes instruções:

---

### 🔑 Como configurar a chave da API Gemini (OBRIGATÓRIO para a IA funcionar)

**Passo 1 — Obter a chave gratuita:**
1. Acesse: https://aistudio.google.com/app/apikey
2. Faça login com sua conta Google
3. Clique em **"Create API key"**
4. Copie a chave gerada (começa com `AIza...`)

**Passo 2 — Adicionar no Supabase:**
1. Acesse: https://supabase.com/dashboard/project/nsdljlapyiamvqxqrwbp/settings/functions
2. Clique em **"Add new secret"**
3. Nome: `GEMINI_API_KEY`
4. Valor: cole a chave copiada
5. Clique em **Save**

**Passo 3 — Criar o bucket de Storage (se ainda não fez):**
1. Acesse: https://supabase.com/dashboard/project/nsdljlapyiamvqxqrwbp/storage/buckets
2. Clique em **"New bucket"**
3. Nome: `documentos` — Public: **OFF**
4. Clique em **Create bucket**

**Passo 4 — Fazer upload do manual:**
```bash
cd "/Users/andersonnonato/Documents/CLAUDE CODE/sistema-membresia"
node scripts/extract-manual.js   # extrai o texto do PDF
node scripts/upload-manual.js    # envia para o Supabase
```

**Passo 5 — Testar:**
- Acesse o sistema → menu "Consultar Manual"
- Faça uma pergunta como: "O que o manual diz sobre bebidas alcoólicas?"
- A IA deve responder com base no manual ✅

---

## Checklist completo

- [ ] `scripts/extract-manual.js` criado e rodado → `manual_nazareno.txt` gerado
- [ ] Bucket `documentos` criado no Supabase Storage
- [ ] `scripts/upload-manual.js` criado e rodado → manual no Storage
- [ ] `supabase/functions/chat-manual/index.ts` criado
- [ ] `chatManual()` adicionado em `src/lib/api.ts`
- [ ] `src/pages/ConsultarManual.tsx` criado
- [ ] Rota `/manual` adicionada em `src/App.tsx`
- [ ] Item "Consultar Manual" adicionado nos dois arrays de nav em `Sidebar.tsx`
- [ ] `npm run build` — zero erros
- [ ] `npx supabase functions deploy chat-manual`
- [ ] Commit + push + vercel deploy
- [ ] Chave `GEMINI_API_KEY` configurada no Supabase Dashboard
- [ ] Manual enviado via scripts
- [ ] Teste final no sistema ✅
