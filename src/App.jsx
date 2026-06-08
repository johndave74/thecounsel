import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Toasts from './components/Toasts'
import { useStore } from './store'

import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'

import Dashboard from './pages/Dashboard'
import Cases from './pages/Cases'
import CaseDetail from './pages/CaseDetail'
import Clients from './pages/Clients'
import Hearings from './pages/Hearings'
import Documents from './pages/Documents'
import Tasks from './pages/Tasks'
import Staff from './pages/Staff'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'

// Protected app shell — waits for the session check, then redirects to /login
// when not authenticated, otherwise renders inside the shared Layout.
function Shell({ children }) {
  const { authReady, currentUser } = useStore()
  if (!authReady) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', color: 'var(--ink-soft, #6b6256)', fontSize: 15 }}>
        Loading your workspace…
      </div>
    )
  }
  if (!currentUser) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

export default function App() {
  return (
    <>
    <Toasts />
    <Routes>
      {/* Auth (no backend — UI only) */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Application */}
      <Route path="/app" element={<Shell><Dashboard /></Shell>} />
      <Route path="/app/cases" element={<Shell><Cases /></Shell>} />
      <Route path="/app/cases/:id" element={<Shell><CaseDetail /></Shell>} />
      <Route path="/app/clients" element={<Shell><Clients /></Shell>} />
      <Route path="/app/hearings" element={<Shell><Hearings /></Shell>} />
      <Route path="/app/documents" element={<Shell><Documents /></Shell>} />
      <Route path="/app/tasks" element={<Shell><Tasks /></Shell>} />
      <Route path="/app/staff" element={<Shell><Staff /></Shell>} />
      <Route path="/app/notifications" element={<Shell><Notifications /></Shell>} />
      <Route path="/app/settings" element={<Shell><Settings /></Shell>} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
    </>
  )
}
