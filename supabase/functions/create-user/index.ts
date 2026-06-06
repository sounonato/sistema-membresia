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

  // Verificar que quem chama é admin/pastor/lider
  const token = authHeader.replace('Bearer ', '')
  const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !caller) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

  const { data: callerProfile } = await supabaseAdmin
    .from('profiles').select('perfil').eq('id', caller.id).single()

  if (!callerProfile || !['admin', 'pastor', 'lider'].includes(callerProfile.perfil)) {
    return new Response('Forbidden', { status: 403, headers: corsHeaders })
  }

  const { email, password, nome, perfil, discipulador_id } = await req.json()

  // Validações básicas
  if (!email || !password || !nome || !perfil) {
    return new Response(JSON.stringify({ error: 'Campos obrigatórios: email, password, nome, perfil' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
  if (password.length < 6) {
    return new Response(JSON.stringify({ error: 'Senha deve ter pelo menos 6 caracteres' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Criar usuário no Supabase Auth
  const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // já confirma o email automaticamente
    user_metadata: { nome, perfil },
  })

  if (createError) {
    return new Response(JSON.stringify({ error: createError.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Criar profile manualmente (trigger pode não rodar imediatamente)
  await supabaseAdmin.from('profiles').upsert({
    id: newUser.user!.id,
    nome,
    perfil,
    email,
  })

  // Se informou discipulador_id, vincular usuario_id ao discipulador
  if (discipulador_id) {
    await supabaseAdmin
      .from('discipuladores')
      .update({ usuario_id: newUser.user!.id })
      .eq('id', discipulador_id)
  }

  return new Response(JSON.stringify({ success: true, user_id: newUser.user!.id }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})
