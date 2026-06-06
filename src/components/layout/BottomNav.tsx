import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, BookOpen, UserCheck, GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

const NAV_LIDER = [
  { to: '/', icon: LayoutDashboard, label: 'Início' },
  { to: '/convertidos', icon: Users, label: 'Convertidos' },
  { to: '/discipulado', icon: BookOpen, label: 'Discipulado' },
  { to: '/discipuladores', icon: UserCheck, label: 'Discipuladores' },
  { to: '/modulos', icon: GraduationCap, label: 'Módulos' },
]

const NAV_DISCIPULADOR = [
  { to: '/', icon: LayoutDashboard, label: 'Início' },
  { to: '/discipulado', icon: BookOpen, label: 'Meus Grupos' },
]

export function BottomNav() {
  const { isLider } = useAuth()
  const nav = isLider ? NAV_LIDER : NAV_DISCIPULADOR
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 z-30 safe-area-pb">
      <div className="flex">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors min-w-0',
                isActive ? 'text-amber-700' : 'text-stone-400',
              )
            }
          >
            <Icon size={20} className="flex-shrink-0" />
            <span className="truncate w-full text-center px-0.5">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
