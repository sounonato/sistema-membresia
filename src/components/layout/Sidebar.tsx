import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, BookOpen, UserCheck,
  GraduationCap, LogOut, Church, KeyRound, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar } from '@/components/ui/avatar'

const NAV_LIDER = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/convertidos', icon: Users, label: 'Convertidos' },
  { to: '/discipulado', icon: BookOpen, label: 'Discipulado' },
  { to: '/discipuladores', icon: UserCheck, label: 'Discipuladores' },
  { to: '/modulos', icon: GraduationCap, label: 'Módulos' },
]

const NAV_DISCIPULADOR = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/discipulado', icon: BookOpen, label: 'Meus Grupos' },
]

interface SidebarProps {
  drawerOpen: boolean
  onClose: () => void
}

export function Sidebar({ drawerOpen, onClose }: SidebarProps) {
  const { profile, signOut, isLiderOrPastor, canEdit } = useAuth()
  const nav = isLiderOrPastor ? NAV_LIDER : NAV_DISCIPULADOR

  return (
    <aside className={cn(
      'flex flex-col w-64 bg-stone-50 border-r border-stone-200 min-h-screen',
      // Desktop: sempre fixo e visível
      'lg:fixed lg:left-0 lg:top-0 lg:bottom-0 lg:flex lg:z-30',
      // Mobile: só renderiza quando drawerOpen
      drawerOpen ? 'flex' : 'hidden lg:flex',
    )}>
      {/* Logo + botão fechar no mobile */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-stone-200">
        <div className="w-9 h-9 bg-amber-700 rounded-xl flex items-center justify-center">
          <Church size={18} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-serif font-bold text-stone-900">A Jornada do</p>
          <p className="text-xs font-semibold text-amber-700">Discípulo</p>
        </div>
        {/* Botão fechar — só mobile */}
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-stone-400 hover:bg-stone-100 transition-colors"
          aria-label="Fechar menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-amber-50 text-amber-800 font-semibold border-l-2 border-amber-600 rounded-r-xl pl-2.5'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 rounded-xl',
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
        {canEdit && (
          <NavLink
            to="/usuarios"
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-amber-50 text-amber-800 font-semibold border-l-2 border-amber-600 rounded-r-xl pl-2.5'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 rounded-xl',
              )
            }
          >
            <KeyRound size={18} />
            Usuários
          </NavLink>
        )}
      </nav>

      {/* User */}
      {profile && (
        <div className="p-4 border-t border-stone-200">
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar name={profile.nome} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-900 truncate">{profile.nome}</p>
              <p className="text-xs text-stone-400 capitalize">{profile.perfil}</p>
            </div>
            <button
              onClick={signOut}
              className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Sair"
              aria-label="Sair"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
