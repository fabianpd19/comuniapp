import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function SuperAdminRoute({ children }) {
  const { profile, loading } = useAuth()
  if (loading) return <div style={{padding:20}}>Cargando...</div>
  if (!profile || profile.role !== 'superadmin') return <Navigate to="/login" replace />
  return children
}
