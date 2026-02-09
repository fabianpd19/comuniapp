import React from 'react'

export default function Modal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  type = 'info', // 'info', 'warning', 'success', 'error'
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  showCancel = true
}) {
  if (!isOpen) return null

  const colors = {
    info: { bg: '#3498db', dark: '#2980b9' },
    warning: { bg: '#e74c3c', dark: '#c0392b' },
    success: { bg: '#27ae60', dark: '#229954' },
    error: { bg: '#e67e22', dark: '#d35400' }
  }

  const icons = {
    info: 'ℹ️',
    warning: '⚠️',
    success: '✅',
    error: '❌'
  }

  const color = colors[type] || colors.info
  const icon = icons[type] || icons.info

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      backdropFilter: 'blur(4px)',
      animation: 'fadeIn 0.2s ease-out'
    }}
    onClick={onClose}
    >
      <div style={{
        background: 'white',
        borderRadius: 16,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        minWidth: 320,
        maxWidth: 480,
        padding: 0,
        animation: 'slideIn 0.3s ease-out',
        overflow: 'hidden'
      }}
      onClick={(e) => e.stopPropagation()}
      >
        {/* Header con color */}
        <div style={{
          background: `linear-gradient(135deg, ${color.bg} 0%, ${color.dark} 100%)`,
          padding: '24px 24px 20px 24px',
          color: 'white'
        }}>
          <div style={{
            fontSize: 48,
            textAlign: 'center',
            marginBottom: 12
          }}>
            {icon}
          </div>
          <h2 style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 700,
            textAlign: 'center'
          }}>
            {title}
          </h2>
        </div>

        {/* Contenido */}
        <div style={{
          padding: '24px',
          fontSize: 16,
          lineHeight: 1.6,
          color: '#333',
          textAlign: 'center'
        }}>
          {message}
        </div>

        {/* Botones */}
        <div style={{
          padding: '0 24px 24px 24px',
          display: 'flex',
          gap: 12,
          justifyContent: 'center'
        }}>
          {showCancel && (
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px 24px',
                border: '2px solid #ddd',
                background: 'white',
                color: '#666',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = '#999'
                e.target.style.color = '#333'
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = '#ddd'
                e.target.style.color = '#666'
              }}
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={() => {
              if (onConfirm) onConfirm()
              onClose()
            }}
            style={{
              flex: 1,
              padding: '12px 24px',
              border: 'none',
              background: `linear-gradient(135deg, ${color.bg} 0%, ${color.dark} 100%)`,
              color: 'white',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: `0 4px 12px ${color.bg}40`
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)'
              e.target.style.boxShadow = `0 6px 16px ${color.bg}60`
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = `0 4px 12px ${color.bg}40`
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>

      {/* Animaciones */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from {
            transform: scale(0.9) translateY(-20px);
            opacity: 0;
          }
          to {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
