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
  const [requestStatus, setRequestStatus] = useState(null)
  const [existingRequest, setExistingRequest] = useState(null)

  useEffect(() => {
    if (!loading && profile) {
      if (profile.role === 'superadmin') navigate('/superadmin')
      else if (profile.role === 'admin') navigate('/admin')
      else if (profile.role === 'resident') navigate('/resident')
    }
  }, [loading, profile, navigate])

  useEffect(() => {
    async function loadCommunities() {
      const snap = await getDocs(collection(db, 'communities'))
      setCommunities(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }
    loadCommunities()
  }, [])

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

  if (loading) {
    return (
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
        <div style={{color:'white',fontSize:18,textAlign:'center'}}>
          <div className="pulse" style={{fontSize:48,marginBottom:16}}>⏳</div>
          <p>Cargando...</p>
        </div>
      </div>
    )
  }
  
  if (!user) {
    navigate('/login')
    return null
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',padding:20}}>
      <div className="card fade-in" style={{maxWidth:540,width:'100%',boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{fontSize:64,marginBottom:16}}>⏳</div>
          <h2 style={{margin:0,color:'#2c3e50',fontSize:28}}>Cuenta Pendiente</h2>
          <p style={{color:'#7f8c8d',margin:'8px 0 0 0'}}>Hola, <strong>{profile?.displayName || user.email}</strong></p>
        </div>
        
        {existingRequest ? (
          <div style={{padding:24,background:'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)',borderRadius:12,border:'2px solid #22c55e'}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
              <span style={{fontSize:32}}>✅</span>
              <h4 style={{margin:0,color:'#166534',fontSize:20,fontWeight:700}}>Solicitud enviada</h4>
            </div>
            <p style={{margin:'0 0 12px 0',color:'#15803d',fontSize:15}}>
              Tu solicitud para unirte a <strong>{existingRequest.communityName}</strong> está pendiente de aprobación por un administrador.
            </p>
            <p style={{fontSize:13,color:'#166534',margin:0,opacity:0.8}}>
              Te notificaremos cuando sea aprobada. Puedes cerrar sesión y volver más tarde.
            </p>
          </div>
        ) : (
          <>
            <p style={{color:'#495057',fontSize:15,marginBottom:24,textAlign:'center'}}>
              Para unirte a una comunidad, selecciona una de la lista y envía una solicitud
            </p>
            
            {communities.length > 0 ? (
              <div style={{display:'flex',flexDirection:'column',gap:16}}>
                <div>
                  <label style={{display:'block',marginBottom:8,color:'#2c3e50',fontWeight:600,fontSize:14}}>
                    🏘️ Selecciona tu comunidad
                  </label>
                  <select 
                    value={selectedCommunity} 
                    onChange={e => setSelectedCommunity(e.target.value)}
                  >
                    <option value="">-- Selecciona una comunidad --</option>
                    {communities.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                
                <button 
                  onClick={submitRequest} 
                  disabled={!selectedCommunity || requestStatus === 'sending'}
                  style={{padding:'14px',background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',color:'white',fontSize:16,fontWeight:600}}
                >
                  {requestStatus === 'sending' ? '⏳ Enviando...' : '📨 Solicitar unirse'}
                </button>
                
                {requestStatus === 'error' && (
                  <div style={{color:'#e74c3c',padding:12,background:'#fee',borderRadius:8,border:'1px solid #e74c3c',fontSize:14}}>
                    ⚠️ Error al enviar solicitud. Intenta de nuevo.
                  </div>
                )}
              </div>
            ) : (
              <div style={{textAlign:'center',padding:24,background:'#f8f9fa',borderRadius:8}}>
                <p style={{color:'#7f8c8d',margin:0}}>No hay comunidades disponibles en este momento</p>
              </div>
            )}
          </>
        )}
        
        <button 
          onClick={logout} 
          style={{marginTop:24,padding:'12px',background:'white',border:'2px solid #e1e8ed',width:'100%',color:'#495057',fontWeight:600}}
        >
          🚪 Cerrar sesión
        </button>
      </div>
    </div>
  )
}
