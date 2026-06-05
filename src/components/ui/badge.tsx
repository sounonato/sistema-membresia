import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'

const variants: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
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
