import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const { login, profile, user, loading } = useAuth()
  const navigate = useNavigate()

  // Redirect when profile is loaded after login
  useEffect(() => {
    if (isLoggingIn && !loading && user && profile) {
      setIsLoggingIn(false)
      // Redirect based on role
      if (profile.role === 'superadmin') {
        navigate('/superadmin')
      } else if (profile.role === 'admin') {
        navigate('/admin')
      } else if (profile.role === 'resident') {
        navigate('/resident')
      } else {
        // pending or unknown role - go to pending page
        navigate('/pending')
      }
    }
  }, [isLoggingIn, loading, user, profile, navigate])

  // If already logged in with profile, redirect immediately
  useEffect(() => {
    if (!loading && user && profile && !isLoggingIn) {
      if (profile.role === 'superadmin') navigate('/superadmin')
      else if (profile.role === 'admin') navigate('/admin')
      else if (profile.role === 'resident') navigate('/resident')
      else navigate('/pending')
    }
  }, [loading, user, profile, navigate, isLoggingIn])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setIsLoggingIn(true)
    try {
      await login(email, password)
      // The useEffect above will handle redirect when profile loads
    } catch (err) {
      setIsLoggingIn(false)
      setError(err.message)
    }
  }

  if (loading) return <div style={{padding:20}}>Cargando...</div>

  return (
    <div style={{padding:20,maxWidth:400,margin:'40px auto'}}>
      <h2>Iniciar sesión</h2>
      <form onSubmit={handleSubmit} style={{display:'grid',gap:12}}>
        <input 
          placeholder="Email" 
          type="email"
          value={email} 
          onChange={e=>setEmail(e.target.value)} 
          disabled={isLoggingIn}
          style={{padding:10,fontSize:16}}
        />
        <input 
          placeholder="Contraseña" 
          type="password" 
          value={password} 
          onChange={e=>setPassword(e.target.value)} 
          disabled={isLoggingIn}
          style={{padding:10,fontSize:16}}
        />
        <button type="submit" disabled={isLoggingIn} style={{padding:12,fontSize:16}}>
          {isLoggingIn ? 'Entrando...' : 'Entrar'}
        </button>
        {error && <div style={{color:'red',padding:8,background:'#fee',borderRadius:4}}>{error}</div>}
      </form>
      <p style={{marginTop:16,textAlign:'center'}}>
        ¿No tienes cuenta? <Link to="/register">Registrarse</Link>
      </p>
    </div>
  )
}
