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
