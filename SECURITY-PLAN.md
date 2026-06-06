# Plano de Segurança — A Jornada do Discípulo

**Objetivo:** Mover autenticação e operações sensíveis do frontend para o backend (Supabase Edge Functions).
**Executor:** Gemini / Antigravity IDE
**Stack backend:** Supabase Edge Functions (Deno/TypeScript)

---

## Arquitetura atual (problema)

```
Frontend (React) → Supabase JS Client (anon key) → Banco
```
- Lógica de negócio no frontend
- Chave anon exposta no bundle
- Sem validação server-side de permissões além do RLS

## Arquitetura nova (segura)

```
Frontend (React) → Edge Functions (JWT verificado) → Supabase Admin (service role) → Banco
```
- Frontend só envia requests + token JWT
- Edge Functions validam token e executam com service role
- Anon key usada apenas para auth inicial e formulário público

---

## Fase 1 — Supabase Edge Functions

Criar as seguintes Edge Functions em `supabase/functions/`:

### 1. `verify-session/index.ts`
Valida o JWT do usuário e retorna o perfil.
```ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401 })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) return new Response('Unauthorized', { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return new Response(JSON.stringify({ user, profile }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

### 2. `create-convertido/index.ts`
Apenas líderes podem criar convertidos. Valida perfil no backend.
```ts
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
```

### 3. `public-form/index.ts`
Recebe o formulário público com rate limiting básico.
```ts
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
```

### 4. `dashboard-stats/index.ts`
Agrega KPIs no backend, não no frontend.
```ts
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
```

---

## Fase 2 — RLS Hardening (SQL)

Criar `database/migration_003_rls.sql`:

```sql
-- Garantir RLS ativo em todas as tabelas
ALTER TABLE novos_convertidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE discipuladores ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupos_discipulado ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupo_membros ENABLE ROW LEVEL SECURITY;
ALTER TABLE progresso_aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE modulos_discipulado ENABLE ROW LEVEL SECURITY;
ALTER TABLE acompanhamentos ENABLE ROW LEVEL SECURITY;

-- Helper function para verificar perfil
CREATE OR REPLACE FUNCTION get_user_perfil()
RETURNS TEXT AS $$
  SELECT perfil FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: é líder?
CREATE OR REPLACE FUNCTION is_lider()
RETURNS BOOLEAN AS $$
  SELECT get_user_perfil() IN ('admin', 'pastor', 'lider')
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- novos_convertidos
DROP POLICY IF EXISTS "lider_all_convertidos" ON novos_convertidos;
DROP POLICY IF EXISTS "public_insert_convertidos" ON novos_convertidos;
DROP POLICY IF EXISTS "auth_read_convertidos" ON novos_convertidos;

CREATE POLICY "lider_all_convertidos" ON novos_convertidos
  FOR ALL TO authenticated
  USING (is_lider())
  WITH CHECK (is_lider());

CREATE POLICY "auth_read_convertidos" ON novos_convertidos
  FOR SELECT TO authenticated
  USING (true); -- todos autenticados podem ler (discipulador vê membros do seu grupo via join)

CREATE POLICY "public_insert_convertidos" ON novos_convertidos
  FOR INSERT TO anon
  WITH CHECK (true); -- formulário público

-- grupos_discipulado
DROP POLICY IF EXISTS "lider_all_grupos" ON grupos_discipulado;
DROP POLICY IF EXISTS "disc_read_own_grupos" ON grupos_discipulado;

CREATE POLICY "lider_all_grupos" ON grupos_discipulado
  FOR ALL TO authenticated
  USING (is_lider())
  WITH CHECK (is_lider());

CREATE POLICY "disc_read_own_grupos" ON grupos_discipulado
  FOR SELECT TO authenticated
  USING (
    discipulador_id IN (
      SELECT id FROM discipuladores WHERE usuario_id = auth.uid()
    )
  );

-- progresso_aulas
DROP POLICY IF EXISTS "disc_update_progresso" ON progresso_aulas;
DROP POLICY IF EXISTS "lider_all_progresso" ON progresso_aulas;

CREATE POLICY "lider_all_progresso" ON progresso_aulas
  FOR ALL TO authenticated USING (is_lider()) WITH CHECK (is_lider());

CREATE POLICY "disc_read_update_progresso" ON progresso_aulas
  FOR ALL TO authenticated
  USING (
    grupo_id IN (
      SELECT gd.id FROM grupos_discipulado gd
      JOIN discipuladores d ON d.id = gd.discipulador_id
      WHERE d.usuario_id = auth.uid()
    )
  );

-- acompanhamentos
DROP POLICY IF EXISTS "disc_own_acomp" ON acompanhamentos;
DROP POLICY IF EXISTS "lider_all_acomp" ON acompanhamentos;

CREATE POLICY "lider_all_acomp" ON acompanhamentos
  FOR ALL TO authenticated USING (is_lider()) WITH CHECK (is_lider());

CREATE POLICY "disc_own_acomp" ON acompanhamentos
  FOR ALL TO authenticated
  USING (
    discipulador_id IN (
      SELECT id FROM discipuladores WHERE usuario_id = auth.uid()
    )
  );
```

---

## Fase 3 — Frontend: usar Edge Functions nas rotas críticas

### `src/lib/api.ts` (criar arquivo)
```ts
import { supabase } from './supabase'

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1'

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    'Authorization': `Bearer ${session?.access_token ?? ''}`,
    'Content-Type': 'application/json',
  }
}

export async function getDashboardStats() {
  const headers = await authHeaders()
  const res = await fetch(`${FUNCTIONS_URL}/dashboard-stats`, { headers })
  if (!res.ok) throw new Error('Erro ao buscar stats')
  return res.json()
}

export async function createConvertido(data: Record<string, unknown>) {
  const headers = await authHeaders()
  const res = await fetch(`${FUNCTIONS_URL}/create-convertido`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'Erro ao criar convertido')
  }
  return res.json()
}

export async function submitFormularioPublico(data: Record<string, unknown>) {
  const FUNCTIONS_URL_BASE = import.meta.env.VITE_SUPABASE_URL + '/functions/v1'
  const res = await fetch(`${FUNCTIONS_URL_BASE}/public-form`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'Erro ao enviar')
  }
  return res.json()
}
```

### `src/pages/DashboardLider.tsx` — usar `getDashboardStats()`
Substituir a função `fetchStats()` por:
```ts
import { getDashboardStats } from '@/lib/api'
// ...
const { data: stats, isLoading: statsLoading } = useQuery({
  queryKey: ['stats'],
  queryFn: getDashboardStats,
})
```

### `src/pages/NovoConvertido.tsx` — usar `createConvertido()`
Substituir o `supabase.from('novos_convertidos').insert(...)` por:
```ts
import { createConvertido } from '@/lib/api'
// ...
await createConvertido({ ...data, data_conversao: ..., status: 'ativo' })
```

### `src/pages/FormularioPublico.tsx` — usar `submitFormularioPublico()`
Substituir o `supabase.from('novos_convertidos').insert(...)` por:
```ts
import { submitFormularioPublico } from '@/lib/api'
// ...
await submitFormularioPublico({ ...data, data_conversao: ..., status: 'ativo' })
```

---

## Checklist de execução

### Edge Functions (criar em `supabase/functions/`)
- [ ] `supabase/functions/verify-session/index.ts`
- [ ] `supabase/functions/create-convertido/index.ts`
- [ ] `supabase/functions/public-form/index.ts`
- [ ] `supabase/functions/dashboard-stats/index.ts`

### SQL
- [ ] Criar `database/migration_003_rls.sql` com o conteúdo acima
- [ ] Instruir Anderson para rodar no Supabase SQL Editor

### Frontend
- [ ] Criar `src/lib/api.ts`
- [ ] Atualizar `DashboardLider.tsx` para usar `getDashboardStats()`
- [ ] Atualizar `NovoConvertido.tsx` para usar `createConvertido()`
- [ ] Atualizar `FormularioPublico.tsx` para usar `submitFormularioPublico()`

### Deploy das Edge Functions
```bash
cd "/Users/andersonnonato/Documents/CLAUDE CODE/sistema-membresia"
npx supabase functions deploy verify-session
npx supabase functions deploy create-convertido
npx supabase functions deploy public-form
npx supabase functions deploy dashboard-stats
```

### Build e deploy frontend
```bash
npm run build
git add -A
git commit -m "feat(security): Edge Functions para auth e operações sensíveis no backend"
git push origin main
vercel --prod --yes
```
