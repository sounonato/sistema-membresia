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

export async function createUser(data: {
  email: string
  password: string
  nome: string
  perfil: string
  discipulador_id?: string
}) {
  const headers = await authHeaders()
  const res = await fetch(`${FUNCTIONS_URL}/create-user`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'Erro ao criar usuário')
  }
  return res.json()
}
