import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | null | undefined, pattern = 'dd/MM/yyyy') {
  if (!date) return '—'
  try {
    return format(parseISO(date), pattern, { locale: ptBR })
  } catch {
    return '—'
  }
}

export function formatRelative(date: string | null | undefined) {
  if (!date) return '—'
  try {
    return formatDistanceToNow(parseISO(date), { addSuffix: true, locale: ptBR })
  } catch {
    return '—'
  }
}

export function formatPhone(phone: string | null | undefined) {
  if (!phone) return '—'
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return phone
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export const COMO_CONHECEU_LABELS: Record<string, string> = {
  amigo: 'Amigo(a)',
  familiar: 'Familiar',
  redes_sociais: 'Redes Sociais',
  evento: 'Evento',
  culto: 'Culto',
  outro: 'Outro',
}

export const ESTADO_CIVIL_LABELS: Record<string, string> = {
  solteiro: 'Solteiro(a)',
  casado: 'Casado(a)',
  divorciado: 'Divorciado(a)',
  viuvo: 'Viúvo(a)',
  uniao_estavel: 'União Estável',
}

export const STATUS_CONVERTIDO_LABELS: Record<string, string> = {
  ativo: 'Ativo',
  em_discipulado: 'Em Discipulado',
  encerrado: 'Encerrado',
  inativo: 'Inativo',
}

export const STATUS_GRUPO_LABELS: Record<string, string> = {
  ativo: 'Ativo',
  encerrado: 'Encerrado',
  pausado: 'Pausado',
}
