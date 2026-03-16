import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import NewTransaction from './pages/NewTransaction'
import AdminPanel from './pages/AdminPanel'
import AuditLogs from './pages/AuditLogs'
import Profile from './pages/Profile'
import Loader from './components/Loader'

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth()
  if (loading) return <Loader />
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loader />
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard"       element={<Dashboard />} />
        <Route path="/transactions"    element={<Transactions />} />
        <Route path="/transactions/new" element={<NewTransaction />} />
        <Route path="/audit"           element={<AuditLogs />} />
        <Route path="/profile"         element={<Profile />} />
        <Route path="/admin"           element={<ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
