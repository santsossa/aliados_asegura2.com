/**
 * Migración de base de datos — Portal de Aliados
 * Ejecutar: npm run db:migrate
 */
import { pool } from './db'
import './env'

const SQL = `

-- ── Administradores ────────────────────────────────────────────────────────
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

-- ── OTP tokens admin ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_otp_tokens (
  id          VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  admin_id    VARCHAR(36) NOT NULL,
  otp_hash    VARCHAR(255) NOT NULL,
  expires_at  TIMESTAMP   NOT NULL,
  usado       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Refresh tokens admin ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_refresh_tokens (
  id          VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  admin_id    VARCHAR(36)  NOT NULL,
  token_hash  VARCHAR(255) NOT NULL UNIQUE,
  expires_at  TIMESTAMP    NOT NULL,
  revocado    BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Aliados ────────────────────────────────────────────────────────────────
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

-- ── Cuenta bancaria (una por aliado) ───────────────────────────────────────
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

-- ── Verificación de correo ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_verificacion (
  id          VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  aliado_id   VARCHAR(36)  NOT NULL,
  token       VARCHAR(255) NOT NULL UNIQUE,
  expires_at  TIMESTAMP    NOT NULL,
  usado       BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (aliado_id) REFERENCES aliados(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── OTP tokens ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS otp_tokens (
  id          VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  aliado_id   VARCHAR(36) NOT NULL,
  otp_hash    VARCHAR(255) NOT NULL,
  expires_at  TIMESTAMP   NOT NULL,
  usado       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (aliado_id) REFERENCES aliados(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Refresh tokens ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  aliado_id   VARCHAR(36)  NOT NULL,
  token_hash  VARCHAR(255) NOT NULL UNIQUE,
  expires_at  TIMESTAMP    NOT NULL,
  revocado    BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (aliado_id) REFERENCES aliados(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Cotizaciones ──────────────────────────────────────────────────────────
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

-- ── Leads (cotizaciones enviadas al CRM) ──────────────────────────────────
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

-- ── Pólizas ───────────────────────────────────────────────────────────────
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

-- ── Pagos de comisiones ───────────────────────────────────────────────────
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

-- ── Detalle de pagos ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pago_detalles (
  id         VARCHAR(36)   PRIMARY KEY DEFAULT (UUID()),
  pago_id    VARCHAR(36)   NOT NULL,
  poliza_id  VARCHAR(36)   NOT NULL,
  comision   DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (pago_id)   REFERENCES pagos(id)   ON DELETE CASCADE,
  FOREIGN KEY (poliza_id) REFERENCES polizas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`

async function migrate() {
  const statements = SQL.split(';').map(s => s.trim()).filter(Boolean)
  console.log(`🚀 Ejecutando ${statements.length} sentencias SQL...`)
  for (const stmt of statements) {
    await pool.execute(stmt)
  }
  console.log('✅ Migración completada')
  process.exit(0)
}

migrate().catch(err => {
  console.error('❌ Error en migración:', err)
  process.exit(1)
})
