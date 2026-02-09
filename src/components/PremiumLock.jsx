import React from 'react'
import { Link } from 'react-router-dom'

/**
 * Componente para mostrar funciones premium bloqueadas
 * @param {string} title - Nombre de la función
 * @param {string} description - Descripción breve
 * @param {string} icon - Emoji del icono
 */
export default function PremiumLock({ title, description, icon = '🔒' }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      borderRadius: 12,
      padding: 20,
      position: 'relative',
      overflow: 'hidden',
      border: '1px solid #f39c12'
    }}>
      {/* Badge Premium */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        background: '#f39c12',
        color: 'white',
        padding: '4px 12px',
        fontSize: 10,
        fontWeight: 'bold',
        borderBottomLeftRadius: 8
      }}>
        ⭐ PREMIUM
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ fontSize: 32, opacity: 0.5 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: '0 0 4px 0', color: '#2c3e50', display: 'flex', alignItems: 'center', gap: 8 }}>
            {title}
            <span style={{ fontSize: 16 }}>🔒</span>
          </h4>
          <p style={{ margin: '0 0 12px 0', color: '#666', fontSize: 14 }}>
            {description}
          </p>
          <Link 
            to="/planes"
            style={{
              display: 'inline-block',
              padding: '6px 16px',
              background: '#f39c12',
              color: 'white',
              borderRadius: 20,
              textDecoration: 'none',
              fontSize: 12,
              fontWeight: 'bold',
              transition: 'transform 0.2s'
            }}
          >
            Desbloquear con Premium →
          </Link>
        </div>
      </div>
    </div>
  )
}

/**
 * Componente más compacto para listas
 */
export function PremiumLockCompact({ title }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      background: '#fff8e1',
      borderRadius: 8,
      border: '1px dashed #f39c12'
    }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#666' }}>
        🔒 {title}
      </span>
      <Link 
        to="/planes"
        style={{
          fontSize: 11,
          color: '#f39c12',
          textDecoration: 'none',
          fontWeight: 'bold'
        }}
      >
        Premium
      </Link>
    </div>
  )
}

/**
 * Sección completa de funciones premium
 */
export function PremiumFeaturesSection() {
  const features = [
    { icon: '🔔', title: 'Notificaciones Push', description: 'Recibe alertas instantáneas en tu dispositivo' },
    { icon: '📊', title: 'Reportes y Estadísticas', description: 'Analiza la actividad de tu comunidad' },
    { icon: '📜', title: 'Historial de Emergencias', description: 'Accede al registro completo de incidentes' },
    { icon: '📋', title: 'Encuestas Avanzadas', description: 'Múltiples tipos de respuesta y análisis' },
    { icon: '📤', title: 'Exportar Datos', description: 'Descarga toda la información en CSV o PDF' },
    { icon: '🎧', title: 'Soporte Prioritario', description: 'Atención 24/7 con tiempos de respuesta garantizados' },
  ]

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 16 
      }}>
        <h3 style={{ margin: 0, color: '#2c3e50' }}>
          ⭐ Funciones Premium
        </h3>
        <Link 
          to="/planes"
          style={{
            padding: '8px 16px',
            background: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
            color: 'white',
            borderRadius: 20,
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: 'bold'
          }}
        >
          Ver Planes
        </Link>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: 12 
      }}>
        {features.map((f, idx) => (
          <PremiumLock key={idx} {...f} />
        ))}
      </div>
    </div>
  )
}
