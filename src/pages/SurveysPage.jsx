import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../services/firebase'

export default function SurveysPage(){
  const { profile, community, user } = useAuth()
  const [surveys, setSurveys] = useState([])
  const [question, setQuestion] = useState('')
  const [optionsText, setOptionsText] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(()=>{
    loadSurveys()
  },[community])

  async function loadSurveys() {
    if (!community) return
    const q = query(collection(db,'surveys'), where('communityId','==',community.id))
    const snap = await getDocs(q)
    setSurveys(snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)))
  }

  async function handleCreate(e){
    e.preventDefault()
    if (!profile || profile.role !== 'admin' || !question.trim()) return
    const options = optionsText.split('\n').map(s=>s.trim()).filter(Boolean)
    if (options.length < 2) {
      alert('Debes agregar al menos 2 opciones')
      return
    }
    setCreating(true)
    try {
      await addDoc(collection(db,'surveys'),{
        question: question.trim(),
        options,
        votes: {},
        communityId: community.id,
        active: true,
        createdBy: user?.uid || '',
        createdByName: profile?.displayName || profile?.email || '',
        createdAt: serverTimestamp()
      })
      setQuestion('')
      setOptionsText('')
      await loadSurveys()
    } catch (err) {
      console.error('Error al crear encuesta:', err)
      alert('Error al crear encuesta: ' + err.message)
    }
    setCreating(false)
  }

  async function vote(surveyId, option){
    if (!user) return
    try {
      const ref = doc(db,'surveys',surveyId)
      await updateDoc(ref, {
        [`votes.${user.uid}`]: option
      })
      await loadSurveys()
    } catch (err) {
      console.error('Error al votar:', err)
      alert('Error al votar: ' + err.message)
    }
  }

  async function toggleActive(surveyId, currentActive) {
    try {
      await updateDoc(doc(db, 'surveys', surveyId), { active: !currentActive })
      await loadSurveys()
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  async function handleDelete(surveyId) {
    if (!confirm('¿Eliminar esta encuesta?')) return
    try {
      await deleteDoc(doc(db, 'surveys', surveyId))
      await loadSurveys()
    } catch (err) {
      alert('Error al eliminar: ' + err.message)
    }
  }

  function getVoteResults(survey) {
    const votes = survey.votes || {}
    const counts = {}
    survey.options.forEach(opt => counts[opt] = 0)
    Object.values(votes).forEach(opt => {
      if (counts[opt] !== undefined) counts[opt]++
    })
    const total = Object.values(counts).reduce((a, b) => a + b, 0)
    return { counts, total }
  }

  return (
    <div>
      <div style={{padding:20,maxWidth:800,margin:'0 auto'}}>
        <h2>📊 Encuestas</h2>
        
        {/* Formulario solo para admin */}
        {profile && profile.role === 'admin' && (
          <form onSubmit={handleCreate} style={{background:'#e8f4fd',padding:16,borderRadius:8,marginBottom:24,border:'1px solid #3498db'}}>
            <h4 style={{margin:'0 0 12px 0'}}>Crear nueva encuesta</h4>
            <div style={{display:'grid',gap:12}}>
              <input 
                placeholder="¿Cuál es tu pregunta?" 
                value={question} 
                onChange={e=>setQuestion(e.target.value)}
                required
                style={{padding:10,fontSize:16,border:'1px solid #ddd',borderRadius:4}}
              />
              <textarea 
                placeholder="Opciones de respuesta (una por línea)&#10;Ejemplo:&#10;Opción A&#10;Opción B&#10;Opción C" 
                value={optionsText} 
                onChange={e=>setOptionsText(e.target.value)}
                rows={4}
                required
                style={{padding:10,fontSize:14,border:'1px solid #ddd',borderRadius:4}}
              />
              <button 
                type="submit" 
                disabled={creating}
                style={{padding:12,background:'#3498db',color:'white',border:'none',borderRadius:4,fontSize:16,cursor:'pointer'}}
              >
                {creating ? 'Creando...' : 'Crear encuesta'}
              </button>
            </div>
          </form>
        )}

        {/* Lista de encuestas */}
        <div>
          {surveys.length === 0 ? (
            <p style={{color:'#666',textAlign:'center',padding:40}}>No hay encuestas activas.</p>
          ) : (
            surveys.map(s => {
              const { counts, total } = getVoteResults(s)
              const userVote = s.votes?.[user?.uid]
              
              return (
                <div 
                  key={s.id} 
                  style={{
                    border: s.active ? '1px solid #3498db' : '1px solid #ddd',
                    background: s.active ? 'white' : '#f5f5f5',
                    padding:16,
                    marginBottom:16,
                    borderRadius:8,
                    opacity: s.active ? 1 : 0.7
                  }}
                >
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                    <span style={{
                      padding:'2px 8px',
                      borderRadius:4,
                      fontSize:11,
                      background: s.active ? '#27ae60' : '#95a5a6',
                      color: 'white'
                    }}>
                      {s.active ? 'Activa' : 'Cerrada'}
                    </span>
                    {profile?.role === 'admin' && (
                      <div style={{display:'flex',gap:8}}>
                        <button 
                          onClick={() => toggleActive(s.id, s.active)}
                          style={{fontSize:11,padding:'4px 8px',cursor:'pointer'}}
                        >
                          {s.active ? 'Cerrar' : 'Reabrir'}
                        </button>
                        <button 
                          onClick={() => handleDelete(s.id)}
                          style={{fontSize:11,padding:'4px 8px',color:'#e74c3c',cursor:'pointer'}}
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <h3 style={{margin:'0 0 16px 0'}}>{s.question}</h3>
                  
                  {/* Opciones */}
                  <div style={{display:'grid',gap:8}}>
                    {s.options.map((opt, idx) => {
                      const count = counts[opt] || 0
                      const percent = total > 0 ? Math.round((count / total) * 100) : 0
                      const isSelected = userVote === opt
                      
                      return (
                        <div key={idx} style={{position:'relative'}}>
                          <button
                            onClick={() => s.active && vote(s.id, opt)}
                            disabled={!s.active}
                            style={{
                              width:'100%',
                              padding:'12px 16px',
                              textAlign:'left',
                              border: isSelected ? '2px solid #3498db' : '1px solid #ddd',
                              borderRadius:4,
                              background: isSelected ? '#e8f4fd' : 'white',
                              cursor: s.active ? 'pointer' : 'default',
                              position:'relative',
                              overflow:'hidden'
                            }}
                          >
                            {/* Barra de progreso */}
                            <div style={{
                              position:'absolute',
                              left:0,
                              top:0,
                              height:'100%',
                              width:`${percent}%`,
                              background: isSelected ? 'rgba(52,152,219,0.2)' : 'rgba(0,0,0,0.05)',
                              transition:'width 0.3s'
                            }} />
                            
                            <div style={{position:'relative',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                              <span>
                                {isSelected && '✓ '}{opt}
                              </span>
                              <span style={{color:'#666',fontSize:12}}>
                                {count} {count === 1 ? 'voto' : 'votos'} ({percent}%)
                              </span>
                            </div>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                  
                  <div style={{fontSize:12,color:'#999',marginTop:12}}>
                    Total: {total} {total === 1 ? 'voto' : 'votos'} • 
                    Por {s.createdByName || 'Admin'} • 
                    {s.createdAt?.toDate ? s.createdAt.toDate().toLocaleDateString('es-ES') : 'Reciente'}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
