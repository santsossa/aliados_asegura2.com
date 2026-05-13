import { Router } from 'express'
import { body } from 'express-validator'
import { requireAuth } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { pool } from '../config/db'
import bcrypt from 'bcryptjs'

const router = Router()
router.use(requireAuth)

// GET /api/aliados/me — perfil del aliado autenticado
router.get('/me', async (req, res, next) => {
  try {
    const [rows] = await pool.execute<any[]>(
      `SELECT a.id, a.nombre, a.cedula, a.correo, a.telefono, a.ciudad, a.tipo_aliado, a.estado, a.created_at,
              b.banco, b.tipo_cuenta, b.numero_cuenta, b.titular
       FROM aliados a
       LEFT JOIN aliado_banco b ON b.aliado_id = a.id
       WHERE a.id = ?`,
      [req.aliado!.sub]
    )
    if (!rows.length) { res.status(404).json({ status:'error', message:'Aliado no encontrado' }); return }
    res.json({ status:'success', data: rows[0] })
  } catch (err) { next(err) }
})

// PUT /api/aliados/me — actualizar perfil
router.put('/me',
  [
    body('nombre').optional().trim().isLength({ min:2, max:100 }),
    body('telefono').optional().trim().isLength({ min:7, max:20 }),
    body('ciudad').optional().trim().isLength({ min:2, max:80 }),
  ],
  validate,
  async (req: any, res: any, next: any) => {
    try {
      const { nombre, telefono, ciudad } = req.body
      await pool.execute(
        'UPDATE aliados SET nombre=COALESCE(?,nombre), telefono=COALESCE(?,telefono), ciudad=COALESCE(?,ciudad) WHERE id=?',
        [nombre||null, telefono||null, ciudad||null, req.aliado!.sub]
      )
      res.json({ status:'success', message:'Perfil actualizado.' })
    } catch (err) { next(err) }
  }
)

// PUT /api/aliados/me/banco — guardar/actualizar cuenta bancaria
router.put('/me/banco',
  [
    body('banco').trim().isLength({ min:2, max:80 }).withMessage('Banco inválido'),
    body('tipo_cuenta').isIn(['Ahorros','Corriente']).withMessage('Tipo de cuenta inválido'),
    body('numero_cuenta').trim().isLength({ min:5, max:30 }).withMessage('Número de cuenta inválido'),
    body('titular').trim().isLength({ min:2, max:100 }).withMessage('Titular inválido'),
  ],
  validate,
  async (req: any, res: any, next: any) => {
    try {
      const { banco, tipo_cuenta, numero_cuenta, titular } = req.body
      await pool.execute(
        `INSERT INTO aliado_banco (aliado_id, banco, tipo_cuenta, numero_cuenta, titular)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE banco=VALUES(banco), tipo_cuenta=VALUES(tipo_cuenta),
           numero_cuenta=VALUES(numero_cuenta), titular=VALUES(titular)`,
        [req.aliado!.sub, banco, tipo_cuenta, numero_cuenta, titular]
      )
      res.json({ status:'success', message:'Cuenta bancaria guardada.' })
    } catch (err) { next(err) }
  }
)

// PUT /api/aliados/me/contrasena — cambiar contraseña
router.put('/me/contrasena',
  [
    body('contrasena_actual').notEmpty(),
    body('contrasena_nueva').isLength({ min:8 }).withMessage('Mínimo 8 caracteres'),
  ],
  validate,
  async (req: any, res: any, next: any) => {
    try {
      const { contrasena_actual, contrasena_nueva } = req.body
      const [rows] = await pool.execute<any[]>('SELECT contrasena_hash FROM aliados WHERE id=?', [req.aliado!.sub])
      const match = await bcrypt.compare(contrasena_actual, rows[0].contrasena_hash)
      if (!match) { res.status(401).json({ status:'error', message:'Contraseña actual incorrecta.' }); return }
      const hash = await bcrypt.hash(contrasena_nueva, 12)
      await pool.execute('UPDATE aliados SET contrasena_hash=? WHERE id=?', [hash, req.aliado!.sub])
      res.json({ status:'success', message:'Contraseña actualizada.' })
    } catch (err) { next(err) }
  }
)

export default router
