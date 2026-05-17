/**
 * Migraciones — Portal de Aliados
 * Se ejecuta automáticamente al iniciar el servidor.
 * También se puede correr manualmente: pnpm db:migrate
 */
import './env'
import { pool } from './db'

// ── Tablas (idempotentes — CREATE TABLE IF NOT EXISTS) ────────────────────
const TABLES_SQL = `

CREATE TABLE IF NOT EXISTS admins (
  id               VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  nombre           VARCHAR(100) NOT NULL,
  correo           VARCHAR(150) NOT NULL UNIQUE,
  contrasena_hash  VARCHAR(255) NOT NULL,
  rol              ENUM('super_admin','operaciones','finanzas') NOT NULL DEFAULT 'operaciones',
  estado           ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_otp_tokens (
  id          VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  admin_id    VARCHAR(36) NOT NULL,
  otp_hash    VARCHAR(255) NOT NULL,
  expires_at  TIMESTAMP   NOT NULL,
  usado       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_refresh_tokens (
  id          VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  admin_id    VARCHAR(36)  NOT NULL,
  token_hash  VARCHAR(255) NOT NULL UNIQUE,
  expires_at  TIMESTAMP    NOT NULL,
  revocado    BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS aliados (
  id               VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  nombre           VARCHAR(100) NOT NULL,
  cedula           VARCHAR(20)  NOT NULL UNIQUE,
  correo           VARCHAR(150) NOT NULL UNIQUE,
  telefono         VARCHAR(20)  NOT NULL,
  ciudad           VARCHAR(80)  NOT NULL,
  tipo_aliado      ENUM('Asesor de concesionario','Vendedor de carros usados','Agente independiente','Otro') NOT NULL,
  contrasena_hash  VARCHAR(255) NOT NULL,
  estado           ENUM('pendiente','activo','inactivo') NOT NULL DEFAULT 'pendiente',
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS aliado_banco (
  id               VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  aliado_id        VARCHAR(36)  NOT NULL UNIQUE,
  banco            VARCHAR(80)  NOT NULL,
  tipo_cuenta      ENUM('Ahorros','Corriente') NOT NULL,
  numero_cuenta    VARCHAR(30)  NOT NULL,
  titular          VARCHAR(100) NOT NULL,
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (aliado_id) REFERENCES aliados(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS email_verificacion (
  id          VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  aliado_id   VARCHAR(36)  NOT NULL,
  token       VARCHAR(255) NOT NULL UNIQUE,
  expires_at  TIMESTAMP    NOT NULL,
  usado       BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (aliado_id) REFERENCES aliados(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS otp_tokens (
  id          VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  aliado_id   VARCHAR(36) NOT NULL,
  otp_hash    VARCHAR(255) NOT NULL,
  expires_at  TIMESTAMP   NOT NULL,
  usado       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (aliado_id) REFERENCES aliados(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  aliado_id   VARCHAR(36)  NOT NULL,
  token_hash  VARCHAR(255) NOT NULL UNIQUE,
  expires_at  TIMESTAMP    NOT NULL,
  revocado    BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (aliado_id) REFERENCES aliados(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cotizaciones (
  id              VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  aliado_id       VARCHAR(36)  NOT NULL,
  placa           VARCHAR(10),
  marca           VARCHAR(60),
  modelo          VARCHAR(60),
  anio            INT,
  aseguradora     VARCHAR(80),
  valor_prima     DECIMAL(12,2),
  datos_cotizacion JSON,
  mes             TINYINT      NOT NULL,
  anio_cot        YEAR         NOT NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (aliado_id) REFERENCES aliados(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS leads (
  id               VARCHAR(36)   PRIMARY KEY DEFAULT (UUID()),
  aliado_id        VARCHAR(36)   NOT NULL,
  cotizacion_id    VARCHAR(36),
  cliente_nombre   VARCHAR(100)  NOT NULL,
  cliente_telefono VARCHAR(20)   NOT NULL,
  aseguradora      VARCHAR(80)   NOT NULL,
  valor_prima      DECIMAL(12,2) NOT NULL,
  observaciones    TEXT,
  crm_lead_id      VARCHAR(100),
  created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (aliado_id)     REFERENCES aliados(id)      ON DELETE CASCADE,
  FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS polizas (
  id               VARCHAR(36)   PRIMARY KEY DEFAULT (UUID()),
  aliado_id        VARCHAR(36)   NOT NULL,
  lead_id          VARCHAR(36),
  cliente_nombre   VARCHAR(100)  NOT NULL,
  aseguradora      VARCHAR(80)   NOT NULL,
  valor_prima      DECIMAL(12,2) NOT NULL,
  comision_pct     DECIMAL(5,2)  NOT NULL DEFAULT 6.00,
  valor_comision   DECIMAL(12,2) GENERATED ALWAYS AS (valor_prima * comision_pct / 100) STORED,
  estado           ENUM('en_proceso','aprobada','no_convertida') NOT NULL DEFAULT 'en_proceso',
  primer_pago_at   TIMESTAMP     NULL,
  mes              TINYINT       NOT NULL,
  anio             YEAR          NOT NULL,
  created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (aliado_id) REFERENCES aliados(id) ON DELETE CASCADE,
  FOREIGN KEY (lead_id)   REFERENCES leads(id)   ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pagos (
  id           VARCHAR(36)   PRIMARY KEY DEFAULT (UUID()),
  aliado_id    VARCHAR(36)   NOT NULL,
  monto_total  DECIMAL(12,2) NOT NULL,
  mes          TINYINT       NOT NULL,
  anio         YEAR          NOT NULL,
  estado       ENUM('pendiente','procesado') NOT NULL DEFAULT 'pendiente',
  pagado_at    TIMESTAMP     NULL,
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (aliado_id) REFERENCES aliados(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pago_detalles (
  id         VARCHAR(36)   PRIMARY KEY DEFAULT (UUID()),
  pago_id    VARCHAR(36)   NOT NULL,
  poliza_id  VARCHAR(36)   NOT NULL,
  comision   DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (pago_id)   REFERENCES pagos(id)   ON DELETE CASCADE,
  FOREIGN KEY (poliza_id) REFERENCES polizas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

// ── Columnas adicionales (v2) — se ignoran si ya existen ─────────────────
const ALTER_STMTS = [
  `ALTER TABLE aliados ADD COLUMN intentos_fallidos INT NOT NULL DEFAULT 0`,
  `ALTER TABLE aliados ADD COLUMN bloqueado_hasta TIMESTAMP NULL DEFAULT NULL`,
  `ALTER TABLE admins  ADD COLUMN intentos_fallidos INT NOT NULL DEFAULT 0`,
  `ALTER TABLE admins  ADD COLUMN bloqueado_hasta TIMESTAMP NULL DEFAULT NULL`,
  `ALTER TABLE aliados ADD COLUMN apellido VARCHAR(100) NULL AFTER nombre`,
  `ALTER TABLE aliados ADD COLUMN onboarding_step TINYINT NOT NULL DEFAULT 0`,
  `ALTER TABLE cotizaciones ADD COLUMN estado ENUM('activa','enviada','cerrada') NOT NULL DEFAULT 'activa'`,
  `ALTER TABLE cotizaciones ADD COLUMN cliente_nombre VARCHAR(150) NULL`,
  `ALTER TABLE cotizaciones ADD COLUMN cliente_telefono VARCHAR(20) NULL`,
  `ALTER TABLE cotizaciones ADD COLUMN cliente_correo VARCHAR(150) NULL`,
  `ALTER TABLE cotizaciones ADD COLUMN comercial_value DECIMAL(14,0) NULL`,
]

// ── Columnas modificadas (v3) — idempotente, se ejecutan siempre ─────────
const MODIFY_STMTS = [
  `ALTER TABLE aliados MODIFY COLUMN nombre VARCHAR(100) NULL`,
  `ALTER TABLE aliados MODIFY COLUMN cedula VARCHAR(20) NULL`,
  `ALTER TABLE aliados MODIFY COLUMN telefono VARCHAR(20) NULL`,
  `ALTER TABLE aliados MODIFY COLUMN ciudad VARCHAR(80) NULL`,
  `ALTER TABLE aliados MODIFY COLUMN tipo_aliado ENUM('Asesor de concesionario','Vendedor de carros usados','Agente independiente','Otro') NULL`,
  `ALTER TABLE aliados MODIFY COLUMN estado ENUM('pendiente','onboarding','activo','inactivo') NOT NULL DEFAULT 'pendiente'`,
]

export async function runMigrations(): Promise<void> {
  console.log('🔄 Ejecutando migraciones...')

  // Tablas (idempotente)
  const statements = TABLES_SQL.split(';').map(s => s.trim()).filter(Boolean)
  for (const stmt of statements) {
    await pool.execute(stmt)
  }

  // Columnas adicionales — skip si ya existen (ER_DUP_FIELDNAME)
  for (const stmt of ALTER_STMTS) {
    try {
      await pool.execute(stmt)
    } catch (err: any) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        // Columna ya existe, se omite
      } else {
        throw err
      }
    }
  }

  // Columnas modificadas — idempotente, errores silenciosos
  for (const stmt of MODIFY_STMTS) {
    try {
      await pool.execute(stmt)
    } catch {
      // ignorar errores (columna ya tiene el tipo correcto, etc.)
    }
  }

  console.log('✅ Migraciones completadas')
}

// Ejecución directa: pnpm db:migrate
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(err => { console.error('❌ Error en migración:', err); process.exit(1) })
}
