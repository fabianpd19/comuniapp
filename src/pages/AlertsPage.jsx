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
    <div style={{minHeight:'100vh',background:'#f5f7fa'}}>
      <Navbar />
      <div className="container" style={{maxWidth:900,paddingTop:32,paddingBottom:48}}>
        <div className="fade-in">
          <h1 style={{color:'#2c3e50',fontSize:32,margin:'0 0 8px 0',fontWeight:700}}>
            🚨 Alertas de Emergencia
          </h1>
          <p style={{color:'#7f8c8d',fontSize:16,margin:'0 0 32px 0'}}>
            Sistema de alertas para la comunidad
          </p>
        </div>
        
        {/* Formulario solo para admin */}
        {profile && profile.role === 'admin' && (
          <div className="card fade-in" style={{background:'linear-gradient(135deg, #fff5f5 0%, #ffe0e0 100%)',marginBottom:32,border:'2px solid #e53e3e'}}>
            <h3 style={{margin:'0 0 20px 0',color:'#e53e3e',fontSize:20,fontWeight:700,display:'flex',alignItems:'center',gap:8}}>
              <span>🚨</span><span>Crear nueva alerta</span>
            </h3>
            <form onSubmit={handleCreate} style={{display:'flex',flexDirection:'column',gap:16}}>
              <div>
                <label style={{display:'block',marginBottom:8,color:'#2c3e50',fontWeight:600,fontSize:14}}>Mensaje de la alerta</label>
                <textarea 
                  placeholder="Describe la emergencia o situación importante..." 
                  value={message} 
                  onChange={e=>setMessage(e.target.value)}
                  required
                  rows={4}
                  style={{resize:'vertical'}}
                />
              </div>
              <div>
                <label style={{display:'block',marginBottom:12,color:'#2c3e50',fontWeight:600,fontSize:14}}>Nivel de prioridad</label>
                <div style={{display:'flex',gap:16}}>
                  <label style={{display:'flex',alignItems:'center',gap:8,padding:'12px 20px',border: level==='alta'?'2px solid #e53e3e':'2px solid #e1e8ed',borderRadius:8,background:level==='alta'?'#fff5f5':'white',cursor:'pointer',flex:1}}>
                    <input 
                      type="radio" 
                      name="level" 
                      value="alta" 
                      checked={level === 'alta'}
                      onChange={e => setLevel(e.target.value)}
                    />
                    <div>
                      <div style={{color:'#e53e3e',fontWeight:700,fontSize:15}}>🔴 ALTA</div>
                      <div style={{color:'#7f8c8d',fontSize:12}}>Emergencia crítica</div>
                    </div>
                  </label>
                  <label style={{display:'flex',alignItems:'center',gap:8,padding:'12px 20px',border: level==='media'?'2px solid #ed8936':'2px solid #e1e8ed',borderRadius:8,background:level==='media'?'#fffbf2':'white',cursor:'pointer',flex:1}}>
                    <input 
                      type="radio" 
                      name="level" 
                      value="media" 
                      checked={level === 'media'}
                      onChange={e => setLevel(e.target.value)}
                    />
                    <div>
                      <div style={{color:'#ed8936',fontWeight:700,fontSize:15}}>🟡 MEDIA</div>
                      <div style={{color:'#7f8c8d',fontSize:12}}>Información importante</div>
                    </div>
                  </label>
                </div>
              </div>
              <button 
                type="submit" 
                disabled={creating}
                style={{padding:'14px',background:'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',color:'white',fontSize:16,fontWeight:600}}
              >
                {creating ? '⏳ Publicando...' : '🚨 Publicar alerta'}
              </button>
            </form>
          </div>
        )}

        {/* Lista de alertas */}
        <div className="fade-in">
          {alerts.length === 0 ? (
            <div className="card" style={{textAlign:'center',padding:60,background:'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',border:'2px solid #22c55e'}}>
              <div style={{fontSize:64,marginBottom:16}}>✅</div>
              <h3 style={{color:'#16a34a',margin:'0 0 8px 0',fontSize:22,fontWeight:700}}>¡Todo en orden!</h3>
              <p style={{color:'#22c55e',fontSize:16,margin:0}}>No hay alertas activas en la comunidad</p>
            </div>
          ) : (
            <div style={{display:'grid',gap:16}}>
              {alerts.map(a=> (
                <div 
                  key={a.id} 
                  className="card"
                  style={{border: a.level === 'alta' ? '2px solid #e53e3e' : '2px solid #ed8936',background: a.level === 'alta' ? '#fff5f5' : '#fffbf2'}}
                >
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                    <span style={{padding:'6px 16px',borderRadius:20,fontWeight:'bold',fontSize:13,background: a.level === 'alta' ? 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)' : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',color: 'white',letterSpacing:'0.5px'}}>
                      {a.level === 'alta' ? '🔴 ALERTA ALTA' : '🟡 ALERTA MEDIA'}
                    </span>
                    {profile?.role === 'admin' && (
                      <button 
                        onClick={() => handleDelete(a.id)}
                        style={{color:'#e74c3c',background:'#fee',border:'1px solid #e74c3c',padding:'6px 12px',borderRadius:6,fontSize:12,fontWeight:600}}
                      >
                        🗑️ Eliminar
                      </button>
                    )}
                  </div>
                  <p style={{margin:'0 0 16px 0',fontSize:16,color:'#2d3748',lineHeight:1.6,fontWeight:500}}>{a.message}</p>
                  <div style={{fontSize:13,color:'#adb5bd',paddingTop:12,borderTop:'1px solid rgba(0,0,0,0.1)',display:'flex',alignItems:'center',gap:12}}>
                    <span>👤 {a.createdByName || 'Admin'}</span>
                    <span>•</span>
                    <span>📅 {a.createdAt?.toDate ? a.createdAt.toDate().toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'}) : 'Reciente'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
