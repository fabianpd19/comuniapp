import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../services/firebase'

export default function PostsPage(){
  const { profile, community, user } = useAuth()
  const [posts, setPosts] = useState([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('general')
  const [priority, setPriority] = useState('normal')
  const [creating, setCreating] = useState(false)

  useEffect(()=>{
    loadPosts()
  },[community])

  async function loadPosts() {
    if (!community) return
    const q = query(collection(db,'posts'), where('communityId','==',community.id))
    const snap = await getDocs(q)
    setPosts(snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)))
  }

  async function handleCreate(e){
    e.preventDefault()
    if (!profile || profile.role !== 'admin' || !title.trim()) return
    setCreating(true)
    try {
      await addDoc(collection(db,'posts'),{
        title: title.trim(),
        content: content.trim(),
        category,
        priority,
        communityId: community.id,
        createdBy: user?.uid || '',
        createdByName: profile?.displayName || profile?.email || '',
        createdAt: serverTimestamp()
      })
      setTitle('')
      setContent('')
      setCategory('general')
      setPriority('normal')
      await loadPosts()
    } catch (err) {
      console.error('Error al crear aviso:', err)
      alert('Error al crear aviso: ' + err.message)
    }
    setCreating(false)
  }

  async function handleDelete(postId) {
    if (!confirm('¿Eliminar este aviso?')) return
    try {
      await deleteDoc(doc(db, 'posts', postId))
      await loadPosts()
    } catch (err) {
      alert('Error al eliminar: ' + err.message)
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
      <div className="container" style={{maxWidth:900,paddingTop:32,paddingBottom:48}}>
        <div className="fade-in">
          <h1 style={{color:'#2c3e50',fontSize:32,margin:'0 0 8px 0',fontWeight:700}}>
            📢 Tablón de Avisos
          </h1>
          <p style={{color:'#7f8c8d',fontSize:16,margin:'0 0 32px 0'}}>
            Mantén informada a tu comunidad
          </p>
        </div>
        
        {/* Formulario solo para admin */}
        {profile && profile.role === 'admin' && (
          <div className="card fade-in" style={{background:'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',marginBottom:32,border:'2px solid #11998e'}}>
            <h3 style={{margin:'0 0 20px 0',color:'#2c3e50',fontSize:20,fontWeight:700,display:'flex',alignItems:'center',gap:8}}>
              <span>✍️</span><span>Crear nuevo aviso</span>
            </h3>
            <form onSubmit={handleCreate} style={{display:'flex',flexDirection:'column',gap:16}}>
              <div>
                <label style={{display:'block',marginBottom:8,color:'#2c3e50',fontWeight:600,fontSize:14}}>Título del aviso</label>
                <input 
                  placeholder="Ej: Reunión de vecinos este sábado" 
                  value={title} 
                  onChange={e=>setTitle(e.target.value)} 
                  required
                />
              </div>
              <div>
                <label style={{display:'block',marginBottom:8,color:'#2c3e50',fontWeight:600,fontSize:14}}>Contenido</label>
                <textarea 
                  placeholder="Escribe los detalles del aviso..." 
                  value={content} 
                  onChange={e=>setContent(e.target.value)}
                  rows={5}
                  style={{resize:'vertical'}}
                />
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                <div>
                  <label style={{display:'block',marginBottom:8,color:'#2c3e50',fontWeight:600,fontSize:14}}>Categoría</label>
                  <select value={category} onChange={e=>setCategory(e.target.value)}>
                    <option value="general">📢 General</option>
                    <option value="seguridad">🛡️ Seguridad</option>
                    <option value="mantenimiento">🔧 Mantenimiento</option>
                    <option value="eventos">🎉  Eventos</option>
                  </select>
                </div>
                <div>
                  <label style={{display:'block',marginBottom:8,color:'#2c3e50',fontWeight:600,fontSize:14}}>Prioridad</label>
                  <select value={priority} onChange={e=>setPriority(e.target.value)}>
                    <option value="normal">Normal</option>
                    <option value="urgente">⚠️ Urgente</option>
                  </select>
                </div>
              </div>
              <button 
                type="submit" 
                disabled={creating}
                style={{padding:'14px',background:'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',color:'white',fontSize:16,fontWeight:600}}
              >
                {creating ? '⏳ Publicando...' : '📢 Publicar aviso'}
              </button>
            </form>
          </div>
        )}

        {/* Lista de avisos */}
        <div className="fade-in">
          {posts.length === 0 ? (
            <div className="card" style={{textAlign:'center',padding:60}}>
              <div style={{fontSize:64,marginBottom:16}}>📢</div>
              <p style={{color:'#7f8c8d',fontSize:18,margin:0}}>No hay avisos publicados</p>
            </div>
          ) : (
            <div style={{display:'grid',gap:16}}>
              {posts.map(p=> (
                <div 
                  key={p.id} 
                  className="card"
                  style={{border: p.priority === 'urgente' ? '2px solid #e53e3e' : '1px solid #e1e8ed',background: p.priority === 'urgente' ? '#fff5f5' : 'white',position:'relative',overflow:'hidden'}}
                >
                  {p.priority === 'urgente' && (
                    <div style={{position:'absolute',top:0,right:0,background:'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',color:'white',padding:'4px 16px',borderRadius:'0 0 0 8px',fontSize:11,fontWeight:'bold',letterSpacing:'0.5px'}}>
                      ⚠️ URGENTE
                    </div>
                  )}
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'start',marginBottom:12}}>
                    <span style={{fontSize:13,color:'#7f8c8d',fontWeight:600,background:'#f8f9fa',padding:'4px 12px',borderRadius:20}}>
                      {categoryLabels[p.category] || p.category}
                    </span>
                    {profile?.role === 'admin' && (
                      <button 
                        onClick={() => handleDelete(p.id)}
                        style={{color:'#e74c3c',background:'#fee',border:'1px solid #e74c3c',padding:'6px 12px',borderRadius:6,fontSize:12,fontWeight:600}}
                      >
                        🗑️ Eliminar
                      </button>
                    )}
                  </div>
                  <h3 style={{margin:'0 0 12px 0',color:'#2c3e50',fontSize:20,fontWeight:700}}>{p.title}</h3>
                  {p.content && (
                    <p style={{margin:'0 0 16px 0',color:'#495057',fontSize:15,lineHeight:1.6,whiteSpace:'pre-wrap'}}>{p.content}</p>
                  )}
                  <div style={{fontSize:13,color:'#adb5bd',paddingTop:12,borderTop:'1px solid #f1f3f5',display:'flex',alignItems:'center',gap:12}}>
                    <span>👤 {p.createdByName || 'Admin'}</span>
                    <span>•</span>
                    <span>📅 {p.createdAt?.toDate ? p.createdAt.toDate().toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'}) : 'Reciente'}</span>
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
