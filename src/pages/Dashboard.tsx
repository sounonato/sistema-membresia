import { useAuth } from '@/contexts/AuthContext'
import DashboardLider from './DashboardLider'
import DashboardDiscipulador from './DashboardDiscipulador'

export default function Dashboard() {
  const { isDiscipulador } = useAuth()
  return isDiscipulador ? <DashboardDiscipulador /> : <DashboardLider />
}
