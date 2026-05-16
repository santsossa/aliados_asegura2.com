import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { pool } from '../config/db'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, revokeRefreshToken, revokeAllRefreshTokens } from '../services/token.service'
import { generateOTP, verifyOTP, generateAdminOTP, verifyAdminOTP } from '../services/otp.service'
import { sendVerificationEmail, sendOTPEmail } from '../services/email.service'
import { env } from '../config/env'

const MAX_INTENTOS    = 3
const BLOQUEO_MINUTOS = 15
const COOKIE_OPTS = {
  httpOnly:  true,
  secure:    env.NODE_ENV === 'production',
  sameSite:  'strict' as const,
  maxAge:    7 * 24 * 60 * 60 * 1000,
  path:      '/',
}

// ── Log de eventos de seguridad ───────────────────────────────────────────
async function logAuth(
  tipo_user: 'aliado'|'admin',
  user_id: string|null,
  correo: string,
  evento: string,
  req: Request
) {
  try {
    const ip         = req.ip || req.socket?.remoteAddress || 'unknown'
    const user_agent = (req.headers['user-agent'] || '').substring(0, 255)
    await pool.execute(
      'INSERT INTO auth_logs (tipo_user, user_id, correo, evento, ip, user_agent) VALUES (?,?,?,?,?,?)',
      [tipo_user, user_id, correo, evento, ip, user_agent]
    )
  } catch { /* no detener el flujo por error de log */ }
}

// ── Verificar si cuenta está bloqueada ────────────────────────────────────
function estaBloqueado(row: any): boolean {
  if (!row.bloqueado_hasta) return false
  return new Date(row.bloqueado_hasta) > new Date()
}

// ── Incrementar intentos fallidos y bloquear si llega al límite ──────────
async function registrarIntentFallido(tabla: string, id: string) {
  const bloqueadoHasta = new Date()
  bloqueadoHasta.setMinutes(bloqueadoHasta.getMinutes() + BLOQUEO_MINUTOS)

  await pool.execute(
    `UPDATE ${tabla}
     SET intentos_fallidos = intentos_fallidos + 1,
         bloqueado_hasta = CASE
           WHEN intentos_fallidos + 1 >= ? THEN ?
           ELSE bloqueado_hasta
         END
     WHERE id = ?`,
    [MAX_INTENTOS, bloqueadoHasta, id]
  )
}

// ── Resetear contador tras login exitoso ──────────────────────────────────
async function resetarIntentos(tabla: string, id: string) {
  await pool.execute(
    'UPDATE ' + tabla + ' SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?',
    [id]
  )
}

// ── Respuesta genérica para credenciales incorrectas (anti-enumeración) ───
const CREDS_ERROR = { status: 'error', message: 'Correo o contraseña incorrectos.', code: 'INVALID_CREDENTIALS' }

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/registro
// ─────────────────────────────────────────────────────────────────────────────
function isPasswordStrong(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  )
}

export async function registro(req: Request, res: Response, next: NextFunction) {
  try {
    const { correo, contrasena } = req.body

    if (!isPasswordStrong(contrasena)) {
      res.status(400).json({
        status: 'error',
        message: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.',
        code: 'WEAK_PASSWORD',
      })
      return
    }

    const [existe] = await pool.execute<any[]>(
      'SELECT id FROM aliados WHERE correo = ?',
      [correo]
    )
    if (existe.length) {
      res.status(409).json({ status: 'error', message: 'El correo ya está registrado.' })
      return
    }

    const hash     = await bcrypt.hash(contrasena, 12)
    const aliadoId = uuidv4()

    await pool.execute(
      `INSERT INTO aliados (id, correo, contrasena_hash) VALUES (?, ?, ?)`,
      [aliadoId, correo, hash]
    )

    const otp = await generateOTP(aliadoId)
    await sendOTPEmail(correo, 'nuevo usuario', otp)
    await logAuth('aliado', aliadoId, correo, 'registro', req)

    res.status(201).json({ status: 'success', userId: aliadoId, tipo: 'registro' })
  } catch (err) { next(err) }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/verificar-correo?token=...
// ─────────────────────────────────────────────────────────────────────────────
export async function verificarCorreo(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.query as { token: string }

    const [rows] = await pool.execute<any[]>(
      'SELECT id, aliado_id, usado, expires_at FROM email_verificacion WHERE token = ?',
      [token]
    )

    if (!rows.length || rows[0].usado || new Date(rows[0].expires_at) < new Date()) {
      res.status(400).json({ status: 'error', message: 'Enlace inválido o expirado.' })
      return
    }

    await pool.execute('UPDATE email_verificacion SET usado = TRUE WHERE id = ?', [rows[0].id])
    await pool.execute("UPDATE aliados SET estado = 'activo' WHERE id = ?", [rows[0].aliado_id])

    res.json({ status: 'success', message: 'Correo verificado. Ya puedes iniciar sesión.' })
  } catch (err) { next(err) }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/verificar-registro
// ─────────────────────────────────────────────────────────────────────────────
export async function verificarRegistroOTP(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, otp } = req.body

    const [rows] = await pool.execute<any[]>(
      "SELECT id, correo FROM aliados WHERE id = ? AND estado = 'pendiente'",
      [userId]
    )
    if (!rows.length) {
      res.status(404).json({ status: 'error', message: 'No encontrado o ya verificado.' })
      return
    }

    const valid = await verifyOTP(userId, otp)
    if (!valid) {
      await logAuth('aliado', userId, rows[0].correo, 'otp_fail', req)
      res.status(401).json({ status: 'error', message: 'Código inválido o expirado.' })
      return
    }

    await pool.execute("UPDATE aliados SET estado = 'onboarding' WHERE id = ?", [userId])
    await logAuth('aliado', userId, rows[0].correo, 'otp_ok', req)

    const accessToken  = generateAccessToken(rows[0].id, rows[0].correo, 'aliado', undefined, 0)
    const refreshToken = await generateRefreshToken(rows[0].id)

    res.cookie('refreshToken', refreshToken, COOKIE_OPTS)
    res.json({
      status: 'success',
      accessToken,
      user: { id: rows[0].id, correo: rows[0].correo, tipo: 'aliado', onboarding_step: 0 },
    })
  } catch (err) { next(err) }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { correo, contrasena } = req.body

    // 1. Buscar en admins
    const [adminRows] = await pool.execute<any[]>(
      'SELECT id, nombre, correo, contrasena_hash, estado, rol, intentos_fallidos, bloqueado_hasta FROM admins WHERE correo = ?',
      [correo]
    )

    if (adminRows.length) {
      const admin = adminRows[0]

      // Cuenta bloqueada
      if (estaBloqueado(admin)) {
        await logAuth('admin', admin.id, correo, 'blocked', req)
        res.status(423).json({ status: 'error', message: `Cuenta bloqueada por múltiples intentos fallidos. Intenta de nuevo más tarde.`, code: 'ACCOUNT_LOCKED' })
        return
      }

      if (admin.estado !== 'activo') {
        res.status(403).json({ status: 'error', message: 'Cuenta inactiva.' })
        return
      }

      const match = await bcrypt.compare(contrasena, admin.contrasena_hash)
      if (!match) {
        await registrarIntentFallido('admins', admin.id)
        await logAuth('admin', admin.id, correo, 'login_fail', req)
        const restantes = MAX_INTENTOS - (admin.intentos_fallidos + 1)
        res.status(401).json({ ...CREDS_ERROR, ...(restantes > 0 && { intentos_restantes: restantes }) })
        return
      }

      // Éxito — reset contador, generar OTP
      await resetarIntentos('admins', admin.id)
      const otp = await generateAdminOTP(admin.id)
      await sendOTPEmail(admin.correo, admin.nombre, otp)
      await logAuth('admin', admin.id, correo, 'login_ok', req)

      res.json({ status: 'success', message: 'Código enviado a tu correo.', userId: admin.id, tipo: 'admin' })
      return
    }

    // 2. Buscar en aliados
    const [rows] = await pool.execute<any[]>(
      'SELECT id, nombre, correo, contrasena_hash, estado, intentos_fallidos, bloqueado_hasta FROM aliados WHERE correo = ?',
      [correo]
    )

    // Respuesta genérica si no existe (anti-enumeración: mismo mensaje)
    if (!rows.length) {
      // Hash ficticio para consumir tiempo igual (anti-timing attack)
      await bcrypt.compare(contrasena, '$2a$12$invalidhashinvalidhashinvalidhas')
      res.status(401).json(CREDS_ERROR)
      return
    }

    const aliado = rows[0]

    // Cuenta bloqueada
    if (estaBloqueado(aliado)) {
      await logAuth('aliado', aliado.id, correo, 'blocked', req)
      res.status(423).json({ status: 'error', message: 'Cuenta bloqueada por múltiples intentos fallidos. Intenta de nuevo en 15 minutos.', code: 'ACCOUNT_LOCKED' })
      return
    }

    const match = await bcrypt.compare(contrasena, aliado.contrasena_hash)
    if (!match) {
      await registrarIntentFallido('aliados', aliado.id)
      await logAuth('aliado', aliado.id, correo, 'login_fail', req)
      const restantes = MAX_INTENTOS - (aliado.intentos_fallidos + 1)
      res.status(401).json({ ...CREDS_ERROR, ...(restantes > 0 && { intentos_restantes: restantes }) })
      return
    }

    if (aliado.estado !== 'activo' && aliado.estado !== 'onboarding') {
      res.status(403).json({ status: 'error', message: 'Cuenta no verificada. Revisa tu correo.' })
      return
    }

    // Éxito
    await resetarIntentos('aliados', aliado.id)
    const otp = await generateOTP(aliado.id)
    await sendOTPEmail(aliado.correo, aliado.nombre ?? 'aliado', otp)
    await logAuth('aliado', aliado.id, correo, 'login_ok', req)

    res.json({ status: 'success', message: 'Código enviado a tu correo.', userId: aliado.id, tipo: 'aliado' })
  } catch (err) { next(err) }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/verificar-otp
// ─────────────────────────────────────────────────────────────────────────────
export async function verificarOTP(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, otp, tipo } = req.body

    if (tipo === 'admin') {
      const [rows] = await pool.execute<any[]>(
        'SELECT id, nombre, correo, rol FROM admins WHERE id = ? AND estado = "activo"',
        [userId]
      )
      if (!rows.length) { res.status(404).json({ status:'error', message:'No encontrado.' }); return }

      const valid = await verifyAdminOTP(userId, otp)
      if (!valid) {
        await logAuth('admin', userId, rows[0].correo, 'otp_fail', req)
        res.status(401).json({ status:'error', message:'Código inválido o expirado.' })
        return
      }

      const admin        = rows[0]
      const accessToken  = generateAccessToken(admin.id, admin.correo, 'admin', admin.rol)
      const refreshToken = await generateRefreshToken(admin.id, 'admin')
      await logAuth('admin', admin.id, admin.correo, 'otp_ok', req)
      res.cookie('refreshToken', refreshToken, COOKIE_OPTS)
      res.json({ status:'success', accessToken, user: { id:admin.id, nombre:admin.nombre, correo:admin.correo, tipo:'admin', rol:admin.rol } })
      return
    }

    // Aliado
    const [rows] = await pool.execute<any[]>(
      'SELECT id, nombre, correo, onboarding_step FROM aliados WHERE id = ? AND estado IN ("activo", "onboarding")',
      [userId]
    )
    if (!rows.length) { res.status(404).json({ status:'error', message:'No encontrado.' }); return }

    const valid = await verifyOTP(userId, otp)
    if (!valid) {
      await logAuth('aliado', userId, rows[0].correo, 'otp_fail', req)
      res.status(401).json({ status:'error', message:'Código inválido o expirado.' })
      return
    }

    const aliado       = rows[0]
    const step         = aliado.onboarding_step ?? 0
    const accessToken  = generateAccessToken(aliado.id, aliado.correo, 'aliado', undefined, step)
    const refreshToken = await generateRefreshToken(aliado.id)
    await logAuth('aliado', aliado.id, aliado.correo, 'otp_ok', req)
    res.cookie('refreshToken', refreshToken, COOKIE_OPTS)
    res.json({ status:'success', accessToken, user: { id:aliado.id, nombre:aliado.nombre, correo:aliado.correo, tipo:'aliado', onboarding_step: step } })
  } catch (err) { next(err) }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/refresh
// ─────────────────────────────────────────────────────────────────────────────
export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.refreshToken
    if (!token) { res.status(401).json({ status:'error', message:'Refresh token no encontrado.' }); return }

    const result = await verifyRefreshToken(token)
    if (!result) {
      res.clearCookie('refreshToken')
      res.status(401).json({ status:'error', message:'Refresh token inválido o expirado.' })
      return
    }

    const tipo = result.tipo
    let user: any = null

    if (tipo === 'admin') {
      const [adminRows] = await pool.execute<any[]>('SELECT id, correo, rol FROM admins WHERE id = ? AND estado = "activo"', [result.aliadoId])
      if (adminRows.length) user = adminRows[0]
    } else {
      const [aliadoRows] = await pool.execute<any[]>('SELECT id, correo, onboarding_step FROM aliados WHERE id = ? AND estado IN ("activo", "onboarding")', [result.aliadoId])
      if (aliadoRows.length) user = aliadoRows[0]
    }

    if (!user) { res.clearCookie('refreshToken'); res.status(401).json({ status:'error', message:'Usuario no encontrado.' }); return }

    await revokeRefreshToken(result.tokenId, tipo)
    const newRefreshToken = await generateRefreshToken(user.id, tipo)
    const accessToken     = generateAccessToken(user.id, user.correo, tipo, user.rol, tipo === 'aliado' ? (user.onboarding_step ?? undefined) : undefined)

    res.cookie('refreshToken', newRefreshToken, COOKIE_OPTS)
    res.json({ status:'success', accessToken })
  } catch (err) { next(err) }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/logout
// ─────────────────────────────────────────────────────────────────────────────
export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.aliado) {
      await revokeAllRefreshTokens(req.aliado.sub, req.aliado.tipo)
      await logAuth(req.aliado.tipo, req.aliado.sub, req.aliado.email, 'logout', req)
    }
    res.clearCookie('refreshToken', { path: '/' })
    res.json({ status:'success', message:'Sesión cerrada.' })
  } catch (err) { next(err) }
}
