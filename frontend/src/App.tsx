import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import Sidebar from './components/Sidebar'
import ProtectedRoute from './components/ProtectedRoute'
import CommandPalette from './components/CommandPalette'
import PaletteSelector from './components/PaletteSelector'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ChatPage from './pages/ChatPage'
import UploadPage from './pages/UploadPage'
import Dashboard from './pages/Dashboard'
import SearchPage from './pages/SearchPage'
import DocumentsPage from './pages/DocumentsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import AdminPage from './pages/AdminPage'

function AppLayout() {
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()
  const isAuthPage = ['/login', '/register'].includes(location.pathname)

  return (
    <>
      {!isAuthPage && <CommandPalette />}
      <PaletteSelector />
      <div className="app-layout">
        {/* Sidebar visible for everyone except auth pages */}
        {!isAuthPage && <Sidebar />}
        <div className={`main-content ${isAuthPage ? 'auth-main' : ''}`}>
          <Routes>
            {/* ── Auth pages ── */}
            <Route path="/login"    element={isAuthenticated ? <Navigate to="/chat" replace /> : <LoginPage />} />
            <Route path="/register" element={isAuthenticated ? <Navigate to="/chat" replace /> : <RegisterPage />} />

            {/* ── Public routes (guest OK) ── */}
            <Route path="/"       element={<Navigate to="/chat" replace />} />
            <Route path="/chat"   element={<ChatPage />} />
            <Route path="/search" element={<SearchPage />} />

            {/* ── Protected routes (login required) ── */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/upload"    element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
            <Route path="/documents" element={<ProtectedRoute><DocumentsPage /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
            <Route path="/admin"     element={<ProtectedRoute requireAdmin><AdminPage /></ProtectedRoute>} />
          </Routes>
        </div>
      </div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#13161e',
            color: '#f0f2f7',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '10px',
            fontSize: '14px',
          },
        }}
      />
    </>
  )
}

export default function App() {
  const { hydrate } = useAuthStore()
  useEffect(() => { hydrate() }, [hydrate])

  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}

