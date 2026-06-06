import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Verificar token e perfil
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('perfil').eq('id', user.id).single()

  const allowedPerfis = ['admin', 'pastor', 'lider']
  if (!profile || !allowedPerfis.includes(profile.perfil)) {
    return new Response('Forbidden', { status: 403, headers: corsHeaders })
  }

  // Criar convertido
  const body = await req.json()
  const { data, error } = await supabaseAdmin
    .from('novos_convertidos')
    .insert({ ...body, criado_por: user.id })
    .select()
    .single()

  if (error) return new Response(JSON.stringify({ error: error.message }), {
    status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})
