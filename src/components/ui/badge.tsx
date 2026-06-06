import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'

const variants: Record<BadgeVariant, string> = {
  default: 'bg-stone-100 text-stone-700 border border-stone-200',
  success: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
  warning: 'bg-amber-50 text-amber-800 border border-amber-200',
  danger: 'bg-red-50 text-red-700 border border-red-200',
  info: 'bg-blue-50 text-blue-700 border border-blue-200',
  purple: 'bg-amber-50 text-amber-800 border border-amber-200',
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-xl px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}

export function statusConvertidoBadge(status: string) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    ativo: { variant: 'success', label: 'Ativo' },
    em_discipulado: { variant: 'purple', label: 'Em Discipulado' },
    encerrado: { variant: 'default', label: 'Encerrado' },
    inativo: { variant: 'warning', label: 'Inativo' },
  }
  return map[status] ?? { variant: 'default', label: status }
}

export function statusGrupoBadge(status: string) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    ativo: { variant: 'success', label: 'Ativo' },
    encerrado: { variant: 'default', label: 'Encerrado' },
    pausado: { variant: 'warning', label: 'Pausado' },
  }
  return map[status] ?? { variant: 'default', label: status }
}
