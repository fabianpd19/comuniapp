import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { doc, getDoc, collection, getDocs, updateDoc, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../services/firebase'
import { arrayUnion, increment } from 'firebase/firestore'

export default function CommunityPage(){
  const { community, user, profile } = useAuth()
  const [membersData, setMembersData] = useState([])
  const [requests, setRequests] = useState([])
  const [requestStatus, setRequestStatus] = useState(null)
  const [loadingRequests, setLoadingRequests] = useState(false)

  useEffect(()=>{
    async function loadMembers(){
      if (!community || !community.members) return
      const promises = community.members.map(uid => getDoc(doc(db,'users',uid)))
      const snaps = await Promise.all(promises)
      setMembersData(snaps.filter(s=>s.exists()).map(s=>({id:s.id,...s.data()})))
    }
    loadMembers()
  },[community])

  useEffect(()=>{
    loadRequests()
  },[community])

  async function loadRequests(){
    if (!community) {
      console.log('No hay comunidad asignada')
      return
    }
    setLoadingRequests(true)
    try {
      const q = collection(db, 'communities', community.id, 'requests')
      const snap = await getDocs(q)
      console.log('Solicitudes encontradas:', snap.docs.length)
      // Filter out users who are already members
      const allRequests = snap.docs.map(d=>({id:d.id,...d.data()}))
      const filteredRequests = allRequests.filter(r => !community.members?.includes(r.uid))
      console.log('Solicitudes filtradas:', filteredRequests.length)
      setRequests(filteredRequests)
    } catch (err) {
      console.error('Error cargando solicitudes:', err)
    }
    setLoadingRequests(false)
  }

  async function submitRequest(){
    if (!community || !user) return
    try{
      setRequestStatus('sending')
      const reqRef = doc(db, 'communities', community.id, 'requests', user.uid)
      await setDoc(reqRef, { uid: user.uid, displayName: profile?.displayName || '', email: profile?.email || '', createdAt: serverTimestamp() })
      setRequestStatus('sent')
      // refresh
      await loadRequests()
    } catch (err) {
      console.error(err)
      setRequestStatus('error')
    }
  }

  async function approveRequest(uid, requestId){
    if (!community) return
    try {
      // add to members array and increment totalMembers
      const communityRef = doc(db, 'communities', community.id)
      await updateDoc(communityRef, { members: arrayUnion(uid), totalMembers: increment(1), updatedAt: new Date() })
      // set user's role to resident and updatedAt
      const userRef = doc(db, 'users', uid)
      await updateDoc(userRef, { role: 'resident', updatedAt: new Date() })
      // remove request doc
      const reqRef = doc(db, 'communities', community.id, 'requests', requestId)
      await deleteDoc(reqRef)
      // refresh lists by reloading community data
      const communitySnap = await getDoc(communityRef)
      const communityData = communitySnap.exists() ? communitySnap.data() : null
      if (communityData && communityData.members) {
        const snaps = await Promise.all((communityData.members || []).map(uid => getDoc(doc(db,'users',uid))))
        setMembersData(snaps.filter(s=>s.exists()).map(s=>({id:s.id,...s.data()})))
      }
      await loadRequests()
      alert('Usuario aprobado correctamente')
    } catch (err) {
      console.error('Error al aprobar:', err)
      alert('Error al aprobar: ' + err.message)
    }
  }

  async function rejectRequest(requestId){
    if (!community) return
    try {
      const reqRef = doc(db, 'communities', community.id, 'requests', requestId)
      await deleteDoc(reqRef)
      await loadRequests()
      alert('Solicitud rechazada')
    } catch (err) {
      console.error('Error al rechazar:', err)
      alert('Error al rechazar: ' + err.message)
    }
  }

  return (
    <div style={{minHeight:'100vh',background:'#f5f7fa'}}>
      <div className="container" style={{paddingTop:32,paddingBottom:48}}>
        <div className="fade-in">
          <h1 style={{color:'#2c3e50',fontSize:32,margin:'0 0 8px 0',fontWeight:700}}>
            👥 Mi Comunidad
          </h1>
          <p style={{color:'#7f8c8d',fontSize:16,margin:'0 0 32px 0'}}>
            Miembros y solicitudes de ingreso
          </p>
        </div>
        
        {community ? (
          <div className="fade-in">
            <div className="card" style={{marginBottom:32,background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',color:'white',border:'none'}}>
              <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:16}}>
                <div style={{fontSize:48}}>🏘️</div>
                <div style={{flex:1}}>
                  <h2 style={{margin:'0 0 8px 0',fontSize:26,fontWeight:700}}>{community.name}</h2>
                  <p style={{margin:'0 0 12px 0',opacity:0.95,fontSize:15}}>{community.description}</p>
                  <p style={{margin:0,opacity:0.9,fontSize:14}}>📍 {community.address}</p>
                </div>
              </div>
              <div style={{padding:16,background:'rgba(255,255,255,0.15)',borderRadius:8,marginTop:16}}>
                <div style={{fontSize:14,opacity:0.9,marginBottom:4}}>👥 Total de miembros</div>
                <div style={{fontSize:28,fontWeight:'bold'}}>{community.totalMembers || community.members?.length || 0}</div>
              </div>
            </div>

            {/* Members list */}
            <div className="card" style={{marginBottom:32}}>
              <h3 style={{margin:'0 0 20px 0',color:'#2c3e50',fontSize:20,fontWeight:700}}>
                👥 Miembros ({membersData.length})
              </h3>
              <div style={{display:'grid',gap:12}}>
                {membersData.map(m => (
                  <div key={m.id} style={{display:'flex',alignItems:'center',gap:12,padding:16,background:'#f8f9fa',border:'1px solid #e1e8ed',borderRadius:8}}>
                    <div style={{fontSize:32}}>👤</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,color:'#2c3e50',fontSize:16}}>{m.displayName || 'Sin nombre'}</div>
                      <div style={{color:'#7f8c8d',fontSize:14}}>{m.email}</div>
                    </div>
                    {m.apartment && <span style={{color:'#7f8c8d',fontSize:13,background:'white',padding:'4px 12px',borderRadius:20}}>🏠 {m.apartment}</span>}
                    <span style={{padding:'6px 12px',background:m.role==='admin'?'linear-gradient(135deg, #667eea 0%, #764ba2 100%)':'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',color:'white',borderRadius:6,fontSize:13,fontWeight:600}}>
                      {m.role === 'admin' ? '👨‍💼 Admin' : m.role === 'resident' ? '👤 Vecino' : m.role === 'superadmin' ? '👑 SuperAdmin' : '⏳ Pendiente'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending requests - visible to admin and superadmin */}
            {profile && (profile.role === 'admin' || profile.role === 'superadmin') && (
              <div className="card">
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
                  <h3 style={{margin:0,color:'#2c3e50',fontSize:20,fontWeight:700}}>
                    ⏳ Solicitudes pendientes ({requests.length})
                  </h3>
                  <button 
                    onClick={loadRequests}
                    disabled={loadingRequests}
                    style={{padding:'8px 16px',fontSize:13,background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',color:'white',fontWeight:600}}
                  >
                    {loadingRequests ? '⏳ Cargando...' : '🔄 Refrescar'}
                  </button>
                </div>
                {requests.length === 0 ? (
                  <div style={{textAlign:'center',padding:40,background:'#f8f9fa',borderRadius:8}}>
                    <div style={{fontSize:48,marginBottom:12}}>✅</div>
                    <p style={{color:'#7f8c8d',margin:0}}>No hay solicitudes pendientes</p>
                  </div>
                ) : (
                  <div style={{display:'grid',gap:12}}>
                    {requests.map(r => (
                      <div key={r.id} style={{display:'flex',alignItems:'center',gap:12,padding:16,background:'#fffbf2',border:'2px solid #ed8936',borderRadius:8}}>
                        <div style={{fontSize:32}}>👤</div>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:700,color:'#2c3e50',fontSize:16}}>{r.displayName || 'Sin nombre'}</div>
                          <div style={{color:'#7f8c8d',fontSize:14}}>{r.email}</div>
                          {r.apartment && <div style={{color:'#7f8c8d',fontSize:13,marginTop:4}}>🏠 Apt: {r.apartment}</div>}
                        </div>
                        <div style={{display:'flex',gap:8}}>
                          <button 
                            onClick={() => approveRequest(r.uid, r.id)}
                            style={{padding:'10px 18px',background:'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',color:'white',fontWeight:600}}
                          >
                            ✅ Aprobar
                          </button>
                          <button 
                            onClick={() => rejectRequest(r.id)}
                            style={{padding:'10px 18px',background:'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',color:'white',fontWeight:600}}
                          >
                            ❌ Rechazar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="card" style={{textAlign:'center',padding:60}}>
            <div style={{fontSize:64,marginBottom:16}}>🏘️</div>
            <p style={{color:'#7f8c8d',fontSize:18,margin:0}}>No hay comunidad asignada</p>
          </div>
        )}
      </div>
    </div>
  )
}
