import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore'
import { db } from '../services/firebase'
import { PremiumFeaturesSection } from '../components/PremiumLock'

export default function ResidentDashboard(){
  const { profile, community } = useAuth()
  const [recentPosts, setRecentPosts] = useState([])
  const [alerts, setAlerts] = useState([])
  const [activeSurveys, setActiveSurveys] = useState([])

  useEffect(() => {
    if (!community) return
    loadData()
  }, [community])

  async function loadData() {
    try {
      // Cargar posts recientes
      const postsSnap = await getDocs(query(collection(db, 'posts'), where('communityId', '==', community.id)))
      const posts = postsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
        .slice(0, 3)
      setRecentPosts(posts)

      // Cargar alertas
      const alertsSnap = await getDocs(query(collection(db, 'alerts'), where('communityId', '==', community.id)))
      const alertsList = alertsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      setAlerts(alertsList)

      // Cargar encuestas activas
      const surveysSnap = await getDocs(query(collection(db, 'surveys'), where('communityId', '==', community.id)))
      const surveys = surveysSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(s => s.active)
      setActiveSurveys(surveys)
    } catch (err) {
      console.error('Error cargando datos:', err)
    }
  }

  const categoryLabels = {
    seguridad: '🛡️ Seguridad',
    mantenimiento: '🔧 Mantenimiento',
    eventos: '🎉 Eventos',
    general: '📢 General'
  }

  return (
    <div>
      <Navbar />
      <div style={{padding:20,maxWidth:1000,margin:'0 auto'}}>
        <h2>¡Hola, {profile?.displayName || 'Vecino'}!</h2>
        
        {community ? (
          <div>
            {/* Info de la comunidad */}
            <div style={{background:'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',color:'white',padding:20,borderRadius:12,marginBottom:24}}>
              <h3 style={{margin:'0 0 4px 0'}}>{community.name}</h3>
              <p style={{margin:0,opacity:0.9}}>{community.description}</p>
            </div>

            {/* Alertas activas */}
            {alerts.length > 0 && (
              <div style={{marginBottom:24}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                  <h3 style={{margin:0}}>🚨 Alertas activas</h3>
                  <Link to="/resident/alerts" style={{fontSize:14,color:'#3498db'}}>Ver todas →</Link>
                </div>
                {alerts.slice(0, 2).map(a => (
                  <div key={a.id} style={{
                    padding:16,
                    marginBottom:8,
                    borderRadius:8,
                    background: a.level === 'alta' ? '#fdf2f2' : '#fffbeb',
                    border: a.level === 'alta' ? '2px solid #c0392b' : '2px solid #f39c12'
                  }}>
                    <span style={{
                      display:'inline-block',
                      padding:'2px 8px',
                      borderRadius:4,
                      fontSize:11,
                      fontWeight:'bold',
                      marginBottom:8,
                      background: a.level === 'alta' ? '#c0392b' : '#f39c12',
                      color: 'white'
                    }}>
                      {a.level === 'alta' ? '🔴 ALTA' : '🟡 MEDIA'}
                    </span>
                    <p style={{margin:0}}>{a.message}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Encuestas pendientes de votar */}
            {activeSurveys.length > 0 && (
              <div style={{marginBottom:24}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                  <h3 style={{margin:0}}>📊 Encuestas activas ({activeSurveys.length})</h3>
                  <Link to="/resident/surveys" style={{fontSize:14,color:'#3498db'}}>Participar →</Link>
                </div>
                <div style={{background:'#e8f4fd',padding:16,borderRadius:8,border:'1px solid #3498db'}}>
                  <p style={{margin:0}}>Hay {activeSurveys.length} encuesta{activeSurveys.length > 1 ? 's' : ''} esperando tu voto.</p>
                  <Link 
                    to="/resident/surveys" 
                    style={{display:'inline-block',marginTop:12,padding:'8px 16px',background:'#3498db',color:'white',borderRadius:4,textDecoration:'none'}}
                  >
                    Votar ahora
                  </Link>
                </div>
              </div>
            )}

            {/* Avisos recientes */}
            <div style={{marginBottom:24}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                <h3 style={{margin:0}}>📢 Avisos recientes</h3>
                <Link to="/resident/posts" style={{fontSize:14,color:'#3498db'}}>Ver todos →</Link>
              </div>
              {recentPosts.length === 0 ? (
                <p style={{color:'#666'}}>No hay avisos recientes.</p>
              ) : (
                recentPosts.map(p => (
                  <div key={p.id} style={{
                    padding:16,
                    marginBottom:8,
                    borderRadius:8,
                    background:'white',
                    border: p.priority === 'urgente' ? '2px solid #e74c3c' : '1px solid #ddd'
                  }}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                      <span style={{fontSize:12,color:'#666'}}>{categoryLabels[p.category] || p.category}</span>
                      {p.priority === 'urgente' && (
                        <span style={{background:'#e74c3c',color:'white',padding:'2px 8px',borderRadius:4,fontSize:11}}>URGENTE</span>
                      )}
                    </div>
                    <h4 style={{margin:'0 0 4px 0'}}>{p.title}</h4>
                    <p style={{margin:0,color:'#666',fontSize:14}}>{p.content?.substring(0, 100)}{p.content?.length > 100 ? '...' : ''}</p>
                  </div>
                ))
              )}
            </div>

            {/* Accesos rápidos */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))',gap:12}}>
              <Link to="/resident/posts" style={{padding:20,background:'#27ae60',color:'white',borderRadius:8,textDecoration:'none',textAlign:'center'}}>
                📢 Avisos
              </Link>
              <Link to="/resident/alerts" style={{padding:20,background:'#e74c3c',color:'white',borderRadius:8,textDecoration:'none',textAlign:'center'}}>
                🚨 Alertas
              </Link>
              <Link to="/resident/surveys" style={{padding:20,background:'#3498db',color:'white',borderRadius:8,textDecoration:'none',textAlign:'center'}}>
                📊 Encuestas
              </Link>
              <Link to="/resident/community" style={{padding:20,background:'#9b59b6',color:'white',borderRadius:8,textDecoration:'none',textAlign:'center'}}>
                👥 Comunidad
              </Link>
            </div>

            {/* Funciones Premium */}
            {!community?.isPremium && <PremiumFeaturesSection />}
          </div>
        ) : (
          <div style={{textAlign:'center',padding:40}}>
            <p style={{color:'#666'}}>No estás asignado a ninguna comunidad.</p>
            <p style={{fontSize:14,color:'#999'}}>Tu solicitud puede estar pendiente de aprobación.</p>
          </div>
        )}
      </div>
    </div>
  )
}
