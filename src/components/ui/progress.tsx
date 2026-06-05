import { cn } from '@/lib/utils'

interface ProgressProps {
  value: number
  max?: number
  className?: string
  showLabel?: boolean
  color?: 'primary' | 'green' | 'amber'
}

const colors = {
  primary: 'bg-primary-600',
  green: 'bg-green-500',
  amber: 'bg-amber-500',
}

export function Progress({ value, max = 100, className, showLabel, color = 'primary' }: ProgressProps) {
  const pct = Math.round((value / max) * 100)
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', colors[color])}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-gray-500 w-10 text-right">
          {value}/{max}
        </span>
      )}
    </div>
  )
}
