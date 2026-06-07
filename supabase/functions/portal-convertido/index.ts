import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const { email } = await req.json()

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return new Response(JSON.stringify({ error: 'E-mail inválido' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Buscar convertido pelo email
  const { data: convertido } = await supabase
    .from('novos_convertidos')
    .select('id, nome, data_conversao')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle()

  if (!convertido) {
    return new Response(JSON.stringify({ error: 'Nenhum registro encontrado com esse e-mail.' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Buscar grupos do convertido
  const { data: membros } = await supabase
    .from('grupo_membros')
    .select(`
      grupo:grupos_discipulado(
        id, nome,
        discipulador:discipuladores(nome, telefone),
        modulo:modulos_discipulado(nome, total_aulas),
        progresso:progresso_aulas(id, aula_numero, titulo, status, data_realizada)
      )
    `)
    .eq('convertido_id', convertido.id)

  const grupos = (membros ?? [])
    .map((m: any) => m.grupo)
    .filter(Boolean)
    .map((g: any) => ({
      ...g,
      progresso: (g.progresso ?? []).sort((a: any, b: any) => a.aula_numero - b.aula_numero),
    }))

  return new Response(JSON.stringify({ convertido, grupos }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
