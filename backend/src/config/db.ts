import mysql from 'mysql2/promise'
import { env } from './env'

export const pool = mysql.createPool({
  host:               env.DB_HOST,
  port:               parseInt(env.DB_PORT),
  database:           env.DB_NAME,
  user:               env.DB_USER,
  password:           env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:           '-05:00',   // Colombia (UTC-5)
  charset:            'utf8mb4',
})

export async function testConnection(): Promise<void> {
  try {
    const conn = await pool.getConnection()
    console.log('✅ MySQL conectado correctamente')
    conn.release()
  } catch (err) {
    console.error('❌ Error conectando a MySQL:', err)
    process.exit(1)
  }
}
