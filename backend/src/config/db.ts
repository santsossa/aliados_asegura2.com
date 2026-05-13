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
  timezone:           'Z',        // UTC — evita conflictos con NOW() en Railway
  charset:            'utf8mb4',
})

export async function testConnection(retries = 5, delayMs = 3000): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await pool.getConnection()
      console.log('✅ MySQL conectado correctamente')
      conn.release()
      return
    } catch (err) {
      console.error(`❌ Error conectando a MySQL (intento ${attempt}/${retries}):`, err)
      if (attempt < retries) {
        console.log(`⏳ Reintentando en ${delayMs / 1000}s...`)
        await new Promise(resolve => setTimeout(resolve, delayMs))
      } else {
        console.error('❌ No se pudo conectar a MySQL tras todos los intentos. El servidor seguirá en pie.')
        // No llamamos process.exit() — el servidor HTTP ya está corriendo
        // y puede responder al healthcheck mientras Railway inicializa la DB
      }
    }
  }
}
