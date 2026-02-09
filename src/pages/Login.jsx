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

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{color:'white',fontSize:18,textAlign:'center'}}>
          <div className="pulse" style={{fontSize:48,marginBottom:16}}>🏘️</div>
          <p>Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: 20
    }}>
      <div className="card fade-in" style={{
        maxWidth: 440,
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{fontSize:64,marginBottom:16}}>🏘️</div>
          <h2 style={{margin:0,color:'#2c3e50',fontSize:28}}>Bienvenido a ComuniApp</h2>
          <p style={{color:'#666',margin:'8px 0 0 0'}}>Gestión inteligente de tu comunidad</p>
        </div>
        
        <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:20}}>
          <div>
            <label style={{display:'block',marginBottom:8,color:'#2c3e50',fontWeight:600,fontSize:14}}>📧 Correo electrónico</label>
            <input 
              placeholder="tu@email.com" 
              type="email"
              value={email} 
              onChange={e=>setEmail(e.target.value)} 
              disabled={isLoggingIn}
            />
          </div>
          
          <div>
            <label style={{display:'block',marginBottom:8,color:'#2c3e50',fontWeight:600,fontSize:14}}>🔒 Contraseña</label>
            <input 
              placeholder="••••••••" 
              type="password" 
              value={password} 
              onChange={e=>setPassword(e.target.value)} 
              disabled={isLoggingIn}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isLoggingIn} 
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '14px',
              marginTop: 8,
              fontSize: 16,
              fontWeight: 600
            }}
          >
            {isLoggingIn ? '⏳ Entrando...' : '🚀 Iniciar sesión'}
          </button>
          
          {error && (
            <div style={{
              color:'#e74c3c',
              padding:12,
              background:'#fee',
              borderRadius:8,
              border:'1px solid #e74c3c',
              fontSize:14
            }}>
              ⚠️ {error}
            </div>
          )}
        </form>
        
        <div style={{
          marginTop:24,
          paddingTop:24,
          borderTop:'1px solid #e1e8ed',
          textAlign:'center'
        }}>
          <p style={{color:'#666',margin:0}}>
            ¿No tienes cuenta? <Link to="/register" style={{color:'#667eea',fontWeight:600,textDecoration:'none'}}>Regístrate aquí</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
