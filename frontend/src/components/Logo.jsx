import logoFull from '../assets/Logo curvas-PhotoRoom.png-PhotoRoom.png'
import logoSolo from '../assets/logo-solo.png'

export function LogoFull({ className = 'h-10' }) {
  return (
    <img src={logoFull} alt="Asegura2.com" className={className} style={{ objectFit: 'contain' }} />
  )
}

export function LogoIcon({ size = 32 }) {
  return (
    <img src={logoSolo} alt="Asegura2.com" style={{ width: size, height: size, objectFit: 'contain' }} />
  )
}
