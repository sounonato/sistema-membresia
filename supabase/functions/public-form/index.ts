import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Rate limit simples por IP (in-memory, reinicia a cada cold start)
const ipCounts = new Map<string, { count: number; resetAt: number }>()

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  // Rate limiting: máx 3 envios por IP por hora
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const now = Date.now()
  const entry = ipCounts.get(ip)
  if (entry && entry.resetAt > now && entry.count >= 3) {
    return new Response(JSON.stringify({ error: 'Muitas tentativas. Aguarde e tente novamente.' }), {
      status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
  if (!entry || entry.resetAt <= now) {
    ipCounts.set(ip, { count: 1, resetAt: now + 3600000 })
  } else {
    entry.count++
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const body = await req.json()

  // Validação mínima server-side
  if (!body.nome || body.nome.length < 2) {
    return new Response(JSON.stringify({ error: 'Nome inválido' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
  if (!body.telefone || body.telefone.length < 10) {
    return new Response(JSON.stringify({ error: 'Telefone inválido' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const { error } = await supabaseAdmin
    .from('novos_convertidos')
    .insert({ ...body, status: 'ativo', criado_por: null })

  if (error) return new Response(JSON.stringify({ error: 'Erro ao registrar' }), {
    status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})
