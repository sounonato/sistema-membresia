import { type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-stone-200 shadow-[0_1px_4px_rgba(28,25,23,0.06)] transition-shadow duration-200 hover:shadow-[0_4px_16px_rgba(28,25,23,0.10)]',
        className
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5 border-b border-stone-100', className)} {...props} />
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5', className)} {...props} />
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-base font-semibold text-stone-900 font-serif', className)} {...props}>
      {children}
    </h3>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  icon: ReactNode
  sub?: string
}

export function StatCard({ title, value, icon, sub }: StatCardProps) {
  return (
    <Card className="flex items-center gap-4 p-5 hover:shadow-[0_4px_16px_rgba(28,25,23,0.10)]">
      <div className="text-amber-600 flex-shrink-0">{icon}</div>
      <div>
        <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">{title}</p>
        <p className="text-3xl font-bold text-stone-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-stone-400 mt-0.5">{sub}</p>}
      </div>
    </Card>
  )
}
