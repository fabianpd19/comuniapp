import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { profile, logout } = useAuth()
  const role = profile?.role || 'pending'
  const baseRoute = role === 'admin' ? '/admin' : '/resident'

  const linkStyle = {
    color: '#555',
    textDecoration: 'none',
    padding: '8px 16px',
    borderRadius: 8,
    transition: 'all 0.2s',
    fontWeight: 500,
    fontSize: 14
  }

  return (
    <nav style={{
      display: 'flex',
      gap: 8,
      padding: '12px 24px',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginRight: 16
      }}>
        <img 
          src="/logo.png" 
          alt="ComuniApp" 
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            objectFit: 'contain',
            background: 'rgba(255,255,255,0.15)',
            padding: 2
          }}
          onError={(e) => { e.target.style.display = 'none' }}
        />
        <strong style={{
          color: 'white',
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: '0.5px'
        }}>ComuniApp</strong>
      </div>
      
      {/* Links principales */}
      {role === 'superadmin' && (
        <Link 
          to="/superadmin" 
          style={{...linkStyle, background: 'rgba(255,255,255,0.2)', color: 'white'}}
          onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
          onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
        >
          👑 Panel SuperAdmin
        </Link>
      )}
      {role === 'admin' && (
        <Link 
          to="/admin" 
          style={{...linkStyle, background: 'rgba(255,255,255,0.2)', color: 'white'}}
          onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
          onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
        >
          📊 Panel
        </Link>
      )}
      {role === 'resident' && (
        <Link 
          to="/resident" 
          style={{...linkStyle, background: 'rgba(255,255,255,0.2)', color: 'white'}}
          onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
          onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
        >
          🏠 Inicio
        </Link>
      )}
      
      {/* Menu secundario */}
      {(role === 'admin' || role === 'resident') && (
        <>
          <Link 
            to={`${baseRoute}/community`} 
            style={{...linkStyle, color: 'white'}}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.15)'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
          >
            👥 Comunidad
          </Link>
          <Link 
            to={`${baseRoute}/posts`} 
            style={{...linkStyle, color: 'white'}}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.15)'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
          >
            📢 Avisos
          </Link>
          <Link 
            to={`${baseRoute}/alerts`} 
            style={{...linkStyle, color: 'white'}}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.15)'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
          >
            🚨 Alertas
          </Link>
          <Link 
            to={`${baseRoute}/surveys`} 
            style={{...linkStyle, color: 'white'}}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.15)'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
          >
            📊 Encuestas
          </Link>
          <Link 
            to={`${baseRoute}/chat`} 
            style={{...linkStyle, background: 'rgba(18,140,126,0.2)', color: 'white', fontWeight: 600}}
            onMouseEnter={(e) => e.target.style.background = 'rgba(18,140,126,0.35)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(18,140,126,0.2)'}
          >
            💬 Chat
          </Link>
        </>
      )}
      
      <div style={{flex:1}} />

      {/* Botón Premium */}
      {(role === 'admin' || role === 'resident') && (
        <Link 
          to="/planes" 
          style={{
            padding: '8px 16px',
            background: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
            color: 'white',
            borderRadius: 20,
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: 700,
            boxShadow: '0 2px 8px rgba(243,156,18,0.3)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)'
            e.target.style.boxShadow = '0 4px 12px rgba(243,156,18,0.4)'
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)'
            e.target.style.boxShadow = '0 2px 8px rgba(243,156,18,0.3)'
          }}
        >
          ⭐ Premium
        </Link>
      )}
      
      {/* Usuario */}
      {profile && (
        <span style={{
          fontSize: 13,
          color: 'rgba(255,255,255,0.9)',
          padding: '6px 12px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 8,
          fontWeight: 500
        }}>
          {profile.displayName || profile.email}
        </span>
      )}
      
      {/* Botón Salir */}
      {profile ? (
        <button 
          onClick={logout} 
          style={{
            padding: '8px 16px',
            background: 'rgba(231,76,60,0.9)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 13,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#e74c3c'
            e.target.style.transform = 'scale(1.05)'
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(231,76,60,0.9)'
            e.target.style.transform = 'scale(1)'
          }}
        >
          🚪 Salir
        </button>
      ) : (
        <Link 
          to="/login" 
          style={{...linkStyle, background: 'white', color: '#667eea', fontWeight: 600}}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        >
          Entrar
        </Link>
      )}
    </nav>
  )
}
