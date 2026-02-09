import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { collection, getDocs, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore'
import { db } from '../services/firebase'

export default function PendingPage() {
  const { user, profile, logout, loading } = useAuth()
  const navigate = useNavigate()
  const [communities, setCommunities] = useState([])
  const [selectedCommunity, setSelectedCommunity] = useState('')
  const [requestStatus, setRequestStatus] = useState(null) // null, 'sending', 'sent', 'error'
  const [existingRequest, setExistingRequest] = useState(null)

  // Redirect if user has a valid role
  useEffect(() => {
    if (!loading && profile) {
      if (profile.role === 'superadmin') navigate('/superadmin')
      else if (profile.role === 'admin') navigate('/admin')
      else if (profile.role === 'resident') navigate('/resident')
    }
  }, [loading, profile, navigate])

  // Load available communities
  useEffect(() => {
    async function loadCommunities() {
      const snap = await getDocs(collection(db, 'communities'))
      setCommunities(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }
    loadCommunities()
  }, [])

  // Check if user already has a pending request
  useEffect(() => {
    async function checkExistingRequest() {
      if (!user || communities.length === 0) return
      for (const community of communities) {
        const reqRef = doc(db, 'communities', community.id, 'requests', user.uid)
        const reqSnap = await getDoc(reqRef)
        if (reqSnap.exists()) {
          setExistingRequest({ communityId: community.id, communityName: community.name, ...reqSnap.data() })
          break
        }
      }
    }
    checkExistingRequest()
  }, [user, communities])

  async function submitRequest() {
    if (!user || !selectedCommunity) return
    try {
      setRequestStatus('sending')
      const reqRef = doc(db, 'communities', selectedCommunity, 'requests', user.uid)
      await setDoc(reqRef, {
        uid: user.uid,
        displayName: profile?.displayName || '',
        email: profile?.email || user.email || '',
        apartment: profile?.apartment || '',
        createdAt: serverTimestamp()
      })
      setRequestStatus('sent')
      const community = communities.find(c => c.id === selectedCommunity)
      setExistingRequest({ communityId: selectedCommunity, communityName: community?.name })
    } catch (err) {
      console.error(err)
      setRequestStatus('error')
    }
  }

  if (loading) return <div style={{padding:20}}>Cargando...</div>
  if (!user) {
    navigate('/login')
    return null
  }

  return (
    <div style={{padding:20,maxWidth:500,margin:'40px auto'}}>
      <h2>Cuenta Pendiente</h2>
      <p>Hola, <strong>{profile?.displayName || user.email}</strong>.</p>
      
      {existingRequest ? (
        <div style={{padding:16,background:'#e8f5e9',borderRadius:8,marginTop:16}}>
          <h4 style={{margin:0,color:'#2e7d32'}}>Solicitud enviada</h4>
          <p>Tu solicitud para unirte a <strong>{existingRequest.communityName}</strong> está pendiente de aprobación por un administrador.</p>
          <p style={{fontSize:12,color:'#666'}}>Te notificaremos cuando sea aprobada. Puedes cerrar sesión y volver más tarde.</p>
        </div>
      ) : (
        <>
          <p>Tu cuenta está pendiente de aprobación. Para unirte a una comunidad, selecciona una de la lista y envía una solicitud.</p>
          
          {communities.length > 0 ? (
            <div style={{marginTop:16}}>
              <select 
                value={selectedCommunity} 
                onChange={e => setSelectedCommunity(e.target.value)}
                style={{padding:10,fontSize:16,width:'100%'}}
              >
                <option value="">-- Selecciona una comunidad --</option>
                {communities.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              
              <button 
                onClick={submitRequest} 
                disabled={!selectedCommunity || requestStatus === 'sending'}
                style={{marginTop:12,padding:12,fontSize:16,width:'100%'}}
              >
                {requestStatus === 'sending' ? 'Enviando...' : 'Solicitar unirse'}
              </button>
              
              {requestStatus === 'error' && (
                <div style={{color:'red',marginTop:8}}>Error al enviar solicitud. Intenta de nuevo.</div>
              )}
            </div>
          ) : (
            <p style={{color:'#666'}}>No hay comunidades disponibles en este momento.</p>
          )}
        </>
      )}
      
      <button 
        onClick={logout} 
        style={{marginTop:24,padding:10,background:'#eee',border:'1px solid #ccc',width:'100%'}}
      >
        Cerrar sesión
      </button>
    </div>
  )
}
