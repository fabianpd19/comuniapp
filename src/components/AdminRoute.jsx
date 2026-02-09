import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Loader from './Loader'

export default function AdminRoute({ children }) {
  const { profile, loading } = useAuth()
  if (loading) return <Loader />
  if (!profile || profile.role !== 'admin') return <Navigate to="/login" replace />
  return children
}
