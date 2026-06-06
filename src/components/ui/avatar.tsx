import { cn, getInitials } from '@/lib/utils'

interface AvatarProps {
  name: string
  src?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-11 h-11 text-base',
  xl: 'w-14 h-14 text-lg',
}

const colors = [
  'bg-amber-600', 'bg-stone-600', 'bg-amber-700',
  'bg-stone-700', 'bg-amber-500', 'bg-stone-500',
  'bg-amber-800', 'bg-stone-800',
]

function getColor(name: string) {
  const idx = name.charCodeAt(0) % colors.length
  return colors[idx]
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-2xl object-cover flex-shrink-0', sizes[size], className)}
      />
    )
  }
  return (
    <div
      className={cn(
        'rounded-2xl flex items-center justify-center text-white font-semibold flex-shrink-0',
        sizes[size],
        getColor(name),
        className,
      )}
    >
      {getInitials(name)}
    </div>
  )
}
