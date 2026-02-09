import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { addDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore'
import { db } from '../services/firebase'
import Modal from './Modal'

export default function EmergencyButton() {
  const { user, profile, community } = useAuth()
  const [showConfirm, setShowConfirm] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showError, setShowError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [sending, setSending] = useState(false)

  // No mostrar si no hay comunidad o perfil
  if (!community || !profile || profile.role === 'pending') return null

  async function handleEmergency() {
    setShowConfirm(false)
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

      setSending(false)
      setShowSuccess(true)
    } catch (err) {
      console.error('Error activando emergencia:', err)
      setErrorMessage(err.message)
      setSending(false)
      setShowError(true)
    }
  }

  return (
    <>
      {/* Modal de confirmación */}
      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleEmergency}
        type="warning"
        title="¿ACTIVAR EMERGENCIA?"
        message="Esto alertará a TODOS los vecinos de tu comunidad. Solo usa esto en emergencias reales."
        confirmText="Activar Emergencia"
        cancelText="Cancelar"
      />

      {/* Modal de éxito */}
      <Modal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        type="success"
        title="Emergencia Activada"
        message="Todos los vecinos han sido notificados. La ayuda está en camino."
        confirmText="Entendido"
        showCancel={false}
      />

      {/* Modal de error */}
      <Modal
        isOpen={showError}
        onClose={() => setShowError(false)}
        type="error"
        title="Error"
        message={`No se pudo activar la emergencia: ${errorMessage}`}
        confirmText="Reintentar"
        cancelText="Cerrar"
        onConfirm={() => {
          setShowError(false)
          setShowConfirm(true)
        }}
      />

      {/* Botón flotante */}
      <button
        onClick={() => setShowConfirm(true)}
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
