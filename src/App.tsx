import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { AppShell } from '@/components/layout/AppShell'
import Login from '@/pages/Login'
import FormularioPublico from '@/pages/FormularioPublico'
import Dashboard from '@/pages/Dashboard'
import Convertidos from '@/pages/Convertidos'
import NovoConvertido from '@/pages/NovoConvertido'
import ConvertidoDetalhe from '@/pages/ConvertidoDetalhe'
import EditarConvertido from '@/pages/EditarConvertido'
import Discipulado from '@/pages/Discipulado'
import GrupoDetalhe from '@/pages/GrupoDetalhe'
import Discipuladores from '@/pages/Discipuladores'
import Modulos from '@/pages/Modulos'
import GerenciarUsuarios from '@/pages/GerenciarUsuarios'
import PortalConvertido from '@/pages/PortalConvertido'
import ConsultarManual from '@/pages/ConsultarManual'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60, retry: 1 },
  },
})

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  return <AppShell>{children}</AppShell>
}

function LiderRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isLider } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (!isLider) return <Navigate to="/" replace />
  return <AppShell>{children}</AppShell>
}

function LiderOrPastorRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isLiderOrPastor } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (!isLiderOrPastor) return <Navigate to="/" replace />
  return <AppShell>{children}</AppShell>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/formulario" element={<FormularioPublico />} />
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/convertidos" element={<LiderOrPastorRoute><Convertidos /></LiderOrPastorRoute>} />
            <Route path="/convertidos/novo" element={<LiderRoute><NovoConvertido /></LiderRoute>} />
            <Route path="/convertidos/:id" element={<LiderOrPastorRoute><ConvertidoDetalhe /></LiderOrPastorRoute>} />
            <Route path="/convertidos/:id/editar" element={<LiderRoute><EditarConvertido /></LiderRoute>} />
            <Route path="/discipulado" element={<PrivateRoute><Discipulado /></PrivateRoute>} />
            <Route path="/discipulado/:id" element={<PrivateRoute><GrupoDetalhe /></PrivateRoute>} />
            <Route path="/discipuladores" element={<LiderOrPastorRoute><Discipuladores /></LiderOrPastorRoute>} />
            <Route path="/modulos" element={<LiderOrPastorRoute><Modulos /></LiderOrPastorRoute>} />
            <Route path="/usuarios" element={<LiderRoute><GerenciarUsuarios /></LiderRoute>} />
            <Route path="/manual" element={<PrivateRoute><ConsultarManual /></PrivateRoute>} />
            <Route path="/portal" element={<PortalConvertido />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
