import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../services/firebase'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [apartment, setApartment] = useState('')
  const [error, setError] = useState(null)
  const [isRegistering, setIsRegistering] = useState(false)
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  // If already logged in, redirect
  useEffect(() => {
    if (!loading && user) {
      navigate('/pending')
    }
  }, [loading, user, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    // Validations
    if (!displayName.trim()) {
      setError('El nombre es requerido')
      return
    }
    if (!email.trim()) {
      setError('El email es requerido')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setIsRegistering(true)
    try {
      // Create Firebase Auth user
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      const uid = cred.user.uid

      // Create user document with 'pending' role (needs admin approval to join a community)
      await setDoc(doc(db, 'users', uid), {
        displayName: displayName.trim(),
        email: email.trim().toLowerCase(),
        role: 'pending', // Will be changed to 'resident' when approved by admin
        apartment: apartment.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      // Redirect to pending page
      navigate('/pending')
    } catch (err) {
      setIsRegistering(false)
      // Translate common Firebase errors
      if (err.code === 'auth/email-already-in-use') {
        setError('Este email ya está registrado')
      } else if (err.code === 'auth/invalid-email') {
        setError('Email inválido')
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña es muy débil')
      } else {
        setError(err.message)
      }
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
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
      background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      padding: 20
    }}>
      <div className="card fade-in" style={{
        maxWidth: 480,
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{fontSize:64,marginBottom:16}}>👥</div>
          <h2 style={{margin:0,color:'#2c3e50',fontSize:28}}>Únete a ComuniApp</h2>
          <p style={{color:'#666',margin:'8px 0 0 0'}}>Crea tu cuenta en segundos</p>
        </div>
        
        <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:18}}>
          <div>
            <label style={{display:'block',marginBottom:8,color:'#2c3e50',fontWeight:600,fontSize:14}}>👤 Nombre completo</label>
            <input 
              placeholder="Juan Pérez" 
              value={displayName} 
              onChange={e=>setDisplayName(e.target.value)} 
              disabled={isRegistering}
            />
          </div>
          
          <div>
            <label style={{display:'block',marginBottom:8,color:'#2c3e50',fontWeight:600,fontSize:14}}>📧 Correo electrónico</label>
            <input 
              placeholder="tu@email.com" 
              type="email"
              value={email} 
              onChange={e=>setEmail(e.target.value)} 
              disabled={isRegistering}
            />
          </div>
          
          <div>
            <label style={{display:'block',marginBottom:8,color:'#2c3e50',fontWeight:600,fontSize:14}}>🏠 Apartamento / Unidad <span style={{color:'#999',fontWeight:400}}>(opcional)</span></label>
            <input 
              placeholder="Apt. 304" 
              value={apartment} 
              onChange={e=>setApartment(e.target.value)} 
              disabled={isRegistering}
            />
          </div>
          
          <div>
            <label style={{display:'block',marginBottom:8,color:'#2c3e50',fontWeight:600,fontSize:14}}>🔒 Contraseña</label>
            <input 
              placeholder="Mínimo 6 caracteres" 
              type="password" 
              value={password} 
              onChange={e=>setPassword(e.target.value)} 
              disabled={isRegistering}
            />
          </div>
          
          <div>
            <label style={{display:'block',marginBottom:8,color:'#2c3e50',fontWeight:600,fontSize:14}}>🔒 Confirmar contraseña</label>
            <input 
              placeholder="Repite tu contraseña" 
              type="password" 
              value={confirmPassword} 
              onChange={e=>setConfirmPassword(e.target.value)} 
              disabled={isRegistering}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isRegistering} 
            style={{
              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              color: 'white',
              padding: '14px',
              marginTop: 8,
              fontSize: 16,
              fontWeight: 600
            }}
          >
            {isRegistering ? '⏳ Registrando...' : '🚀 Crear cuenta'}
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
          <p style={{color:'#666',margin:'0 0 12px 0'}}>
            ¿Ya tienes cuenta? <Link to="/login" style={{color:'#11998e',fontWeight:600,textDecoration:'none'}}>Inicia sesión aquí</Link>
          </p>
          <p style={{fontSize:12,color:'#999',margin:0}}>
            Tu cuenta quedará pendiente de aprobación por un administrador
          </p>
        </div>
      </div>
    </div>
  )
}
