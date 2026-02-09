import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../services/firebase'
import { PremiumFeaturesSection } from '../components/PremiumLock'

export default function AdminDashboard(){
  const { profile, community } = useAuth()
  const [stats, setStats] = useState({ posts: 0, alerts: 0, surveys: 0, pendingRequests: 0 })
  const [recentAlerts, setRecentAlerts] = useState([])

  useEffect(() => {
    if (!community) return
    loadStats()
  }, [community])

  async function loadStats() {
    try {
      // Contar posts
      const postsSnap = await getDocs(query(collection(db, 'posts'), where('communityId', '==', community.id)))
      
      // Contar alertas
      const alertsSnap = await getDocs(query(collection(db, 'alerts'), where('communityId', '==', community.id)))
      const alertsList = alertsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      setRecentAlerts(alertsList.slice(0, 3))
      
      // Contar encuestas activas
      const surveysSnap = await getDocs(query(collection(db, 'surveys'), where('communityId', '==', community.id)))
      const activeSurveys = surveysSnap.docs.filter(d => d.data().active).length

      // Contar solicitudes pendientes
      const requestsSnap = await getDocs(collection(db, 'communities', community.id, 'requests'))

      setStats({
        posts: postsSnap.size,
        alerts: alertsSnap.size,
        surveys: activeSurveys,
        pendingRequests: requestsSnap.size
      })
    } catch (err) {
      console.error('Error cargando estadísticas:', err)
    }
  }

  return (
    <div>
      <Navbar />
      <div style={{padding:20,maxWidth:1000,margin:'0 auto'}}>
        <h2>Panel de Administrador</h2>
        
        {community ? (
          <div>
            {/* Info de la comunidad */}
            <div style={{background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',color:'white',padding:24,borderRadius:12,marginBottom:24}}>
              <h3 style={{margin:'0 0 8px 0',fontSize:24}}>{community.name}</h3>
              <p style={{margin:'4px 0',opacity:0.9}}>{community.description}</p>
              <p style={{margin:'4px 0',opacity:0.8}}>📍 {community.address}</p>
              <p style={{margin:'8px 0 0 0',fontWeight:'bold'}}>👥 {community.totalMembers || community.members?.length || 0} miembros</p>
            </div>

            {/* Tarjetas de estadísticas */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:16,marginBottom:24}}>
              <Link to="/admin/posts" style={{textDecoration:'none'}}>
                <div style={{background:'#27ae60',color:'white',padding:20,borderRadius:8,textAlign:'center'}}>
                  <div style={{fontSize:32,fontWeight:'bold'}}>{stats.posts}</div>
                  <div>📢 Avisos</div>
                </div>
              </Link>
              <Link to="/admin/alerts" style={{textDecoration:'none'}}>
                <div style={{background:'#e74c3c',color:'white',padding:20,borderRadius:8,textAlign:'center'}}>
                  <div style={{fontSize:32,fontWeight:'bold'}}>{stats.alerts}</div>
                  <div>🚨 Alertas</div>
                </div>
              </Link>
              <Link to="/admin/surveys" style={{textDecoration:'none'}}>
                <div style={{background:'#3498db',color:'white',padding:20,borderRadius:8,textAlign:'center'}}>
                  <div style={{fontSize:32,fontWeight:'bold'}}>{stats.surveys}</div>
                  <div>📊 Encuestas activas</div>
                </div>
              </Link>
              <Link to="/admin/community" style={{textDecoration:'none'}}>
                <div style={{background: stats.pendingRequests > 0 ? '#f39c12' : '#95a5a6',color:'white',padding:20,borderRadius:8,textAlign:'center'}}>
                  <div style={{fontSize:32,fontWeight:'bold'}}>{stats.pendingRequests}</div>
                  <div>⏳ Solicitudes pendientes</div>
                </div>
              </Link>
            </div>

            {/* Alertas recientes */}
            {recentAlerts.length > 0 && (
              <div style={{marginBottom:24}}>
                <h4>Alertas recientes</h4>
                {recentAlerts.map(a => (
                  <div key={a.id} style={{
                    padding:12,
                    marginBottom:8,
                    borderRadius:4,
                    background: a.level === 'alta' ? '#fdf2f2' : '#fffbeb',
                    border: a.level === 'alta' ? '1px solid #c0392b' : '1px solid #f39c12'
                  }}>
                    <span style={{fontWeight:'bold'}}>{a.level === 'alta' ? '🔴' : '🟡'}</span> {a.message}
                  </div>
                ))}
              </div>
            )}

            {/* Acciones rápidas */}
            <div>
              <h4>Acciones rápidas</h4>
              <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                <Link to="/admin/posts" style={{padding:'10px 20px',background:'#27ae60',color:'white',borderRadius:4,textDecoration:'none'}}>
                  + Nuevo aviso
                </Link>
                <Link to="/admin/alerts" style={{padding:'10px 20px',background:'#e74c3c',color:'white',borderRadius:4,textDecoration:'none'}}>
                  + Nueva alerta
                </Link>
                <Link to="/admin/surveys" style={{padding:'10px 20px',background:'#3498db',color:'white',borderRadius:4,textDecoration:'none'}}>
                  + Nueva encuesta
                </Link>
              </div>
            </div>

            {/* Funciones Premium */}
            {!community?.isPremium && <PremiumFeaturesSection />}
          </div>
        ) : (
          <div style={{textAlign:'center',padding:40}}>
            <p style={{color:'#666'}}>No estás asignado a ninguna comunidad.</p>
            <p style={{fontSize:14,color:'#999'}}>Contacta al Super Administrador para que te asigne una comunidad.</p>
          </div>
        )}
      </div>
    </div>
  )
}
