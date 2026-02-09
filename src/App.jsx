import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import PendingPage from './pages/PendingPage'
import AdminDashboard from './pages/AdminDashboard'
import ResidentDashboard from './pages/ResidentDashboard'
import SuperAdminDashboard from './pages/SuperAdminDashboard'
import PostsPage from './pages/PostsPage'
import CommunityPage from './pages/CommunityPage'
import AlertsPage from './pages/AlertsPage'
import SurveysPage from './pages/SurveysPage'
import ChatPage from './pages/ChatPage'
import PlanesPage from './pages/PlanesPage'
import { useAuth } from './context/AuthContext'
import AdminRoute from './components/AdminRoute'
import ResidentRoute from './components/ResidentRoute'
import SuperAdminRoute from './components/SuperAdminRoute'
import EmergencyButton from './components/EmergencyButton'
import EmergencyBanner from './components/EmergencyBanner'
import Loader from './components/Loader'
import Navbar from './components/Navbar'

export default function App() {
  const { loading, profile } = useAuth()
  if (loading) return <Loader />

  // Mostrar botón y banner solo para usuarios autenticados con comunidad
  const showEmergencyFeatures = profile && profile.role !== 'pending' && profile.role !== 'superadmin'

  return (
    <>
      {/* Navbar - mostrar solo si el usuario está autenticado */}
      {profile && <Navbar />}
      
      {/* Banner de emergencia global */}
      {showEmergencyFeatures && <EmergencyBanner />}
      
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pending" element={<PendingPage />} />

        {/* SuperAdmin routes */}
        <Route path="/superadmin" element={<SuperAdminRoute><SuperAdminDashboard/></SuperAdminRoute>} />

        {/* Admin routes */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard/></AdminRoute>} />
        <Route path="/admin/community" element={<AdminRoute><CommunityPage/></AdminRoute>} />
        <Route path="/admin/posts" element={<AdminRoute><PostsPage/></AdminRoute>} />
        <Route path="/admin/alerts" element={<AdminRoute><AlertsPage/></AdminRoute>} />
        <Route path="/admin/surveys" element={<AdminRoute><SurveysPage/></AdminRoute>} />
        <Route path="/admin/chat" element={<AdminRoute><ChatPage/></AdminRoute>} />

        {/* Resident routes */}
        <Route path="/resident" element={<ResidentRoute><ResidentDashboard/></ResidentRoute>} />
        <Route path="/resident/community" element={<ResidentRoute><CommunityPage/></ResidentRoute>} />
        <Route path="/resident/posts" element={<ResidentRoute><PostsPage/></ResidentRoute>} />
        <Route path="/resident/alerts" element={<ResidentRoute><AlertsPage/></ResidentRoute>} />
        <Route path="/resident/surveys" element={<ResidentRoute><SurveysPage/></ResidentRoute>} />
        <Route path="/resident/chat" element={<ResidentRoute><ChatPage/></ResidentRoute>} />

        {/* Planes - accesible para todos los autenticados */}
        <Route path="/planes" element={<PlanesPage />} />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>

      {/* Botón de emergencia flotante */}
      {showEmergencyFeatures && <EmergencyButton />}
    </>
  )
}
