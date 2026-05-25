import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, CheckCircle, XCircle, FileText, Clock, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSSE } from '../context/SSEContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const TIPO_CONFIG = {
  poliza_aprobada:    { icon: CheckCircle, color: '#16a34a', bg: '#dcfce7' },
  poliza_no_aprobada: { icon: XCircle,     color: '#dc2626', bg: '#fee2e2' },
  estado_actualizado: { icon: Clock,       color: '#7c3aed', bg: '#ede9fe' },
  lead_recibido:      { icon: FileText,    color: '#2D2A7A', bg: '#edeef3' },
}

// Determina a dónde navegar al hacer click según el tipo de notificación
function getLink(tipo) {
  if (tipo === 'poliza_aprobada')    return '/dashboard/mis-polizas?tab=aprobada'
  if (tipo === 'poliza_no_aprobada') return '/dashboard/mis-polizas?tab=no_convertida'
  if (tipo === 'estado_actualizado') return '/dashboard/mis-polizas?tab=en_tramite'
  return '/dashboard/mis-polizas'
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60)    return 'hace un momento'
  if (diff < 3600)  return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`
  return `hace ${Math.floor(diff / 86400)} d`
}

export default function NotificationBell() {
  const [open, setOpen]         = useState(false)
  const [notifs, setNotifs]     = useState([])
  const [noLeidas, setNoLeidas] = useState(0)
  const dropdownRef             = useRef(null)
  const token                   = localStorage.getItem('token')
  const { subscribe }           = useSSE()
  const navigate                = useNavigate()

  // ── Carga / recarga ───────────────────────────────────────────────────────
  const fetchNotifs = useCallback(async () => {
    if (!token) return
    try {
      const r = await fetch(`${API}/api/notificaciones`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!r.ok) return
      const data = await r.json()
      setNotifs(data.data || [])
      setNoLeidas(data.no_leidas || 0)
    } catch { /* silencioso */ }
  }, [token])

  useEffect(() => { fetchNotifs() }, [fetchNotifs])

  // Refetch cuando el tab vuelve al foco (fallback ante caída de SSE)
  useEffect(() => {
    return subscribe('__refresh', fetchNotifs)
  }, [subscribe, fetchNotifs])

  // ── SSE: nueva notificación en tiempo real ─────────────────────────────
  useEffect(() => {
    return subscribe('notificacion', (notif) => {
      setNotifs(prev => {
        if (prev.some(n => n.id === notif.id)) return prev
        return [notif, ...prev].slice(0, 50)
      })
      setOpen(isOpen => {
        if (!isOpen) setNoLeidas(c => c + 1)
        return isOpen
      })
    })
  }, [subscribe])

  // ── Cerrar al hacer clic fuera ────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // ── Abrir dropdown → marca como leídas ───────────────────────────────
  async function handleOpen() {
    const next = !open
    setOpen(next)
    if (next && noLeidas > 0) {
      try {
        await fetch(`${API}/api/notificaciones/marcar-leidas`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        })
        setNotifs(prev => prev.map(n => ({ ...n, leida: true })))
        setNoLeidas(0)
      } catch { /* silencioso */ }
    }
  }

  // ── Click en una notificación → navega y cierra ───────────────────────
  function handleNotifClick(n) {
    setOpen(false)
    navigate(getLink(n.tipo))
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Botón campana */}
      <button
        onClick={handleOpen}
        style={{
          position: 'relative',
          width: 40, height: 40, borderRadius: '50%',
          background: open ? '#f0f0f5' : '#ffffff',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background = '#f0f0f5' }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = '#ffffff' }}
      >
        <Bell size={17} color="#374151" />
        {noLeidas > 0 && (
          <span style={{
            position: 'absolute', top: 4, right: 4,
            minWidth: 16, height: 16, borderRadius: 99,
            background: '#e53935', color: '#fff',
            fontSize: 9, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px', lineHeight: 1,
            border: '2px solid #eeeeef',
          }}>
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 48, right: 0,
          width: 340, maxHeight: 440,
          background: '#fff', borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
          border: '1px solid #eeeeef',
          zIndex: 100,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px 10px', borderBottom: '1px solid #eeeeef', flexShrink: 0,
          }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#16151b' }}>Notificaciones</span>
            <button onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex' }}>
              <X size={16} />
            </button>
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notifs.length === 0 ? (
              <div style={{ padding: '20px 20px 22px', display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                <Bell size={20} color="#d1d5db" />
                <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>Sin notificaciones aún</p>
              </div>
            ) : notifs.map(n => {
              const cfg  = TIPO_CONFIG[n.tipo] || TIPO_CONFIG['lead_recibido']
              const Icon = cfg.icon
              return (
                <button
                  key={n.id}
                  onClick={() => handleNotifClick(n)}
                  style={{
                    width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
                    display: 'flex', gap: 12, padding: '12px 16px',
                    borderBottom: '1px solid #f4f4f6',
                    background: n.leida ? '#fff' : '#f8f8ff',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f0f0f8'}
                  onMouseLeave={e => e.currentTarget.style.background = n.leida ? '#fff' : '#f8f8ff'}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: cfg.bg, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={17} color={cfg.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{
                        fontWeight: n.leida ? 600 : 700, fontSize: 13, color: '#16151b',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{n.titulo}</span>
                      {!n.leida && (
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2D2A7A', flexShrink: 0 }} />
                      )}
                    </div>
                    <p style={{
                      margin: 0, fontSize: 12, color: '#6b7280', lineHeight: '1.45',
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>{n.mensaje}</p>
                    <span style={{ fontSize: 11, color: '#b0b4c1', marginTop: 4, display: 'block' }}>
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                  {/* Flecha indicador de navegación */}
                  <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, color: '#d1d5db' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
