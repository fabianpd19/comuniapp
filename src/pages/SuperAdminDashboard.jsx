import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db } from '../services/firebase'
import Navbar from '../components/Navbar'

export default function SuperAdminDashboard() {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [communities, setCommunities] = useState([])
  const [activeTab, setActiveTab] = useState('users')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const usersSnap = await getDocs(collection(db, 'users'))
    setUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })))

    const commSnap = await getDocs(collection(db, 'communities'))
    setCommunities(commSnap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  // Find which community a user belongs to
  function getUserCommunity(uid) {
    return communities.find(c => c.members?.includes(uid))
  }

  // Check if user is admin of a community
  function isAdminOf(uid) {
    return communities.find(c => c.adminId === uid)
  }

  async function changeUserRole(uid, newRole) {
    await updateDoc(doc(db, 'users', uid), { role: newRole, updatedAt: serverTimestamp() })
    loadData()
  }

  async function assignUserToCommunity(uid, communityId, asAdmin = false) {
    if (!communityId) return
    
    const user = users.find(u => u.id === uid)
    const currentCommunity = getUserCommunity(uid)
    
    // Remove from current community if exists
    if (currentCommunity && currentCommunity.id !== communityId) {
      await updateDoc(doc(db, 'communities', currentCommunity.id), {
        members: arrayRemove(uid),
        updatedAt: serverTimestamp()
      })
      // If was admin of that community, clear adminId
      if (currentCommunity.adminId === uid) {
        await updateDoc(doc(db, 'communities', currentCommunity.id), {
          adminId: '',
          updatedAt: serverTimestamp()
        })
      }
    }
    
    // Add to new community
    const updates = {
      members: arrayUnion(uid),
      updatedAt: serverTimestamp()
    }
    
    // If assigning as admin, also set adminId
    if (asAdmin) {
      updates.adminId = uid
    }
    
    await updateDoc(doc(db, 'communities', communityId), updates)
    
    // Delete any pending request for this user in the new community
    try {
      const reqRef = doc(db, 'communities', communityId, 'requests', uid)
      await deleteDoc(reqRef)
    } catch (e) {
      // Ignore if request doesn't exist
    }
    
    // Update user role if pending
    if (user && user.role === 'pending') {
      await updateDoc(doc(db, 'users', uid), { role: 'resident', updatedAt: serverTimestamp() })
    }
    
    loadData()
  }

  async function setAsAdminOfCommunity(uid, communityId) {
    if (!communityId) return
    
    // First ensure user is a member of the community
    await assignUserToCommunity(uid, communityId, true)
    
    // Update user role to admin
    await updateDoc(doc(db, 'users', uid), { role: 'admin', updatedAt: serverTimestamp() })
    
    loadData()
  }

  async function deleteUser(uid) {
    if (!confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) return
    await deleteDoc(doc(db, 'users', uid))
    loadData()
  }

  return (
    <div style={{minHeight:'100vh',background:'#f5f7fa'}}>
      <nav style={{
        display:'flex',
        gap:16,
        padding:'16px 24px',
        alignItems:'center',
        background:'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        color:'white',
        boxShadow:'0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:24}}>👑</span>
          <strong style={{fontSize:18}}>ComuniApp - SuperAdmin</strong>
        </div>
        <div style={{flex:1}}/>
        <span style={{opacity:0.9}}>{profile?.displayName || profile?.email}</span>
        <button 
          onClick={logout} 
          style={{
            background:'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
            color:'white',
            border:'none',
            padding:'8px 16px',
            borderRadius:6,
            fontWeight:600
          }}
        >
          🚪 Salir
        </button>
      </nav>

      <div className="container" style={{paddingTop:32,paddingBottom:48}}>
        <div className="fade-in">
          <h1 style={{color:'#2c3e50',fontSize:32,margin:'0 0 8px 0',fontWeight:700}}>
            👑 Panel de Super Administrador
          </h1>
          <p style={{color:'#7f8c8d',fontSize:16,margin:'0 0 32px 0'}}>
            Control total del sistema
          </p>
        </div>
        
        <div style={{display:'flex',gap:12,marginBottom:32}}>
          <button 
            onClick={() => setActiveTab('users')}
            style={{
              padding:'12px 24px',
              background:activeTab==='users'
                ?'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                :'white',
              color:activeTab==='users'?'white':'#2c3e50',
              border:activeTab==='users'?'none':'2px solid #e1e8ed',
              borderRadius:8,
              fontWeight:600,
              fontSize:15
            }}
          >
            👥 Usuarios ({users.length})
          </button>
          <button 
            onClick={() => setActiveTab('communities')}
            style={{
              padding:'12px 24px',
              background:activeTab==='communities'
                ?'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                :'white',
              color:activeTab==='communities'?'white':'#2c3e50',
              border:activeTab==='communities'?'none':'2px solid #e1e8ed',
              borderRadius:8,
              fontWeight:600,
              fontSize:15
            }}
          >
            🏘️ Comunidades ({communities.length})
          </button>
        </div>

        {activeTab === 'users' && (
          <div className="card fade-in">
            <h3 style={{margin:'0 0 24px 0',color:'#2c3e50',fontSize:22,fontWeight:700}}>
              👥 Gestión de Usuarios
            </h3>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'}}>
                    <th style={{padding:12,textAlign:'left',borderBottom:'2px solid #dee2e6',fontWeight:700,color:'#2c3e50'}}>Nombre</th>
                    <th style={{padding:12,textAlign:'left',borderBottom:'2px solid #dee2e6',fontWeight:700,color:'#2c3e50'}}>Email</th>
                    <th style={{padding:12,textAlign:'left',borderBottom:'2px solid #dee2e6',fontWeight:700,color:'#2c3e50'}}>Rol</th>
                    <th style={{padding:12,textAlign:'left',borderBottom:'2px solid #dee2e6',fontWeight:700,color:'#2c3e50'}}>Comunidad</th>
                    <th style={{padding:12,textAlign:'left',borderBottom:'2px solid #dee2e6',fontWeight:700,color:'#2c3e50'}}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => {
                    const userCommunity = getUserCommunity(u.id)
                    const adminOfCommunity = isAdminOf(u.id)
                    return (
                      <tr key={u.id} style={{borderBottom:'1px solid #f1f3f5'}}>
                        <td style={{padding:12}}>
                          <div style={{fontWeight:600,color:'#2c3e50'}}>{u.displayName || '-'}</div>
                          {u.apartment && <span style={{color:'#7f8c8d',fontSize:12}}>🏠 Apt: {u.apartment}</span>}
                        </td>
                        <td style={{padding:12,color:'#495057'}}>{u.email}</td>
                        <td style={{padding:12}}>
                          <select 
                            value={u.role || 'pending'} 
                            onChange={e => changeUserRole(u.id, e.target.value)}
                            style={{
                              padding:'8px 12px',
                              borderRadius:6,
                              border:'2px solid #e1e8ed',
                              fontSize:14,
                              fontWeight:600
                            }}
                          >
                            <option value="pending">⏳ Pendiente</option>
                            <option value="resident">👤 Vecino</option>
                            <option value="admin">👨‍💼 Administrador</option>
                            <option value="superadmin">👑 Super Admin</option>
                          </select>
                        </td>
                        <td style={{padding:12}}>
                          {userCommunity ? (
                            <div>
                              <span style={{fontWeight:600,color:'#2c3e50'}}>{userCommunity.name}</span>
                              {adminOfCommunity && (
                                <span style={{
                                  marginLeft:8,
                                  fontSize:11,
                                  background:'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                  color:'white',
                                  padding:'4px 8px',
                                  borderRadius:4,
                                  fontWeight:'bold'
                                }}>
                                  ⭐ LÍDER
                                </span>
                              )}
                            </div>
                          ) : (
                            <span style={{color:'#adb5bd',fontSize:14}}>Sin comunidad</span>
                          )}
                          <div style={{marginTop:8}}>
                            <select 
                              value={userCommunity?.id || ''} 
                              onChange={e => assignUserToCommunity(u.id, e.target.value, u.role === 'admin')}
                              style={{
                                padding:'6px 10px',
                                fontSize:13,
                                borderRadius:6,
                                border:'2px solid #e1e8ed'
                              }}
                            >
                              <option value="">-- Asignar comunidad --</option>
                              {communities.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                            {u.role === 'admin' && userCommunity && !adminOfCommunity && (
                              <button 
                                onClick={() => setAsAdminOfCommunity(u.id, userCommunity.id)}
                                style={{
                                  marginLeft:8,
                                  padding:'6px 12px',
                                  fontSize:12,
                                  background:'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                  color:'white',
                                  border:'none',
                                  borderRadius:6,
                                  fontWeight:600
                                }}
                              >
                                ⭐ Hacer Líder
                              </button>
                            )}
                          </div>
                        </td>
                        <td style={{padding:12}}>
                          <button 
                            onClick={() => deleteUser(u.id)} 
                            style={{
                              color:'#e74c3c',
                              background:'#fee',
                              border:'1px solid #e74c3c',
                              padding:'6px 12px',
                              borderRadius:6,
                              fontSize:12,
                              fontWeight:600
                            }}
                          >
                            🗑️ Eliminar
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'communities' && (
          <div className="fade-in" style={{display:'grid',gap:20}}>
            <h3 style={{margin:0,color:'#2c3e50',fontSize:22,fontWeight:700}}>
              🏘️ Todas las Comunidades
            </h3>
            {communities.map(c => (
              <div key={c.id} className="card" style={{
                border:'2px solid #e1e8ed',
                background:'white'
              }}>
                <div style={{display:'flex',alignItems:'start',gap:16,marginBottom:16}}>
                  <div style={{fontSize:48}}>🏘️</div>
                  <div style={{flex:1}}>
                    <h4 style={{margin:'0 0 8px 0',fontSize:20,color:'#2c3e50',fontWeight:700}}>{c.name}</h4>
                    <p style={{margin:'0 0 16px 0',color:'#7f8c8d',fontSize:15}}>{c.description}</p>
                  </div>
                </div>
                <div style={{
                  display:'grid',
                  gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',
                  gap:16,
                  padding:16,
                  background:'#f8f9fa',
                  borderRadius:8
                }}>
                  <div>
                    <div style={{fontSize:12,color:'#7f8c8d',marginBottom:4}}>📍 Dirección</div>
                    <div style={{fontWeight:600,color:'#2c3e50'}}>{c.address}</div>
                  </div>
                  <div>
                    <div style={{fontSize:12,color:'#7f8c8d',marginBottom:4}}>👨‍💼 Admin ID</div>
                    <div style={{fontWeight:600,color:'#2c3e50',fontSize:13,fontFamily:'monospace'}}>{c.adminId || 'Sin asignar'}</div>
                  </div>
                  <div>
                    <div style={{fontSize:12,color:'#7f8c8d',marginBottom:4}}>👥 Miembros</div>
                    <div style={{fontWeight:700,color:'#667eea',fontSize:18}}>{c.totalMembers || c.members?.length || 0}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
