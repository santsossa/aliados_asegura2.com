/**
 * Seed — crea el administrador inicial
 * Ejecutar: npx ts-node src/config/seed.ts
 */
import './env'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { pool } from './db'
import { env } from './env'

async function seed() {
  const adminEmail    = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD
  const adminNombre   = process.env.ADMIN_NOMBRE || 'Administrador'

  if (!adminEmail || !adminPassword) {
    console.error('❌ Define ADMIN_EMAIL y ADMIN_PASSWORD en el .env')
    process.exit(1)
  }

  const [existe] = await pool.execute<any[]>(
    'SELECT id FROM admins WHERE correo = ?', [adminEmail]
  )

  if (existe.length) {
    console.log(`ℹ️  Admin ${adminEmail} ya existe. No se creó duplicado.`)
    process.exit(0)
  }

  const hash = await bcrypt.hash(adminPassword, 12)
  const id   = uuidv4()

  await pool.execute(
    'INSERT INTO admins (id, nombre, correo, contrasena_hash, rol) VALUES (?, ?, ?, ?, ?)',
    [id, adminNombre, adminEmail, hash, 'super_admin']
  )

  console.log(`✅ Admin creado: ${adminEmail} (super_admin)`)
  process.exit(0)
}

seed().catch(err => {
  console.error('❌ Error en seed:', err)
  process.exit(1)
})
