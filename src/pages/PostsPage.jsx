import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
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
    <div>
      <Navbar />
      <div style={{padding:20,maxWidth:800,margin:'0 auto'}}>
        <h2>Tablón de Avisos</h2>
        
        {/* Formulario solo para admin */}
        {profile && profile.role === 'admin' && (
          <form onSubmit={handleCreate} style={{background:'#f8f9fa',padding:16,borderRadius:8,marginBottom:24}}>
            <h4 style={{margin:'0 0 12px 0'}}>Crear nuevo aviso</h4>
            <div style={{display:'grid',gap:12}}>
              <input 
                placeholder="Título del aviso" 
                value={title} 
                onChange={e=>setTitle(e.target.value)} 
                required
                style={{padding:10,fontSize:16,border:'1px solid #ddd',borderRadius:4}}
              />
              <textarea 
                placeholder="Contenido del aviso..." 
                value={content} 
                onChange={e=>setContent(e.target.value)}
                rows={4}
                style={{padding:10,fontSize:14,border:'1px solid #ddd',borderRadius:4}}
              />
              <div style={{display:'flex',gap:12}}>
                <select value={category} onChange={e=>setCategory(e.target.value)} style={{padding:8,flex:1}}>
                  <option value="general">📢 General</option>
                  <option value="seguridad">🛡️ Seguridad</option>
                  <option value="mantenimiento">🔧 Mantenimiento</option>
                  <option value="eventos">🎉 Eventos</option>
                </select>
                <select value={priority} onChange={e=>setPriority(e.target.value)} style={{padding:8,flex:1}}>
                  <option value="normal">Prioridad Normal</option>
                  <option value="urgente">⚠️ Urgente</option>
                </select>
              </div>
              <button 
                type="submit" 
                disabled={creating}
                style={{padding:12,background:'#27ae60',color:'white',border:'none',borderRadius:4,fontSize:16,cursor:'pointer'}}
              >
                {creating ? 'Publicando...' : 'Publicar aviso'}
              </button>
            </div>
          </form>
        )}

        {/* Lista de avisos */}
        <div>
          {posts.length === 0 ? (
            <p style={{color:'#666',textAlign:'center',padding:40}}>No hay avisos publicados.</p>
          ) : (
            posts.map(p=> (
              <div 
                key={p.id} 
                style={{
                  border: p.priority === 'urgente' ? '2px solid #e74c3c' : '1px solid #ddd',
                  background: p.priority === 'urgente' ? '#fdf2f2' : 'white',
                  padding:16,
                  marginBottom:12,
                  borderRadius:8
                }}
              >
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <div>
                    <span style={{fontSize:12,color:'#666'}}>{categoryLabels[p.category] || p.category}</span>
                    {p.priority === 'urgente' && <span style={{marginLeft:8,background:'#e74c3c',color:'white',padding:'2px 8px',borderRadius:4,fontSize:11}}>URGENTE</span>}
                  </div>
                  {profile?.role === 'admin' && (
                    <button 
                      onClick={() => handleDelete(p.id)}
                      style={{color:'#e74c3c',background:'none',border:'none',cursor:'pointer',fontSize:12}}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
                <h3 style={{margin:'8px 0'}}>{p.title}</h3>
                <p style={{margin:'8px 0',color:'#333',whiteSpace:'pre-wrap'}}>{p.content}</p>
                <div style={{fontSize:12,color:'#999',marginTop:12}}>
                  Por {p.createdByName || 'Admin'} • {p.createdAt?.toDate ? p.createdAt.toDate().toLocaleDateString('es-ES') : 'Reciente'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
