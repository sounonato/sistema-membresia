import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, BookOpen, UserCheck,
  GraduationCap, LogOut, Church,
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

export function Sidebar() {
  const { profile, signOut, isLider } = useAuth()
  const nav = isLider ? NAV_LIDER : NAV_DISCIPULADOR

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 min-h-screen fixed left-0 top-0 bottom-0 z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
          <Church size={18} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">Membresia</p>
          <p className="text-xs text-gray-400">Sistema da Igreja</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      {profile && (
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar name={profile.nome} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{profile.nome}</p>
              <p className="text-xs text-gray-400 capitalize">{profile.perfil}</p>
            </div>
            <button
              onClick={signOut}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
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
