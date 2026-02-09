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
    <div style={{minHeight:'100vh',background:'#f5f7fa'}}>
      <Navbar />
      <div className="container" style={{paddingTop:32,paddingBottom:48}}>
        <div className="fade-in">
          <h1 style={{color:'#2c3e50',fontSize:32,margin:'0 0 8px 0',fontWeight:700}}>
            👋 ¡Hola, {profile?.displayName || 'Vecino'}!
          </h1>
          <p style={{color:'#7f8c8d',fontSize:16,margin:'0 0 32px 0'}}>
            Bienvenido a tu comunidad
          </p>
        </div>
        
        {community ? (
          <div className="fade-in">
            {/* Info de la comunidad */}
            <div className="card" style={{
              background:'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              color:'white',
              padding:32,
              marginBottom:32,
              border:'none'
            }}>
              <div style={{display:'flex',alignItems:'center',gap:16}}>
                <div style={{fontSize:48}}>🏘️</div>
                <div>
                  <h2 style={{margin:'0 0 4px 0',fontSize:28,fontWeight:700}}>{community.name}</h2>
                  <p style={{margin:0,opacity:0.95,fontSize:16}}>{community.description}</p>
                </div>
              </div>
            </div>

            {/* Alertas activas */}
            {alerts.length > 0 && (
              <div className="card" style={{marginBottom:32,border:'2px solid #e53e3e'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
                  <h3 style={{margin:0,color:'#e53e3e',fontSize:20,fontWeight:700,display:'flex',alignItems:'center',gap:8}}>
                    <span>🚨</span>
                    <span>Alertas activas</span>
                  </h3>
                  <Link to="/resident/alerts" style={{fontSize:14,color:'#667eea',fontWeight:600,textDecoration:'none'}}>
                    Ver todas →
                  </Link>
                </div>
                <div style={{display:'grid',gap:12}}>
                  {alerts.slice(0, 2).map(a => (
                    <div key={a.id} style={{
                      padding:16,
                      borderRadius:8,
                      background: a.level === 'alta' ? '#fff5f5' : '#fffbf2',
                      border: a.level === 'alta' ? '2px solid #e53e3e' : '2px solid #ed8936',
                      display:'flex',
                      alignItems:'start',
                      gap:12
                    }}>
                      <div style={{fontSize:24,flexShrink:0}}>
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

            {/* Encuestas pendientes de votar */}
            {activeSurveys.length > 0 && (
              <div className="card" style={{marginBottom:32,border:'2px solid #4facfe'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                  <h3 style={{margin:0,color:'#2c3e50',fontSize:20,fontWeight:700,display:'flex',alignItems:'center',gap:8}}>
                    <span>📊</span>
                    <span>Encuestas activas ({activeSurveys.length})</span>
                  </h3>
                  <Link to="/resident/surveys" style={{fontSize:14,color:'#667eea',fontWeight:600,textDecoration:'none'}}>
                    Participar →
                  </Link>
                </div>
                <div style={{
                  background:'linear-gradient(135deg, #e0f7fa 0%, #e1f5fe 100%)',
                  padding:20,
                  borderRadius:8
                }}>
                  <p style={{margin:'0 0 16px 0',color:'#2c3e50',fontSize:15}}>
                    🗳️ Hay {activeSurveys.length} encuesta{activeSurveys.length > 1 ? 's' : ''} esperando tu voto
                  </p>
                  <Link 
                    to="/resident/surveys" 
                    style={{textDecoration:'none'}}
                  >
                    <button style={{
                      padding:'12px 24px',
                      background:'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                      color:'white',
                      borderRadius:8,
                      fontSize:15
                    }}>
                      📊 Votar ahora
                    </button>
                  </Link>
                </div>
              </div>
            )}

            {/* Avisos recientes */}
            <div className="card" style={{marginBottom:32}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
                <h3 style={{margin:0,color:'#2c3e50',fontSize:20,fontWeight:700,display:'flex',alignItems:'center',gap:8}}>
                  <span>📢</span>
                  <span>Avisos recientes</span>
                </h3>
                <Link to="/resident/posts" style={{fontSize:14,color:'#667eea',fontWeight:600,textDecoration:'none'}}>
                  Ver todos →
                </Link>
              </div>
              {recentPosts.length === 0 ? (
                <p style={{color:'#95a5a6',textAlign:'center',padding:20}}>No hay avisos recientes</p>
              ) : (
                <div style={{display:'grid',gap:12}}>
                  {recentPosts.map(p => (
                    <div key={p.id} style={{
                      padding:16,
                      borderRadius:8,
                      background:'#f8f9fa',
                      border: p.priority === 'urgente' ? '2px solid #e53e3e' : '1px solid #e1e8ed',
                      transition:'all 0.3s ease'
                    }}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                        <span style={{fontSize:13,color:'#7f8c8d',fontWeight:600}}>
                          {categoryLabels[p.category] || p.category}
                        </span>
                        {p.priority === 'urgente' && (
                          <span style={{
                            background:'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
                            color:'white',
                            padding:'4px 12px',
                            borderRadius:20,
                            fontSize:11,
                            fontWeight:'bold'
                          }}>
                            ⚠️ URGENTE
                          </span>
                        )}
                      </div>
                      <h4 style={{margin:'0 0 8px 0',color:'#2c3e50',fontSize:16}}>{p.title}</h4>
                      <p style={{margin:0,color:'#7f8c8d',fontSize:14,lineHeight:1.5}}>
                        {p.content?.substring(0, 100)}{p.content?.length > 100 ? '...' : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Accesos rápidos */}
            <div className="card">
              <h3 style={{margin:'0 0 20px 0',color:'#2c3e50',fontSize:20,fontWeight:700}}>
                ⚡ Accesos rápidos
              </h3>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))',gap:16}}>
                <Link to="/resident/posts" style={{textDecoration:'none'}}>
                  <div style={{
                    padding:24,
                    background:'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                    color:'white',
                    borderRadius:12,
                    textAlign:'center',
                    transition:'all 0.3s ease'
                  }}>
                    <div style={{fontSize:32,marginBottom:8}}>📢</div>
                    <div style={{fontWeight:600}}>Avisos</div>
                  </div>
                </Link>
                <Link to="/resident/alerts" style={{textDecoration:'none'}}>
                  <div style={{
                    padding:24,
                    background:'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
                    color:'white',
                    borderRadius:12,
                    textAlign:'center',
                    transition:'all 0.3s ease'
                  }}>
                    <div style={{fontSize:32,marginBottom:8}}>🚨</div>
                    <div style={{fontWeight:600}}>Alertas</div>
                  </div>
                </Link>
                <Link to="/resident/surveys" style={{textDecoration:'none'}}>
                  <div style={{
                    padding:24,
                    background:'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    color:'white',
                    borderRadius:12,
                    textAlign:'center',
                    transition:'all 0.3s ease'
                  }}>
                    <div style={{fontSize:32,marginBottom:8}}>📊</div>
                    <div style={{fontWeight:600}}>Encuestas</div>
                  </div>
                </Link>
                <Link to="/resident/community" style={{textDecoration:'none'}}>
                  <div style={{
                    padding:24,
                    background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color:'white',
                    borderRadius:12,
                    textAlign:'center',
                    transition:'all 0.3s ease'
                  }}>
                    <div style={{fontSize:32,marginBottom:8}}>👥</div>
                    <div style={{fontWeight:600}}>Comunidad</div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Funciones Premium */}
            {!community?.isPremium && <div style={{marginTop:32}}><PremiumFeaturesSection /></div>}
          </div>
        ) : (
          <div className="card" style={{textAlign:'center',padding:60}}>
            <div style={{fontSize:64,marginBottom:16}}>🏘️</div>
            <p style={{color:'#7f8c8d',fontSize:18,margin:'0 0 8px 0'}}>No estás asignado a ninguna comunidad</p>
            <p style={{fontSize:14,color:'#bdc3c7',margin:0}}>Tu solicitud puede estar pendiente de aprobación</p>
          </div>
        )}
      </div>
    </div>
  )
}
