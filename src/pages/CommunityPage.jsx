import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
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
    <div>
      <Navbar />
      <div style={{padding:20}}>
        <h2>Comunidad</h2>
        {community ? (
          <div>
            <div style={{background:'#f8f9fa',padding:16,borderRadius:8,marginBottom:20}}>
              <h3 style={{margin:'0 0 8px 0'}}>{community.name}</h3>
              <p style={{margin:'4px 0',color:'#666'}}>{community.description}</p>
              <p style={{margin:'4px 0'}}><strong>Dirección:</strong> {community.address}</p>
              {/* Debug info - can remove later */}
              {profile && (profile.role === 'admin' || profile.role === 'superadmin') && (
                <div style={{marginTop:8,padding:8,background:'#e3f2fd',borderRadius:4,fontSize:11}}>
                  <strong>Info Admin:</strong> 
                  {' '}Eres líder: {community.adminId === user?.uid ? 'Sí' : 'No'} |
                  {' '}Estás en members: {community.members?.includes(user?.uid) ? 'Sí' : 'No'} |
                  {' '}Community ID: {community.id}
                </div>
              )}
              <p style={{margin:'4px 0'}}><strong>Total miembros:</strong> {community.totalMembers || community.members?.length || 0}</p>
            </div>

            {/* Members list */}
            <h4>Miembros ({membersData.length})</h4>
            <div style={{display:'grid',gap:8,marginBottom:20}}>
              {membersData.map(m => (
                <div key={m.id} style={{display:'flex',alignItems:'center',gap:12,padding:8,background:'#fff',border:'1px solid #ddd',borderRadius:4}}>
                  <div style={{flex:1}}>
                    <strong>{m.displayName || 'Sin nombre'}</strong>
                    <span style={{color:'#666',marginLeft:8}}>{m.email}</span>
                  </div>
                  <span style={{padding:'2px 8px',background:m.role==='admin'?'#3498db':'#27ae60',color:'white',borderRadius:4,fontSize:12}}>
                    {m.role === 'admin' ? 'Administrador' : m.role === 'resident' ? 'Vecino' : m.role === 'superadmin' ? 'Super Admin' : 'Pendiente'}
                  </span>
                  {m.apartment && <span style={{color:'#666',fontSize:12}}>Apt: {m.apartment}</span>}
                </div>
              ))}
            </div>

            {/* Pending requests - visible to admin and superadmin */}
            {profile && (profile.role === 'admin' || profile.role === 'superadmin') && (
              <div style={{marginTop:24}}>
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
                  <h4 style={{margin:0}}>Solicitudes pendientes ({requests.length})</h4>
                  <button 
                    onClick={loadRequests}
                    disabled={loadingRequests}
                    style={{padding:'4px 12px',fontSize:12,background:'#3498db',color:'white',border:'none',borderRadius:4,cursor:'pointer'}}
                  >
                    {loadingRequests ? 'Cargando...' : 'Refrescar'}
                  </button>
                </div>
                {requests.length === 0 ? (
                  <p style={{color:'#666'}}>No hay solicitudes pendientes.</p>
                ) : (
                  <div style={{display:'grid',gap:8}}>
                    {requests.map(r => (
                      <div key={r.id} style={{display:'flex',alignItems:'center',gap:12,padding:12,background:'#fff3cd',border:'1px solid #ffc107',borderRadius:4}}>
                        <div style={{flex:1}}>
                          <strong>{r.displayName || 'Sin nombre'}</strong>
                          <span style={{color:'#666',marginLeft:8}}>{r.email}</span>
                          {r.apartment && <span style={{color:'#666',marginLeft:8}}>Apt: {r.apartment}</span>}
                        </div>
                        <button 
                          onClick={() => approveRequest(r.uid, r.id)}
                          style={{padding:'6px 12px',background:'#27ae60',color:'white',border:'none',borderRadius:4,cursor:'pointer'}}
                        >
                          Aprobar
                        </button>
                        <button 
                          onClick={() => rejectRequest(r.id)}
                          style={{padding:'6px 12px',background:'#e74c3c',color:'white',border:'none',borderRadius:4,cursor:'pointer'}}
                        >
                          Rechazar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <p>No hay comunidad asignada.</p>
        )}
      </div>
    </div>
  )
}
