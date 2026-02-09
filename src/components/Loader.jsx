import React from 'react'

export default function Loader() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      zIndex: 9999
    }}>
      {/* Spinner animado */}
      <div style={{
        width: 60,
        height: 60,
        border: '4px solid rgba(255,255,255,0.3)',
        borderTop: '4px solid white',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      
      {/* Texto */}
      <div style={{
        marginTop: 24,
        fontSize: 18,
        fontWeight: 600,
        color: 'white',
        letterSpacing: '0.5px'
      }}>
        Cargando...
      </div>
      
      {/* Logo/Icono */}
      <div style={{
        marginTop: 12,
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)'
      }}>
        🏘️ ComuniApp
      </div>

      {/* Keyframes para la animación */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
