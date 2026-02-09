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

  if (loading) return <div style={{padding:20}}>Cargando...</div>

  return (
    <div style={{padding:20,maxWidth:400,margin:'40px auto'}}>
      <h2>Crear cuenta</h2>
      <form onSubmit={handleSubmit} style={{display:'grid',gap:12}}>
        <input 
          placeholder="Nombre completo *" 
          value={displayName} 
          onChange={e=>setDisplayName(e.target.value)} 
          disabled={isRegistering}
          style={{padding:10,fontSize:16}}
        />
        <input 
          placeholder="Email *" 
          type="email"
          value={email} 
          onChange={e=>setEmail(e.target.value)} 
          disabled={isRegistering}
          style={{padding:10,fontSize:16}}
        />
        <input 
          placeholder="Apartamento / Unidad (opcional)" 
          value={apartment} 
          onChange={e=>setApartment(e.target.value)} 
          disabled={isRegistering}
          style={{padding:10,fontSize:16}}
        />
        <input 
          placeholder="Contraseña *" 
          type="password" 
          value={password} 
          onChange={e=>setPassword(e.target.value)} 
          disabled={isRegistering}
          style={{padding:10,fontSize:16}}
        />
        <input 
          placeholder="Confirmar contraseña *" 
          type="password" 
          value={confirmPassword} 
          onChange={e=>setConfirmPassword(e.target.value)} 
          disabled={isRegistering}
          style={{padding:10,fontSize:16}}
        />
        <button type="submit" disabled={isRegistering} style={{padding:12,fontSize:16}}>
          {isRegistering ? 'Registrando...' : 'Registrarse'}
        </button>
        {error && <div style={{color:'red',padding:8,background:'#fee',borderRadius:4}}>{error}</div>}
      </form>
      <p style={{marginTop:16,textAlign:'center'}}>
        ¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link>
      </p>
      <p style={{marginTop:12,fontSize:12,color:'#666',textAlign:'center'}}>
        Al registrarte, tu cuenta quedará pendiente de aprobación por un administrador de comunidad.
      </p>
    </div>
  )
}
