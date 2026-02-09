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
    <div>
      <nav style={{display:'flex',gap:12,padding:12,alignItems:'center',background:'#1a1a2e',color:'white'}}>
        <strong>ComuniApp - SuperAdmin</strong>
        <div style={{flex:1}}/>
        <span>{profile?.displayName || profile?.email}</span>
        <button onClick={logout} style={{background:'#e74c3c',color:'white',border:'none',padding:'6px 12px'}}>Salir</button>
      </nav>

      <div style={{padding:20}}>
        <h2>Panel de Super Administrador</h2>
        
        <div style={{display:'flex',gap:8,marginBottom:20}}>
          <button 
            onClick={() => setActiveTab('users')}
            style={{padding:'8px 16px',background:activeTab==='users'?'#3498db':'#eee',color:activeTab==='users'?'white':'black'}}
          >
            Usuarios ({users.length})
          </button>
          <button 
            onClick={() => setActiveTab('communities')}
            style={{padding:'8px 16px',background:activeTab==='communities'?'#3498db':'#eee',color:activeTab==='communities'?'white':'black'}}
          >
            Comunidades ({communities.length})
          </button>
        </div>

        {activeTab === 'users' && (
          <div>
            <h3>Todos los usuarios</h3>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:'#f5f5f5'}}>
                  <th style={{padding:8,textAlign:'left',border:'1px solid #ddd'}}>Nombre</th>
                  <th style={{padding:8,textAlign:'left',border:'1px solid #ddd'}}>Email</th>
                  <th style={{padding:8,textAlign:'left',border:'1px solid #ddd'}}>Rol</th>
                  <th style={{padding:8,textAlign:'left',border:'1px solid #ddd'}}>Comunidad</th>
                  <th style={{padding:8,textAlign:'left',border:'1px solid #ddd'}}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const userCommunity = getUserCommunity(u.id)
                  const adminOfCommunity = isAdminOf(u.id)
                  return (
                    <tr key={u.id}>
                      <td style={{padding:8,border:'1px solid #ddd'}}>
                        {u.displayName || '-'}
                        {u.apartment && <span style={{color:'#666',fontSize:11,display:'block'}}>Apt: {u.apartment}</span>}
                      </td>
                      <td style={{padding:8,border:'1px solid #ddd'}}>{u.email}</td>
                      <td style={{padding:8,border:'1px solid #ddd'}}>
                        <select 
                          value={u.role || 'pending'} 
                          onChange={e => changeUserRole(u.id, e.target.value)}
                          style={{padding:4}}
                        >
                          <option value="pending">Pendiente</option>
                          <option value="resident">Vecino</option>
                          <option value="admin">Administrador</option>
                          <option value="superadmin">Super Admin</option>
                        </select>
                      </td>
                      <td style={{padding:8,border:'1px solid #ddd'}}>
                        {userCommunity ? (
                          <div>
                            <span style={{fontWeight:'bold'}}>{userCommunity.name}</span>
                            {adminOfCommunity && <span style={{marginLeft:4,fontSize:10,background:'#3498db',color:'white',padding:'2px 6px',borderRadius:4}}>LÍDER</span>}
                          </div>
                        ) : (
                          <span style={{color:'#999'}}>Sin comunidad</span>
                        )}
                        <div style={{marginTop:4}}>
                          <select 
                            value={userCommunity?.id || ''} 
                            onChange={e => assignUserToCommunity(u.id, e.target.value, u.role === 'admin')}
                            style={{padding:4,fontSize:11}}
                          >
                            <option value="">-- Asignar comunidad --</option>
                            {communities.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                          {u.role === 'admin' && userCommunity && !adminOfCommunity && (
                            <button 
                              onClick={() => setAsAdminOfCommunity(u.id, userCommunity.id)}
                              style={{marginLeft:4,padding:'2px 6px',fontSize:11,background:'#3498db',color:'white',border:'none',cursor:'pointer'}}
                            >
                              Hacer Líder
                            </button>
                          )}
                        </div>
                      </td>
                      <td style={{padding:8,border:'1px solid #ddd'}}>
                        <button onClick={() => deleteUser(u.id)} style={{color:'red',background:'none',border:'none',cursor:'pointer'}}>
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'communities' && (
          <div>
            <h3>Todas las comunidades</h3>
            {communities.map(c => (
              <div key={c.id} style={{border:'1px solid #ddd',padding:16,marginBottom:12,borderRadius:4}}>
                <h4 style={{margin:'0 0 8px 0'}}>{c.name}</h4>
                <p style={{margin:'4px 0',color:'#666'}}>{c.description}</p>
                <p style={{margin:'4px 0'}}><strong>Dirección:</strong> {c.address}</p>
                <p style={{margin:'4px 0'}}><strong>Admin ID:</strong> {c.adminId}</p>
                <p style={{margin:'4px 0'}}><strong>Miembros:</strong> {c.totalMembers || c.members?.length || 0}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
