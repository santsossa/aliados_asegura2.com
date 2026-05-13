import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  X, Home, FileText, Shield, DollarSign,
  CreditCard, Settings, LogOut, Car,
} from 'lucide-react'
import styles from './DropdownMenu.module.css'

const getInitials = (name = '') => {
  const parts = name.trim().split(' ')
  return (parts[0]?.[0] || '') + (parts[1]?.[0] || '') || 'AL'
}

export default function DropdownMenu({ onClose, user }) {
  const navigate = useNavigate()
  const [isClosing, setIsClosing] = useState(false)

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => onClose(), 240)
  }

  const handleNav = (path) => {
    handleClose()
    setTimeout(() => navigate(path), 250)
  }

  const handleLogout = () => {
    handleClose()
    setTimeout(() => navigate('/login'), 280)
  }

  return (
    <>
      <div
        className={`${styles.menuOverlay} ${isClosing ? styles.fadeOut : styles.fadeIn}`}
        onClick={handleClose}
      />

      <div className={`${styles.menuPanel} ${isClosing ? styles.slideOut : styles.slideIn}`}>

        {/* Header */}
        <div className={styles.menuHeader}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {getInitials(user?.name || 'Aliado')}
            </div>
            <div className={styles.userDetails}>
              <h3>{user?.name || 'Mi cuenta'}</h3>
              <p>{user?.email || 'aliado@asegura2.com.co'}</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        {/* Contenido */}
        <div className={styles.menuContent}>

          <div className={styles.menuSection}>
            <h4>Navegación</h4>
            {[
              { to: '/dashboard',               icon: Home,        label: 'Home'            },
              { to: '/dashboard/cotizaciones',  icon: FileText,    label: 'Cotizaciones'    },
              { to: '/dashboard/mis-polizas',   icon: Shield,      label: 'Mis pólizas'     },
              { to: '/dashboard/mis-pagos',     icon: DollarSign,  label: 'Mis pagos'       },
            ].map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/dashboard'}
                onClick={handleClose}
                className={({ isActive }) =>
                  `${styles.menuItem} ${isActive ? styles.menuItemActive : ''}`
                }
              >
                <Icon size={17} />
                {label}
              </NavLink>
            ))}
          </div>

          {/* Cotizar CTA */}
          <button
            onClick={() => handleNav('/dashboard/cotizar')}
            className={styles.menuItem}
            style={{ background:'#2D2A7A', color:'#fff', marginBottom:8 }}
            onMouseEnter={e => e.currentTarget.style.background='#201D5F'}
            onMouseLeave={e => e.currentTarget.style.background='#2D2A7A'}
          >
            <Car size={17} />
            Iniciar cotización
          </button>

          <div className={styles.divider} />

          <div className={styles.menuSection}>
            <h4>Cuenta</h4>
            {[
              { to: '/dashboard/informacion-financiera', icon: CreditCard, label: 'Info. financiera' },
              { to: '#',                                 icon: Settings,   label: 'Configuración'   },
            ].map(({ to, icon: Icon, label }) => (
              <NavLink
                key={label}
                to={to}
                onClick={handleClose}
                className={({ isActive }) =>
                  `${styles.menuItem} ${isActive ? styles.menuItemActive : ''}`
                }
              >
                <Icon size={17} />
                {label}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Logout */}
        <div className={styles.logoutSection}>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={17} />
            Cerrar sesión
          </button>
        </div>
      </div>
    </>
  )
}
