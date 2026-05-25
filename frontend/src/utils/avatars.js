import hombre1 from '../assets/avatars_aliados/hombre1.png'
import hombre2 from '../assets/avatars_aliados/hombre2.png'
import hombre3 from '../assets/avatars_aliados/hombre3.png'
import hombre4 from '../assets/avatars_aliados/hombre4.png'
import mujer1   from '../assets/avatars_aliados/mujer1.png'
import mujer2   from '../assets/avatars_aliados/mujer2.png'
import mujer3   from '../assets/avatars_aliados/mujer3.png'
import mujer4   from '../assets/avatars_aliados/mujer4.png'

export const AVATARES = [
  { id: 'hombre1', src: hombre1 }, { id: 'hombre2', src: hombre2 },
  { id: 'hombre3', src: hombre3 }, { id: 'hombre4', src: hombre4 },
  { id: 'mujer1',  src: mujer1  }, { id: 'mujer2',  src: mujer2  },
  { id: 'mujer3',  src: mujer3  }, { id: 'mujer4',  src: mujer4  },
]

export function getAvatarSrc(id) {
  return AVATARES.find(a => a.id === id)?.src ?? null
}
