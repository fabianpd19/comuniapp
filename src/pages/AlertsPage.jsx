import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../services/firebase'

export default function AlertsPage(){
  const { profile, community, user } = useAuth()
  const [alerts, setAlerts] = useState([])
  const [message, setMessage] = useState('')
  const [level, setLevel] = useState('media')
  const [creating, setCreating] = useState(false)

  useEffect(()=>{
    loadAlerts()
  },[community])

  async function loadAlerts() {
    if (!community) return
    const q = query(collection(db,'alerts'), where('communityId','==',community.id))
    const snap = await getDocs(q)
    setAlerts(snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)))
  }

  async function handleCreate(e){
    e.preventDefault()
    if (!profile || profile.role !== 'admin' || !message.trim()) return
    setCreating(true)
    try {
      await addDoc(collection(db,'alerts'),{
        message: message.trim(),
        level,
        communityId: community.id,
        createdBy: user?.uid || '',
        createdByName: profile?.displayName || profile?.email || '',
        createdAt: serverTimestamp()
      })
      setMessage('')
      await loadAlerts()
    } catch (err) {
      console.error('Error al crear alerta:', err)
      alert('Error al crear alerta: ' + err.message)
    }
    setCreating(false)
  }

  async function handleDelete(alertId) {
    if (!confirm('¿Eliminar esta alerta?')) return
    try {
      await deleteDoc(doc(db, 'alerts', alertId))
      await loadAlerts()
    } catch (err) {
      alert('Error al eliminar: ' + err.message)
    }
  }

  return (
    <div>
      <Navbar />
      <div style={{padding:20,maxWidth:800,margin:'0 auto'}}>
        <h2>🚨 Alertas de la Comunidad</h2>
        
        {/* Formulario solo para admin */}
        {profile && profile.role === 'admin' && (
          <form onSubmit={handleCreate} style={{background:'#fff3cd',padding:16,borderRadius:8,marginBottom:24,border:'1px solid #ffc107'}}>
            <h4 style={{margin:'0 0 12px 0'}}>Crear nueva alerta</h4>
            <div style={{display:'grid',gap:12}}>
              <textarea 
                placeholder="Mensaje de la alerta..." 
                value={message} 
                onChange={e=>setMessage(e.target.value)}
                required
                rows={3}
                style={{padding:10,fontSize:14,border:'1px solid #ddd',borderRadius:4}}
              />
              <div style={{display:'flex',gap:12,alignItems:'center'}}>
                <label style={{display:'flex',alignItems:'center',gap:8}}>
                  <input 
                    type="radio" 
                    name="level" 
                    value="alta" 
                    checked={level === 'alta'}
                    onChange={e => setLevel(e.target.value)}
                  />
                  <span style={{color:'#c0392b',fontWeight:'bold'}}>🔴 Alta</span>
                </label>
                <label style={{display:'flex',alignItems:'center',gap:8}}>
                  <input 
                    type="radio" 
                    name="level" 
                    value="media" 
                    checked={level === 'media'}
                    onChange={e => setLevel(e.target.value)}
                  />
                  <span style={{color:'#f39c12',fontWeight:'bold'}}>🟡 Media</span>
                </label>
              </div>
              <button 
                type="submit" 
                disabled={creating}
                style={{padding:12,background:'#e74c3c',color:'white',border:'none',borderRadius:4,fontSize:16,cursor:'pointer'}}
              >
                {creating ? 'Publicando...' : 'Publicar alerta'}
              </button>
            </div>
          </form>
        )}

        {/* Lista de alertas */}
        <div>
          {alerts.length === 0 ? (
            <div style={{textAlign:'center',padding:40,color:'#27ae60'}}>
              <div style={{fontSize:48}}>✅</div>
              <p>No hay alertas activas. ¡Todo en orden!</p>
            </div>
          ) : (
            alerts.map(a=> (
              <div 
                key={a.id} 
                style={{
                  border: a.level === 'alta' ? '2px solid #c0392b' : '2px solid #f39c12',
                  background: a.level === 'alta' ? '#fdf2f2' : '#fffbeb',
                  padding:16,
                  marginBottom:12,
                  borderRadius:8
                }}
              >
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{
                    padding:'4px 12px',
                    borderRadius:4,
                    fontWeight:'bold',
                    fontSize:12,
                    background: a.level === 'alta' ? '#c0392b' : '#f39c12',
                    color: 'white'
                  }}>
                    {a.level === 'alta' ? '🔴 ALERTA ALTA' : '🟡 ALERTA MEDIA'}
                  </span>
                  {profile?.role === 'admin' && (
                    <button 
                      onClick={() => handleDelete(a.id)}
                      style={{color:'#666',background:'none',border:'none',cursor:'pointer',fontSize:12}}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
                <p style={{margin:'12px 0',fontSize:16,color:'#333'}}>{a.message}</p>
                <div style={{fontSize:12,color:'#999'}}>
                  Por {a.createdByName || 'Admin'} • {a.createdAt?.toDate ? a.createdAt.toDate().toLocaleDateString('es-ES') : 'Reciente'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
