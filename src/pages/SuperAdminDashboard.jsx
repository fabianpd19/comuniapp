import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc, addDoc, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db } from '../services/firebase'

export default function SuperAdminDashboard() {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [communities, setCommunities] = useState([])
  const [activeTab, setActiveTab] = useState('users')
  
  // Estados para cambios pendientes
  const [pendingChanges, setPendingChanges] = useState({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  
  // Modal para crear/editar comunidad
  const [showCommunityModal, setShowCommunityModal] = useState(false)
  const [editingCommunity, setEditingCommunity] = useState(null)
  const [communityForm, setCommunityForm] = useState({
    name: '',
    description: '',
    address: ''
  })

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

  // Marcar cambio pendiente para un usuario
  function markUserChange(uid, field, value) {
    setPendingChanges(prev => ({
      ...prev,
      [uid]: {
        ...prev[uid],
        [field]: value
      }
    }))
  }

  // Obtener valor actual (pendiente o guardado)
  function getUserValue(user, field) {
    if (pendingChanges[user.id]?.[field] !== undefined) {
      return pendingChanges[user.id][field]
    }
    if (field === 'communityId') {
      return getUserCommunity(user.id)?.id || ''
    }
    return user[field]
  }

  // Verificar si hay cambios pendientes
  function hasChanges() {
    return Object.keys(pendingChanges).length > 0
  }

  // Guardar todos los cambios
  async function saveAllChanges() {
    if (!hasChanges()) return
    
    setSaving(true)
    setMessage(null)
    
    try {
      for (const [uid, changes] of Object.entries(pendingChanges)) {
        const user = users.find(u => u.id === uid)
        
        // Cambio de rol
        if (changes.role !== undefined) {
          await updateDoc(doc(db, 'users', uid), { 
            role: changes.role, 
            updatedAt: serverTimestamp() 
          })
        }
        
        // Cambio de comunidad
        if (changes.communityId !== undefined) {
          const currentCommunity = getUserCommunity(uid)
          const newCommunityId = changes.communityId
          
          // Remover de comunidad actual
          if (currentCommunity && currentCommunity.id !== newCommunityId) {
            await updateDoc(doc(db, 'communities', currentCommunity.id), {
              members: arrayRemove(uid),
              updatedAt: serverTimestamp()
            })
            if (currentCommunity.adminId === uid) {
              await updateDoc(doc(db, 'communities', currentCommunity.id), {
                adminId: '',
                updatedAt: serverTimestamp()
              })
            }
          }
          
          // Agregar a nueva comunidad
          if (newCommunityId) {
            await updateDoc(doc(db, 'communities', newCommunityId), {
              members: arrayUnion(uid),
              updatedAt: serverTimestamp()
            })
            
            // Eliminar solicitud pendiente si existe
            try {
              await deleteDoc(doc(db, 'communities', newCommunityId, 'requests', uid))
            } catch (e) {}
            
            // Si era pending, cambiar a resident
            if (user?.role === 'pending' && !changes.role) {
              await updateDoc(doc(db, 'users', uid), { 
                role: 'resident', 
                updatedAt: serverTimestamp() 
              })
            }
          }
        }
        
        // Hacer líder
        if (changes.makeLeader) {
          const communityId = changes.communityId || getUserCommunity(uid)?.id
          if (communityId) {
            await updateDoc(doc(db, 'communities', communityId), {
              adminId: uid,
              updatedAt: serverTimestamp()
            })
            await updateDoc(doc(db, 'users', uid), { 
              role: 'admin', 
              updatedAt: serverTimestamp() 
            })
          }
        }
      }
      
      setPendingChanges({})
      setMessage({ type: 'success', text: '✅ Cambios guardados correctamente' })
      await loadData()
    } catch (err) {
      console.error('Error guardando:', err)
      setMessage({ type: 'error', text: '❌ Error al guardar: ' + err.message })
    } finally {
      setSaving(false)
    }
  }

  // Descartar cambios
  function discardChanges() {
    setPendingChanges({})
    setMessage(null)
  }

  async function deleteUser(uid) {
    if (!confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) return
    await deleteDoc(doc(db, 'users', uid))
    loadData()
  }

  // === COMUNIDADES ===
  
  function openCreateCommunity() {
    setEditingCommunity(null)
    setCommunityForm({ name: '', description: '', address: '' })
    setShowCommunityModal(true)
  }

  function openEditCommunity(community) {
    setEditingCommunity(community)
    setCommunityForm({
      name: community.name || '',
      description: community.description || '',
      address: community.address || ''
    })
    setShowCommunityModal(true)
  }

  async function saveCommunity() {
    if (!communityForm.name.trim()) {
      alert('El nombre es requerido')
      return
    }

    setSaving(true)
    try {
      if (editingCommunity) {
        // Editar existente
        await updateDoc(doc(db, 'communities', editingCommunity.id), {
          name: communityForm.name.trim(),
          description: communityForm.description.trim(),
          address: communityForm.address.trim(),
          updatedAt: serverTimestamp()
        })
        setMessage({ type: 'success', text: '✅ Comunidad actualizada' })
      } else {
        // Crear nueva
        await addDoc(collection(db, 'communities'), {
          name: communityForm.name.trim(),
          description: communityForm.description.trim(),
          address: communityForm.address.trim(),
          adminId: '',
          members: [],
          totalMembers: 0,
          isPremium: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
        setMessage({ type: 'success', text: '✅ Comunidad creada' })
      }
      
      setShowCommunityModal(false)
      await loadData()
    } catch (err) {
      console.error('Error:', err)
      setMessage({ type: 'error', text: '❌ Error: ' + err.message })
    } finally {
      setSaving(false)
    }
  }

  async function deleteCommunity(communityId) {
    const community = communities.find(c => c.id === communityId)
    if (community?.members?.length > 0) {
      alert('No puedes eliminar una comunidad con miembros. Primero reasigna o elimina los usuarios.')
      return
    }
    if (!confirm(`¿Eliminar la comunidad "${community?.name}"? Esta acción no se puede deshacer.`)) return
    
    try {
      await deleteDoc(doc(db, 'communities', communityId))
      setMessage({ type: 'success', text: '✅ Comunidad eliminada' })
      await loadData()
    } catch (err) {
      setMessage({ type: 'error', text: '❌ Error: ' + err.message })
    }
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
            fontWeight:600,
            cursor:'pointer'
          }}
        >
          🚪 Salir
        </button>
      </nav>

      <div style={{maxWidth:1200,margin:'0 auto',padding:'32px 24px'}}>
        <div>
          <h1 style={{color:'#2c3e50',fontSize:32,margin:'0 0 8px 0',fontWeight:700}}>
            👑 Panel de Super Administrador
          </h1>
          <p style={{color:'#7f8c8d',fontSize:16,margin:'0 0 24px 0'}}>
            Control total del sistema
          </p>
        </div>

        {/* Mensaje de estado */}
        {message && (
          <div style={{
            padding:'12px 20px',
            marginBottom:20,
            borderRadius:8,
            background: message.type === 'success' ? '#d4edda' : '#f8d7da',
            color: message.type === 'success' ? '#155724' : '#721c24',
            border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
          }}>
            {message.text}
          </div>
        )}

        {/* Barra de cambios pendientes */}
        {hasChanges() && (
          <div style={{
            position:'sticky',
            top:0,
            zIndex:100,
            background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color:'white',
            padding:'16px 24px',
            borderRadius:12,
            marginBottom:24,
            display:'flex',
            alignItems:'center',
            justifyContent:'space-between',
            boxShadow:'0 4px 12px rgba(102, 126, 234, 0.4)'
          }}>
            <div>
              <strong>⚠️ Tienes cambios sin guardar</strong>
              <span style={{marginLeft:12,opacity:0.9}}>
                ({Object.keys(pendingChanges).length} usuario{Object.keys(pendingChanges).length > 1 ? 's' : ''} modificado{Object.keys(pendingChanges).length > 1 ? 's' : ''})
              </span>
            </div>
            <div style={{display:'flex',gap:12}}>
              <button
                onClick={discardChanges}
                style={{
                  padding:'10px 20px',
                  background:'rgba(255,255,255,0.2)',
                  color:'white',
                  border:'1px solid rgba(255,255,255,0.3)',
                  borderRadius:6,
                  fontWeight:600,
                  cursor:'pointer'
                }}
              >
                ✕ Descartar
              </button>
              <button
                onClick={saveAllChanges}
                disabled={saving}
                style={{
                  padding:'10px 24px',
                  background:'white',
                  color:'#667eea',
                  border:'none',
                  borderRadius:6,
                  fontWeight:700,
                  cursor: saving ? 'wait' : 'pointer'
                }}
              >
                {saving ? '⏳ Guardando...' : '💾 Guardar Cambios'}
              </button>
            </div>
          </div>
        )}
        
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
              fontSize:15,
              cursor:'pointer'
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
              fontSize:15,
              cursor:'pointer'
            }}
          >
            🏘️ Comunidades ({communities.length})
          </button>
        </div>

        {activeTab === 'users' && (
          <div style={{background:'white',borderRadius:12,padding:24,boxShadow:'0 2px 8px rgba(0,0,0,0.05)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
              <h3 style={{margin:0,color:'#2c3e50',fontSize:22,fontWeight:700}}>
                👥 Gestión de Usuarios
              </h3>
              <div style={{display:'flex',gap:12}}>
                {hasChanges() && (
                  <button
                    onClick={discardChanges}
                    style={{
                      padding:'10px 20px',
                      background:'#f8f9fa',
                      color:'#e74c3c',
                      border:'2px solid #e74c3c',
                      borderRadius:8,
                      fontWeight:600,
                      cursor:'pointer'
                    }}
                  >
                    ✕ Descartar ({Object.keys(pendingChanges).length})
                  </button>
                )}
                <button
                  onClick={saveAllChanges}
                  disabled={!hasChanges() || saving}
                  style={{
                    padding:'10px 24px',
                    background: hasChanges() 
                      ? 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)' 
                      : '#e1e8ed',
                    color: hasChanges() ? 'white' : '#95a5a6',
                    border:'none',
                    borderRadius:8,
                    fontWeight:700,
                    cursor: hasChanges() && !saving ? 'pointer' : 'not-allowed',
                    display:'flex',
                    alignItems:'center',
                    gap:8
                  }}
                >
                  {saving ? '⏳ Guardando...' : '💾 Guardar Cambios'}
                </button>
              </div>
            </div>
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
                    const hasUserChanges = pendingChanges[u.id]
                    const currentRole = getUserValue(u, 'role')
                    const currentCommunityId = getUserValue(u, 'communityId')
                    
                    return (
                      <tr 
                        key={u.id} 
                        style={{
                          borderBottom:'1px solid #f1f3f5',
                          background: hasUserChanges ? '#fff8e1' : 'transparent'
                        }}
                      >
                        <td style={{padding:12}}>
                          <div style={{fontWeight:600,color:'#2c3e50'}}>
                            {u.displayName || '-'}
                            {hasUserChanges && <span style={{marginLeft:8,color:'#f39c12'}}>●</span>}
                          </div>
                          {u.apartment && <span style={{color:'#7f8c8d',fontSize:12}}>🏠 Apt: {u.apartment}</span>}
                        </td>
                        <td style={{padding:12,color:'#495057'}}>{u.email}</td>
                        <td style={{padding:12}}>
                          <select 
                            value={currentRole || 'pending'} 
                            onChange={e => markUserChange(u.id, 'role', e.target.value)}
                            style={{
                              padding:'8px 12px',
                              borderRadius:6,
                              border: hasUserChanges?.role ? '2px solid #f39c12' : '2px solid #e1e8ed',
                              fontSize:14,
                              fontWeight:600,
                              background: hasUserChanges?.role ? '#fff8e1' : 'white'
                            }}
                          >
                            <option value="pending">⏳ Pendiente</option>
                            <option value="resident">👤 Vecino</option>
                            <option value="admin">👨‍💼 Administrador</option>
                            <option value="superadmin">👑 Super Admin</option>
                          </select>
                        </td>
                        <td style={{padding:12}}>
                          {userCommunity && !hasUserChanges?.communityId ? (
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
                            <span style={{color:'#adb5bd',fontSize:14}}>
                              {hasUserChanges?.communityId ? communities.find(c => c.id === hasUserChanges.communityId)?.name || 'Sin comunidad' : 'Sin comunidad'}
                            </span>
                          )}
                          <div style={{marginTop:8,display:'flex',gap:8,flexWrap:'wrap'}}>
                            <select 
                              value={currentCommunityId} 
                              onChange={e => markUserChange(u.id, 'communityId', e.target.value)}
                              style={{
                                padding:'6px 10px',
                                fontSize:13,
                                borderRadius:6,
                                border: hasUserChanges?.communityId ? '2px solid #f39c12' : '2px solid #e1e8ed',
                                background: hasUserChanges?.communityId ? '#fff8e1' : 'white'
                              }}
                            >
                              <option value="">-- Sin comunidad --</option>
                              {communities.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                            {(currentRole === 'admin' || hasUserChanges?.role === 'admin') && 
                             currentCommunityId && 
                             !adminOfCommunity && (
                              <button 
                                onClick={() => markUserChange(u.id, 'makeLeader', true)}
                                disabled={hasUserChanges?.makeLeader}
                                style={{
                                  padding:'6px 12px',
                                  fontSize:12,
                                  background: hasUserChanges?.makeLeader 
                                    ? '#95a5a6' 
                                    : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                  color:'white',
                                  border:'none',
                                  borderRadius:6,
                                  fontWeight:600,
                                  cursor: hasUserChanges?.makeLeader ? 'default' : 'pointer'
                                }}
                              >
                                {hasUserChanges?.makeLeader ? '✓ Será líder' : '⭐ Hacer Líder'}
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
                              fontWeight:600,
                              cursor:'pointer'
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
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
              <h3 style={{margin:0,color:'#2c3e50',fontSize:22,fontWeight:700}}>
                🏘️ Todas las Comunidades
              </h3>
              <button
                onClick={openCreateCommunity}
                style={{
                  padding:'12px 24px',
                  background:'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
                  color:'white',
                  border:'none',
                  borderRadius:8,
                  fontWeight:600,
                  fontSize:15,
                  cursor:'pointer',
                  display:'flex',
                  alignItems:'center',
                  gap:8
                }}
              >
                ➕ Nueva Comunidad
              </button>
            </div>

            <div style={{display:'grid',gap:20}}>
              {communities.length === 0 ? (
                <div style={{
                  background:'white',
                  borderRadius:12,
                  padding:48,
                  textAlign:'center',
                  color:'#7f8c8d'
                }}>
                  <div style={{fontSize:48,marginBottom:16}}>🏘️</div>
                  <p>No hay comunidades creadas</p>
                  <button
                    onClick={openCreateCommunity}
                    style={{
                      marginTop:16,
                      padding:'12px 24px',
                      background:'#3498db',
                      color:'white',
                      border:'none',
                      borderRadius:8,
                      cursor:'pointer'
                    }}
                  >
                    Crear primera comunidad
                  </button>
                </div>
              ) : (
                communities.map(c => {
                  const communityAdmin = users.find(u => u.id === c.adminId)
                  return (
                    <div key={c.id} style={{
                      background:'white',
                      borderRadius:12,
                      padding:24,
                      boxShadow:'0 2px 8px rgba(0,0,0,0.05)',
                      border:'2px solid #e1e8ed'
                    }}>
                      <div style={{display:'flex',alignItems:'start',gap:16,marginBottom:16}}>
                        <div style={{fontSize:48}}>🏘️</div>
                        <div style={{flex:1}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'start'}}>
                            <div>
                              <h4 style={{margin:'0 0 8px 0',fontSize:20,color:'#2c3e50',fontWeight:700}}>
                                {c.name}
                                {c.isPremium && (
                                  <span style={{
                                    marginLeft:12,
                                    fontSize:12,
                                    background:'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
                                    color:'white',
                                    padding:'4px 12px',
                                    borderRadius:20
                                  }}>
                                    ⭐ PREMIUM
                                  </span>
                                )}
                              </h4>
                              <p style={{margin:'0 0 8px 0',color:'#7f8c8d',fontSize:15}}>{c.description || 'Sin descripción'}</p>
                            </div>
                            <div style={{display:'flex',gap:8}}>
                              <button
                                onClick={() => openEditCommunity(c)}
                                style={{
                                  padding:'8px 16px',
                                  background:'#3498db',
                                  color:'white',
                                  border:'none',
                                  borderRadius:6,
                                  fontSize:13,
                                  fontWeight:600,
                                  cursor:'pointer'
                                }}
                              >
                                ✏️ Editar
                              </button>
                              <button
                                onClick={() => deleteCommunity(c.id)}
                                style={{
                                  padding:'8px 16px',
                                  background:'#fee',
                                  color:'#e74c3c',
                                  border:'1px solid #e74c3c',
                                  borderRadius:6,
                                  fontSize:13,
                                  fontWeight:600,
                                  cursor:'pointer'
                                }}
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div style={{
                        display:'grid',
                        gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))',
                        gap:16,
                        padding:16,
                        background:'#f8f9fa',
                        borderRadius:8
                      }}>
                        <div>
                          <div style={{fontSize:12,color:'#7f8c8d',marginBottom:4}}>📍 Dirección</div>
                          <div style={{fontWeight:600,color:'#2c3e50'}}>{c.address || 'No especificada'}</div>
                        </div>
                        <div>
                          <div style={{fontSize:12,color:'#7f8c8d',marginBottom:4}}>👨‍💼 Líder</div>
                          <div style={{fontWeight:600,color:'#2c3e50'}}>
                            {communityAdmin ? communityAdmin.displayName || communityAdmin.email : 'Sin asignar'}
                          </div>
                        </div>
                        <div>
                          <div style={{fontSize:12,color:'#7f8c8d',marginBottom:4}}>👥 Miembros</div>
                          <div style={{fontWeight:700,color:'#667eea',fontSize:18}}>
                            {c.members?.length || 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Crear/Editar Comunidad */}
      {showCommunityModal && (
        <div style={{
          position:'fixed',
          top:0,
          left:0,
          right:0,
          bottom:0,
          background:'rgba(0,0,0,0.5)',
          display:'flex',
          alignItems:'center',
          justifyContent:'center',
          zIndex:1000
        }}>
          <div style={{
            background:'white',
            borderRadius:16,
            padding:32,
            width:'100%',
            maxWidth:500,
            margin:20
          }}>
            <h3 style={{margin:'0 0 24px 0',color:'#2c3e50'}}>
              {editingCommunity ? '✏️ Editar Comunidad' : '➕ Nueva Comunidad'}
            </h3>
            
            <div style={{marginBottom:20}}>
              <label style={{display:'block',marginBottom:8,fontWeight:600,color:'#2c3e50'}}>
                Nombre *
              </label>
              <input
                type="text"
                value={communityForm.name}
                onChange={e => setCommunityForm({...communityForm, name: e.target.value})}
                placeholder="Ej: Residencial Los Pinos"
                style={{
                  width:'100%',
                  padding:'12px 16px',
                  border:'2px solid #e1e8ed',
                  borderRadius:8,
                  fontSize:15
                }}
              />
            </div>
            
            <div style={{marginBottom:20}}>
              <label style={{display:'block',marginBottom:8,fontWeight:600,color:'#2c3e50'}}>
                Descripción
              </label>
              <textarea
                value={communityForm.description}
                onChange={e => setCommunityForm({...communityForm, description: e.target.value})}
                placeholder="Descripción de la comunidad..."
                rows={3}
                style={{
                  width:'100%',
                  padding:'12px 16px',
                  border:'2px solid #e1e8ed',
                  borderRadius:8,
                  fontSize:15,
                  resize:'vertical'
                }}
              />
            </div>
            
            <div style={{marginBottom:24}}>
              <label style={{display:'block',marginBottom:8,fontWeight:600,color:'#2c3e50'}}>
                Dirección
              </label>
              <input
                type="text"
                value={communityForm.address}
                onChange={e => setCommunityForm({...communityForm, address: e.target.value})}
                placeholder="Ej: Av. Principal #123"
                style={{
                  width:'100%',
                  padding:'12px 16px',
                  border:'2px solid #e1e8ed',
                  borderRadius:8,
                  fontSize:15
                }}
              />
            </div>
            
            <div style={{display:'flex',gap:12,justifyContent:'flex-end'}}>
              <button
                onClick={() => setShowCommunityModal(false)}
                style={{
                  padding:'12px 24px',
                  background:'#f8f9fa',
                  color:'#2c3e50',
                  border:'2px solid #e1e8ed',
                  borderRadius:8,
                  fontWeight:600,
                  cursor:'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={saveCommunity}
                disabled={saving}
                style={{
                  padding:'12px 24px',
                  background:'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
                  color:'white',
                  border:'none',
                  borderRadius:8,
                  fontWeight:600,
                  cursor: saving ? 'wait' : 'pointer'
                }}
              >
                {saving ? '⏳ Guardando...' : (editingCommunity ? '💾 Guardar Cambios' : '➕ Crear Comunidad')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
