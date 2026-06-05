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
import Discipulado from '@/pages/Discipulado'
import GrupoDetalhe from '@/pages/GrupoDetalhe'
import Discipuladores from '@/pages/Discipuladores'
import Modulos from '@/pages/Modulos'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60, retry: 1 },
  },
})

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
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
            <Route path="/convertidos" element={<PrivateRoute><Convertidos /></PrivateRoute>} />
            <Route path="/convertidos/novo" element={<PrivateRoute><NovoConvertido /></PrivateRoute>} />
            <Route path="/convertidos/:id" element={<PrivateRoute><ConvertidoDetalhe /></PrivateRoute>} />
            <Route path="/discipulado" element={<PrivateRoute><Discipulado /></PrivateRoute>} />
            <Route path="/discipulado/:id" element={<PrivateRoute><GrupoDetalhe /></PrivateRoute>} />
            <Route path="/discipuladores" element={<PrivateRoute><Discipuladores /></PrivateRoute>} />
            <Route path="/modulos" element={<PrivateRoute><Modulos /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
