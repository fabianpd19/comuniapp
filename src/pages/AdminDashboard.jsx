import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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
    <div style={{minHeight:'100vh',background:'#f5f7fa'}}>
      <div className="container" style={{paddingTop:32,paddingBottom:48}}>
        <div className="fade-in">
          <h1 style={{color:'#2c3e50',fontSize:32,margin:'0 0 8px 0',fontWeight:700}}>
            👨‍💼 Panel de Administrador
          </h1>
          <p style={{color:'#7f8c8d',fontSize:16,margin:'0 0 32px 0'}}>
            Gestiona tu comunidad de manera eficiente
          </p>
        </div>
        
        {community ? (
          <div className="fade-in">
            {/* Info de la comunidad */}
            <div className="card" style={{
              background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color:'white',
              padding:32,
              marginBottom:32,
              border:'none'
            }}>
              <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:16}}>
                <div style={{fontSize:48}}>🏘️</div>
                <div>
                  <h2 style={{margin:'0 0 8px 0',fontSize:28,fontWeight:700}}>{community.name}</h2>
                  <p style={{margin:0,opacity:0.95,fontSize:16}}>{community.description}</p>
                </div>
              </div>
              <div style={{display:'flex',gap:24,marginTop:20,flexWrap:'wrap'}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:20}}>📍</span>
                  <span style={{opacity:0.9}}>{community.address}</span>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:20}}>👥</span>
                  <span style={{fontWeight:'bold'}}>{community.totalMembers || community.members?.length || 0} miembros</span>
                </div>
              </div>
            </div>

            {/* Tarjetas de estadísticas */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))',gap:20,marginBottom:32}}>
              <Link to="/admin/posts" style={{textDecoration:'none'}}>
                <div className="card" style={{
                  background:'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                  color:'white',
                  padding:24,
                  border:'none',
                  textAlign:'center',
                  transition:'all 0.3s ease'
                }}>
                  <div style={{fontSize:48,marginBottom:12}}>📢</div>
                  <div style={{fontSize:36,fontWeight:'bold',marginBottom:4}}>{stats.posts}</div>
                  <div style={{fontSize:15,opacity:0.9}}>Avisos publicados</div>
                </div>
              </Link>
              <Link to="/admin/alerts" style={{textDecoration:'none'}}>
                <div className="card" style={{
                  background:'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
                  color:'white',
                  padding:24,
                  border:'none',
                  textAlign:'center',
                  transition:'all 0.3s ease'
                }}>
                  <div style={{fontSize:48,marginBottom:12}}>🚨</div>
                  <div style={{fontSize:36,fontWeight:'bold',marginBottom:4}}>{stats.alerts}</div>
                  <div style={{fontSize:15,opacity:0.9}}>Alertas activas</div>
                </div>
              </Link>
              <Link to="/admin/surveys" style={{textDecoration:'none'}}>
                <div className="card" style={{
                  background:'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  color:'white',
                  padding:24,
                  border:'none',
                  textAlign:'center',
                  transition:'all 0.3s ease'
                }}>
                  <div style={{fontSize:48,marginBottom:12}}>📊</div>
                  <div style={{fontSize:36,fontWeight:'bold',marginBottom:4}}>{stats.surveys}</div>
                  <div style={{fontSize:15,opacity:0.9}}>Encuestas activas</div>
                </div>
              </Link>
              <Link to="/admin/community" style={{textDecoration:'none'}}>
                <div className="card" style={{
                  background: stats.pendingRequests > 0 
                    ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' 
                    : 'linear-gradient(135deg, #a8a8a8 0%, #7f7f7f 100%)',
                  color:'white',
                  padding:24,
                  border:'none',
                  textAlign:'center',
                  transition:'all 0.3s ease'
                }}>
                  <div style={{fontSize:48,marginBottom:12}}>⏳</div>
                  <div style={{fontSize:36,fontWeight:'bold',marginBottom:4}}>{stats.pendingRequests}</div>
                  <div style={{fontSize:15,opacity:0.9}}>Solicitudes pendientes</div>
                </div>
              </Link>
            </div>

            {/* Alertas recientes */}
            {recentAlerts.length > 0 && (
              <div className="card" style={{marginBottom:32}}>
                <h3 style={{margin:'0 0 20px 0',color:'#2c3e50',fontSize:20,fontWeight:700}}>
                  🚨 Alertas recientes
                </h3>
                <div style={{display:'grid',gap:12}}>
                  {recentAlerts.map(a => (
                    <div key={a.id} style={{
                      padding:16,
                      borderRadius:8,
                      background: a.level === 'alta' ? '#fff5f5' : '#fffbf2',
                      border: a.level === 'alta' ? '2px solid #e53e3e' : '2px solid #ed8936',
                      display:'flex',
                      alignItems:'start',
                      gap:12
                    }}>
                      <div style={{
                        fontSize:24,
                        flexShrink:0
                      }}>
                        {a.level === 'alta' ? '🔴' : '🟡'}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{
                          fontSize:11,
                          fontWeight:'bold',
                          color: a.level === 'alta' ? '#e53e3e' : '#ed8936',
                          marginBottom:4,
                          textTransform:'uppercase',
                          letterSpacing:'0.5px'
                        }}>
                          {a.level === 'alta' ? 'PRIORIDAD ALTA' : 'PRIORIDAD MEDIA'}
                        </div>
                        <p style={{margin:0,color:'#2d3748',fontSize:15}}>{a.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Acciones rápidas */}
            <div className="card" style={{marginBottom:32}}>
              <h3 style={{margin:'0 0 20px 0',color:'#2c3e50',fontSize:20,fontWeight:700}}>
                ⚡ Acciones rápidas
              </h3>
              <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                <Link to="/admin/posts" style={{textDecoration:'none'}}>
                  <button style={{
                    padding:'12px 24px',
                    background:'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                    color:'white',
                    borderRadius:8,
                    display:'flex',
                    alignItems:'center',
                    gap:8,
                    fontSize:15
                  }}>
                    <span>📢</span>
                    <span>Nuevo aviso</span>
                  </button>
                </Link>
                <Link to="/admin/alerts" style={{textDecoration:'none'}}>
                  <button style={{
                    padding:'12px 24px',
                    background:'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
                    color:'white',
                    borderRadius:8,
                    display:'flex',
                    alignItems:'center',
                    gap:8,
                    fontSize:15
                  }}>
                    <span>🚨</span>
                    <span>Nueva alerta</span>
                  </button>
                </Link>
                <Link to="/admin/surveys" style={{textDecoration:'none'}}>
                  <button style={{
                    padding:'12px 24px',
                    background:'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    color:'white',
                    borderRadius:8,
                    display:'flex',
                    alignItems:'center',
                    gap:8,
                    fontSize:15
                  }}>
                    <span>📊</span>
                    <span>Nueva encuesta</span>
                  </button>
                </Link>
              </div>
            </div>

            {/* Funciones Premium */}
            {!community?.isPremium && <PremiumFeaturesSection />}
          </div>
        ) : (
          <div className="card" style={{textAlign:'center',padding:60}}>
            <div style={{fontSize:64,marginBottom:16}}>🏘️</div>
            <p style={{color:'#7f8c8d',fontSize:18,margin:'0 0 8px 0'}}>No estás asignado a ninguna comunidad</p>
            <p style={{fontSize:14,color:'#bdc3c7',margin:0}}>Contacta al Super Administrador para que te asigne una comunidad</p>
          </div>
        )}
      </div>
    </div>
  )
}
