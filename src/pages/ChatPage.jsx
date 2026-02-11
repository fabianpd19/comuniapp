import React, { useEffect, useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { 
  collection, query, where, getDocs, addDoc, onSnapshot, 
  orderBy, serverTimestamp, deleteDoc, doc 
} from 'firebase/firestore'
import { db } from '../services/firebase'

export default function ChatPage() {
  const { user, profile, community } = useAuth()
  const [chat, setChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)
  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin'

  // Scroll al final cuando hay nuevos mensajes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Buscar o crear chat de la comunidad
  useEffect(() => {
    if (!community) return

    async function loadOrCreateChat() {
      try {
        const chatsQuery = query(
          collection(db, 'chats'),
          where('communityId', '==', community.id)
        )
        const snap = await getDocs(chatsQuery)

        if (snap.empty) {
          // Crear chat si no existe (solo admin)
          if (isAdmin) {
            const newChat = await addDoc(collection(db, 'chats'), {
              communityId: community.id,
              createdAt: serverTimestamp()
            })
            setChat({ id: newChat.id, communityId: community.id })
          } else {
            setLoading(false)
            return
          }
        } else {
          setChat({ id: snap.docs[0].id, ...snap.docs[0].data() })
        }
        setLoading(false)
      } catch (err) {
        console.error('Error cargando chat:', err)
        setLoading(false)
      }
    }

    loadOrCreateChat()
  }, [community, isAdmin])

  // Escuchar mensajes en tiempo real
  useEffect(() => {
    if (!chat) return

    const messagesQuery = query(
      collection(db, 'messages'),
      where('chatId', '==', chat.id),
      orderBy('createdAt', 'asc')
    )

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      setMessages(msgs)
    }, (error) => {
      console.error('Error en onSnapshot:', error)
    })

    return () => unsubscribe()
  }, [chat])

  async function sendMessage(e) {
    e.preventDefault()
    if (!newMessage.trim() || !chat) return

    try {
      await addDoc(collection(db, 'messages'), {
        chatId: chat.id,
        senderId: user.uid,
        senderName: profile?.displayName || 'Usuario',
        message: newMessage.trim(),
        createdAt: serverTimestamp(),
        isEmergency: false
      })
      setNewMessage('')
    } catch (err) {
      console.error('Error enviando mensaje:', err)
      alert('Error al enviar mensaje')
    }
  }

  async function deleteMessage(msgId) {
    if (!confirm('¿Eliminar este mensaje?')) return
    try {
      await deleteDoc(doc(db, 'messages', msgId))
    } catch (err) {
      console.error('Error eliminando mensaje:', err)
    }
  }

  function formatTime(timestamp) {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  }

  function formatDate(timestamp) {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  if (loading) {
    return (
      <div>
        <div style={{ padding: 20, textAlign: 'center' }}>Cargando chat...</div>
      </div>
    )
  }

  if (!chat) {
    return (
      <div>
        <div style={{ padding: 20, textAlign: 'center' }}>
          <p>El chat de la comunidad aún no ha sido creado.</p>
          {isAdmin && (
            <button 
              onClick={() => window.location.reload()}
              style={{ padding: '10px 20px', background: '#3498db', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
            >
              Crear Chat
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header del chat */}
      <div style={{ 
        background: 'linear-gradient(135deg, #075e54 0%, #128c7e 100%)', 
        color: 'white', 
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
          💬
        </div>
        <div>
          <h3 style={{ margin: 0 }}>{community?.name || 'Chat Comunitario'}</h3>
          <span style={{ fontSize: 12, opacity: 0.8 }}>{messages.length} mensajes</span>
        </div>
      </div>

      {/* Área de mensajes */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: 16, 
        background: '#ece5dd',
        backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23d4cfc4\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
      }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', marginTop: 40 }}>
            <p>No hay mensajes aún.</p>
            <p style={{ fontSize: 14 }}>¡Sé el primero en escribir!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isOwn = msg.senderId === user.uid
            const showDate = idx === 0 || 
              formatDate(messages[idx - 1]?.createdAt) !== formatDate(msg.createdAt)

            return (
              <div key={msg.id}>
                {showDate && (
                  <div style={{ textAlign: 'center', margin: '16px 0' }}>
                    <span style={{ 
                      background: '#e1f3fb', 
                      padding: '4px 12px', 
                      borderRadius: 8, 
                      fontSize: 12,
                      color: '#54656f'
                    }}>
                      {formatDate(msg.createdAt)}
                    </span>
                  </div>
                )}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: isOwn ? 'flex-end' : 'flex-start',
                  marginBottom: 4
                }}>
                  <div style={{
                    maxWidth: '75%',
                    padding: '8px 12px',
                    borderRadius: isOwn ? '8px 0 8px 8px' : '0 8px 8px 8px',
                    background: msg.isEmergency ? '#ffebee' : (isOwn ? '#dcf8c6' : 'white'),
                    border: msg.isEmergency ? '2px solid #c0392b' : 'none',
                    boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
                    position: 'relative'
                  }}>
                    {!isOwn && (
                      <div style={{ 
                        fontSize: 12, 
                        fontWeight: 'bold', 
                        color: msg.isEmergency ? '#c0392b' : '#075e54',
                        marginBottom: 2
                      }}>
                        {msg.isEmergency ? '🚨 EMERGENCIA' : msg.senderName}
                      </div>
                    )}
                    <div style={{ wordWrap: 'break-word' }}>{msg.message}</div>
                    <div style={{ 
                      fontSize: 11, 
                      color: '#667781', 
                      textAlign: 'right',
                      marginTop: 2,
                      display: 'flex',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      gap: 8
                    }}>
                      {formatTime(msg.createdAt)}
                      {(isOwn || isAdmin) && (
                        <button 
                          onClick={() => deleteMessage(msg.id)}
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer', 
                            fontSize: 12,
                            color: '#999',
                            padding: 0
                          }}
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de mensaje */}
      <form onSubmit={sendMessage} style={{ 
        padding: 12, 
        background: '#f0f2f5',
        display: 'flex',
        gap: 8,
        alignItems: 'center'
      }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Escribe un mensaje..."
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 24,
            border: 'none',
            fontSize: 15,
            outline: 'none'
          }}
        />
        <button 
          type="submit"
          disabled={!newMessage.trim()}
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: 'none',
            background: newMessage.trim() ? '#00a884' : '#ccc',
            color: 'white',
            fontSize: 20,
            cursor: newMessage.trim() ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ➤
        </button>
      </form>
    </div>
  )
}
