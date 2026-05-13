/**
 * Seed — crea el administrador inicial
 * Se ejecuta automáticamente al iniciar el servidor.
 * También se puede correr manualmente: pnpm db:seed
 */
import './env'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { pool } from './db'

export async function runSeed(): Promise<void> {
  const adminEmail    = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD
  const adminNombre   = process.env.ADMIN_NOMBRE || 'Administrador'

  if (!adminEmail || !adminPassword) {
    console.warn('⚠️  ADMIN_EMAIL / ADMIN_PASSWORD no definidos. Seed omitido.')
    return
  }

  const [rows] = await pool.execute<any[]>(
    'SELECT id FROM admins WHERE correo = ?',
    [adminEmail]
  )

  if ((rows as any[]).length) {
    console.log(`ℹ️  Admin ${adminEmail} ya existe. No se creó duplicado.`)
    return
  }

  const hash = await bcrypt.hash(adminPassword, 12)
  const id   = uuidv4()

  await pool.execute(
    'INSERT INTO admins (id, nombre, correo, contrasena_hash, rol) VALUES (?, ?, ?, ?, ?)',
    [id, adminNombre, adminEmail, hash, 'super_admin']
  )

  console.log(`✅ Admin creado: ${adminEmail} (super_admin)`)
}

// Ejecución directa: pnpm db:seed
if (require.main === module) {
  runSeed()
    .then(() => process.exit(0))
    .catch(err => { console.error('❌ Error en seed:', err); process.exit(1) })
}
