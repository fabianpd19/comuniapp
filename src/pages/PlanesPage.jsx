import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function PlanesPage() {
  const { profile, community } = useAuth()
  const isPremium = community?.isPremium || false

  const planes = [
    {
      name: 'Gratis',
      price: '$0',
      period: 'Para siempre',
      description: 'Perfecto para comunidades pequeñas',
      features: [
        { name: 'Hasta 50 miembros', included: true },
        { name: 'Tablón de avisos', included: true },
        { name: 'Alertas comunitarias', included: true },
        { name: 'Encuestas básicas', included: true },
        { name: 'Chat comunitario', included: true },
        { name: 'Botón de emergencia', included: true },
        { name: 'Notificaciones push', included: false },
        { name: 'Reportes y estadísticas', included: false },
        { name: 'Historial de emergencias', included: false },
        { name: 'Encuestas avanzadas', included: false },
        { name: 'Exportar datos', included: false },
        { name: 'Soporte prioritario', included: false },
      ],
      current: !isPremium,
      color: '#95a5a6'
    },
    {
      name: 'Premium',
      price: '$9.99',
      period: '/mes por comunidad',
      description: 'Todo lo que necesitas para gestionar tu comunidad',
      features: [
        { name: 'Miembros ilimitados', included: true },
        { name: 'Tablón de avisos', included: true },
        { name: 'Alertas comunitarias', included: true },
        { name: 'Encuestas básicas', included: true },
        { name: 'Chat comunitario', included: true },
        { name: 'Botón de emergencia', included: true },
        { name: 'Notificaciones push', included: true },
        { name: 'Reportes y estadísticas', included: true },
        { name: 'Historial de emergencias', included: true },
        { name: 'Encuestas avanzadas', included: true },
        { name: 'Exportar datos (CSV, PDF)', included: true },
        { name: 'Soporte prioritario 24/7', included: true },
      ],
      current: isPremium,
      color: '#f39c12',
      popular: true
    }
  ]

  return (
    <div>
      <div style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ margin: '0 0 8px 0', color: '#2c3e50' }}>Planes de ComuniApp</h1>
          <p style={{ color: '#666', fontSize: 18, margin: 0 }}>
            Elige el plan perfecto para tu comunidad
          </p>
        </div>

        {/* Planes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {planes.map(plan => (
            <div 
              key={plan.name}
              style={{
                background: 'white',
                borderRadius: 16,
                padding: 24,
                border: plan.popular ? `3px solid ${plan.color}` : '1px solid #ddd',
                position: 'relative',
                boxShadow: plan.popular ? '0 8px 24px rgba(243, 156, 18, 0.2)' : 'none'
              }}
            >
              {/* Badge Popular */}
              {plan.popular && (
                <div style={{
                  position: 'absolute',
                  top: -12,
                  right: 20,
                  background: plan.color,
                  color: 'white',
                  padding: '4px 16px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 'bold'
                }}>
                  ⭐ MÁS POPULAR
                </div>
              )}

              {/* Nombre y precio */}
              <h2 style={{ margin: '0 0 4px 0', color: plan.color }}>{plan.name}</h2>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 36, fontWeight: 'bold', color: '#2c3e50' }}>{plan.price}</span>
                <span style={{ color: '#666', fontSize: 14 }}>{plan.period}</span>
              </div>
              <p style={{ color: '#666', margin: '0 0 20px 0', fontSize: 14 }}>{plan.description}</p>

              {/* Botón */}
              {plan.current ? (
                <div style={{
                  padding: '12px 24px',
                  background: '#ecf0f1',
                  color: '#666',
                  borderRadius: 8,
                  textAlign: 'center',
                  fontWeight: 'bold',
                  marginBottom: 20
                }}>
                  ✓ Plan Actual
                </div>
              ) : (
                <button
                  onClick={() => alert('🚀 Próximamente: Integración de pagos.\n\nContacta a soporte@comuniapp.com para más información.')}
                  style={{
                    width: '100%',
                    padding: '12px 24px',
                    background: `linear-gradient(135deg, ${plan.color} 0%, #e67e22 100%)`,
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 16,
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    marginBottom: 20,
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={e => e.target.style.transform = 'scale(1.02)'}
                  onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                >
                  Actualizar a Premium
                </button>
              )}

              {/* Features */}
              <div style={{ borderTop: '1px solid #eee', paddingTop: 16 }}>
                {plan.features.map((feature, idx) => (
                  <div 
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 0',
                      color: feature.included ? '#2c3e50' : '#bdc3c7'
                    }}
                  >
                    <span style={{ fontSize: 16 }}>
                      {feature.included ? '✅' : '❌'}
                    </span>
                    <span style={{ textDecoration: feature.included ? 'none' : 'line-through' }}>
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div style={{ marginTop: 48, background: '#f8f9fa', borderRadius: 12, padding: 24 }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#2c3e50' }}>Preguntas frecuentes</h3>
          
          <div style={{ marginBottom: 16 }}>
            <strong>¿Puedo cambiar de plan en cualquier momento?</strong>
            <p style={{ margin: '4px 0 0 0', color: '#666' }}>
              Sí, puedes actualizar o cancelar tu suscripción cuando quieras.
            </p>
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <strong>¿Hay descuento para pago anual?</strong>
            <p style={{ margin: '4px 0 0 0', color: '#666' }}>
              Sí, al pagar anualmente obtienes 2 meses gratis (equivalente a $99.99/año).
            </p>
          </div>
          
          <div>
            <strong>¿Qué métodos de pago aceptan?</strong>
            <p style={{ margin: '4px 0 0 0', color: '#666' }}>
              Tarjetas de crédito/débito, PayPal y transferencia bancaria.
            </p>
          </div>
        </div>

        {/* CTA final */}
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <p style={{ color: '#666' }}>
            ¿Tienes preguntas? <a href="mailto:soporte@comuniapp.com" style={{ color: '#3498db' }}>Contáctanos</a>
          </p>
        </div>
      </div>
    </div>
  )
}
