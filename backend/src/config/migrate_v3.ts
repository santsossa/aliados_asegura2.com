/**
 * Migración v3 — comisión calculada sobre prima sin IVA (÷1.19)
 * Cambia la columna generada valor_comision para dividir primero por 1.19 antes del 6%.
 * Ejecutar: npx ts-node src/config/migrate_v3.ts
 */
import './env'
import { pool } from './db'

const SQL = `
ALTER TABLE polizas MODIFY COLUMN valor_comision DECIMAL(12,2) GENERATED ALWAYS AS (ROUND(valor_prima / 1.19 * comision_pct / 100, 2)) STORED
`

async function migrate() {
  const stmts = SQL.split(';').map(s => s.trim()).filter(Boolean)
  for (const s of stmts) await pool.execute(s)
  console.log('✅ Migración v3 completada — valor_comision ahora usa prima sin IVA')
  process.exit(0)
}
migrate().catch(e => { console.error('❌', e.message); process.exit(1) })
