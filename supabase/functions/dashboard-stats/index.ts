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

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [total, mes, discipulado, grupos] = await Promise.all([
    supabaseAdmin.from('novos_convertidos').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('novos_convertidos').select('id', { count: 'exact', head: true }).gte('criado_em', firstDayOfMonth),
    supabaseAdmin.from('novos_convertidos').select('id', { count: 'exact', head: true }).eq('status', 'em_discipulado'),
    supabaseAdmin.from('grupos_discipulado').select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
  ])

  return new Response(JSON.stringify({
    total: total.count ?? 0,
    mes: mes.count ?? 0,
    em_discipulado: discipulado.count ?? 0,
    grupos: grupos.count ?? 0,
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
