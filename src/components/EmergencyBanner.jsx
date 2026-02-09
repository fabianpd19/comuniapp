import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { collection, query, where, onSnapshot, updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../services/firebase'

export default function EmergencyBanner() {
  const { user, profile, community } = useAuth()
  const [emergencies, setEmergencies] = useState([])
  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin'

  useEffect(() => {
    if (!community) return

    // Escuchar emergencias activas en tiempo real
    const emergencyQuery = query(
      collection(db, 'emergencies'),
      where('communityId', '==', community.id),
      where('active', '==', true)
    )

    const unsubscribe = onSnapshot(emergencyQuery, (snapshot) => {
      const active = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      setEmergencies(active)
    }, (error) => {
      console.error('Error escuchando emergencias:', error)
    })

    return () => unsubscribe()
  }, [community])

  async function resolveEmergency(emergencyId) {
    if (!confirm('¿Marcar esta emergencia como resuelta?')) return

    try {
      await updateDoc(doc(db, 'emergencies', emergencyId), {
        active: false,
        resolvedAt: serverTimestamp(),
        resolvedBy: user.uid
      })
    } catch (err) {
      console.error('Error resolviendo emergencia:', err)
      alert('Error al resolver emergencia')
    }
  }

  function formatTime(timestamp) {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  }

  if (emergencies.length === 0) return null

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
      {emergencies.map(em => (
        <div 
          key={em.id}
          style={{
            background: 'linear-gradient(90deg, #c0392b 0%, #e74c3c 50%, #c0392b 100%)',
            color: 'white',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            animation: 'blink 1s infinite',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24, animation: 'shake 0.5s infinite' }}>🚨</span>
            <div>
              <strong style={{ fontSize: 16 }}>¡EMERGENCIA ACTIVA!</strong>
              <div style={{ fontSize: 13, opacity: 0.9 }}>
                Activada por {em.activatedByName} a las {formatTime(em.createdAt)}
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <a 
              href={`/${profile?.role === 'admin' ? 'admin' : 'resident'}/chat`}
              style={{ 
                background: 'white', 
                color: '#c0392b', 
                padding: '8px 16px', 
                borderRadius: 4, 
                textDecoration: 'none',
                fontWeight: 'bold',
                fontSize: 14
              }}
            >
              Ver Chat
            </a>
            {isAdmin && (
              <button
                onClick={() => resolveEmergency(em.id)}
                style={{
                  background: '#27ae60',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: 14
                }}
              >
                ✓ Resolver
              </button>
            )}
          </div>
        </div>
      ))}

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.9; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }
      `}</style>
    </div>
  )
}
