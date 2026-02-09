import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ResidentRoute({ children }) {
  const { profile, loading } = useAuth()
  if (loading) return <div>Loading...</div>
  if (!profile || profile.role !== 'resident') return <Navigate to="/login" replace />
  return children
}
