import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { addDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore'
import { db } from '../services/firebase'

export default function EmergencyButton() {
  const { user, profile, community } = useAuth()
  const [showConfirm, setShowConfirm] = useState(false)
  const [sending, setSending] = useState(false)

  // No mostrar si no hay comunidad o perfil
  if (!community || !profile || profile.role === 'pending') return null

  async function handleEmergency() {
    if (!confirm('⚠️ ¿ACTIVAR EMERGENCIA?\n\nEsto alertará a TODOS los vecinos de tu comunidad.\n\nSolo usa esto en emergencias reales.')) {
      return
    }

    setSending(true)
    try {
      // 1. Crear documento de emergencia
      await addDoc(collection(db, 'emergencies'), {
        communityId: community.id,
        activatedBy: user.uid,
        activatedByName: profile.displayName || 'Usuario',
        active: true,
        createdAt: serverTimestamp(),
        resolvedAt: null,
        resolvedBy: null
      })

      // 2. Buscar el chat de la comunidad para enviar mensaje
      const chatsQuery = query(
        collection(db, 'chats'),
        where('communityId', '==', community.id)
      )
      const chatsSnap = await getDocs(chatsQuery)

      if (!chatsSnap.empty) {
        const chatId = chatsSnap.docs[0].id
        // 3. Enviar mensaje de emergencia al chat
        await addDoc(collection(db, 'messages'), {
          chatId: chatId,
          senderId: user.uid,
          senderName: profile.displayName || 'Usuario',
          message: `🚨 EMERGENCIA ACTIVADA por ${profile.displayName || 'un vecino'}. ¡Necesito ayuda urgente!`,
          createdAt: serverTimestamp(),
          isEmergency: true
        })
      }

      alert('✅ Emergencia activada. Todos los vecinos han sido notificados.')
    } catch (err) {
      console.error('Error activando emergencia:', err)
      alert('Error al activar emergencia: ' + err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={handleEmergency}
        disabled={sending}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: sending ? '#999' : 'linear-gradient(135deg, #c0392b 0%, #e74c3c 100%)',
          border: 'none',
          boxShadow: '0 4px 12px rgba(192, 57, 43, 0.4)',
          cursor: sending ? 'wait' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
          color: 'white',
          zIndex: 1000,
          transition: 'transform 0.2s, box-shadow 0.2s',
          animation: 'pulse 2s infinite'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.1)'
          e.target.style.boxShadow = '0 6px 16px rgba(192, 57, 43, 0.6)'
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)'
          e.target.style.boxShadow = '0 4px 12px rgba(192, 57, 43, 0.4)'
        }}
        title="Botón de Emergencia"
      >
        🆘
      </button>

      {/* Estilos de animación */}
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 4px 12px rgba(192, 57, 43, 0.4); }
          50% { box-shadow: 0 4px 20px rgba(192, 57, 43, 0.7); }
          100% { box-shadow: 0 4px 12px rgba(192, 57, 43, 0.4); }
        }
      `}</style>
    </>
  )
}
