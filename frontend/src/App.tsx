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
      {isAuthenticated && !isAuthPage && <CommandPalette />}
      <PaletteSelector />
      <div className="app-layout">
        {isAuthenticated && !isAuthPage && <Sidebar />}
        <div className={`main-content ${isAuthPage ? 'auth-main' : ''}`}>
          <Routes>
            {/* Public */}
            <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
            <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />

            {/* Protected */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
            <Route path="/documents" element={<ProtectedRoute><DocumentsPage /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
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
