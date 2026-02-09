import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { profile, logout } = useAuth()
  const role = profile?.role || 'pending'
  const baseRoute = role === 'admin' ? '/admin' : '/resident'

  return (
    <nav style={{display:'flex',gap:12,padding:12,alignItems:'center',background:'#f8f9fa',borderBottom:'1px solid #dee2e6'}}>
      <strong style={{color:'#2c3e50'}}>ComuniApp</strong>
      
      {role === 'superadmin' && <Link to="/superadmin" style={{color:'#8e44ad'}}>Panel SuperAdmin</Link>}
      {role === 'admin' && <Link to="/admin">Panel</Link>}
      {role === 'resident' && <Link to="/resident">Inicio</Link>}
      
      {(role === 'admin' || role === 'resident') && (
        <>
          <Link to={`${baseRoute}/community`}>Comunidad</Link>
          <Link to={`${baseRoute}/posts`}>Avisos</Link>
          <Link to={`${baseRoute}/alerts`}>Alertas</Link>
          <Link to={`${baseRoute}/surveys`}>Encuestas</Link>
          <Link to={`${baseRoute}/chat`} style={{color:'#128c7e',fontWeight:'bold'}}>💬 Chat</Link>
        </>
      )}
      
      <div style={{flex:1}} />

      {/* Enlace Premium */}
      {(role === 'admin' || role === 'resident') && (
        <Link 
          to="/planes" 
          style={{
            padding:'4px 12px',
            background:'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
            color:'white',
            borderRadius:20,
            textDecoration:'none',
            fontSize:12,
            fontWeight:'bold'
          }}
        >
          ⭐ Premium
        </Link>
      )}
      
      {profile && (
        <span style={{fontSize:12,color:'#666'}}>{profile.displayName || profile.email}</span>
      )}
      
      {profile ? (
        <button onClick={logout} style={{padding:'6px 12px',background:'#e74c3c',color:'white',border:'none',borderRadius:4,cursor:'pointer'}}>
          Salir
        </button>
      ) : (
        <Link to="/login">Entrar</Link>
      )}
    </nav>
  )
}
