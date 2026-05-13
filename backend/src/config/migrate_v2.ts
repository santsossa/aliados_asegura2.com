/**
 * Migración v2 — seguridad: bloqueo por intentos fallidos + logs
 * Ejecutar: npx ts-node src/config/migrate_v2.ts
 */
import './env'
import { pool } from './db'

const SQL = `
ALTER TABLE aliados ADD COLUMN intentos_fallidos INT NOT NULL DEFAULT 0;
ALTER TABLE aliados ADD COLUMN bloqueado_hasta TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE admins  ADD COLUMN intentos_fallidos INT NOT NULL DEFAULT 0;
ALTER TABLE admins  ADD COLUMN bloqueado_hasta TIMESTAMP NULL DEFAULT NULL;

CREATE TABLE IF NOT EXISTS auth_logs (
  id         VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  tipo_user  ENUM('aliado','admin')   NOT NULL,
  user_id    VARCHAR(36),
  correo     VARCHAR(150)             NOT NULL,
  evento     ENUM('login_ok','login_fail','otp_ok','otp_fail','logout','blocked') NOT NULL,
  ip         VARCHAR(45),
  user_agent VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`

async function migrate() {
  const stmts = SQL.split(';').map(s => s.trim()).filter(Boolean)
  for (const s of stmts) await pool.execute(s)
  console.log('✅ Migración v2 completada')
  process.exit(0)
}
migrate().catch(e => { console.error('❌', e.message); process.exit(1) })
