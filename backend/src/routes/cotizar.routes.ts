/**
 * Proxy routes para la API de seguros y el CRM
 * El frontend nunca ve las API keys — solo pasan por el backend
 */
import { Router, Request, Response, NextFunction } from 'express'
import axios from 'axios'
import multer from 'multer'
import FormData from 'form-data'
import { requireAuth } from '../middleware/auth'
import { env } from '../config/env'

const router = Router()
router.use(requireAuth)   // todas las rutas de cotizar requieren login

const INS_BASE = env.INSURANCE_API_URL
const INS_HEADERS = {
  'keyHeader':     env.INSURANCE_API_KEY,
  'Authorization': `Bearer ${env.INSURANCE_API_KEY}`,
  'Content-Type':  'application/json',
}

const CRM_HEADERS = {
  'Content-Type': 'application/json',
  'x-api-key':    env.CRM_API_KEY,
}

// ── Municipios ──────────────────────────────────────────────────────────────
router.get('/municipios', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await axios.get(`${INS_BASE}/api/General/municipalities`, { headers: INS_HEADERS })
    res.json(r.data)
  } catch (err: any) {
    res.status(err.response?.status || 500).json({ error: 'Error obteniendo municipios' })
  }
})

// ── Fasecolda (datos del vehículo por placa) ────────────────────────────────
router.post('/fasecolda', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await axios.post(`${INS_BASE}/api/InsuranceQuotation/vehicleFasecolda`, req.body, { headers: INS_HEADERS })
    res.json(r.data)
  } catch (err: any) {
    res.status(err.response?.status || 500).json({ error: 'Error consultando fasecolda' })
  }
})

// ── Proveedores activos ─────────────────────────────────────────────────────
router.get('/proveedores', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await axios.get(`${INS_BASE}/api/Insurance/insuranceProviderByType/1`, { headers: INS_HEADERS })
    res.json(r.data)
  } catch (err: any) {
    res.status(err.response?.status || 500).json({ error: 'Error obteniendo proveedores' })
  }
})

// ── Cotizar 1 proveedor ─────────────────────────────────────────────────────
router.post('/quote', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await axios.post(
      `${INS_BASE}/api/InsuranceQuotation/lightVehicleOneRes`,
      req.body,
      { headers: INS_HEADERS }
    )
    res.json(r.data)
  } catch (err: any) {
    res.status(err.response?.status || 500).json({ error: 'Error cotizando' })
  }
})

// ── Emitir lead al CRM (con documentos) ────────────────────────────────────
const memUpload = multer({ storage: multer.memoryStorage() })

router.post('/emitir',
  memUpload.fields([
    { name: 'cedula_titular',    maxCount: 1 },
    { name: 'tarjeta_propiedad', maxCount: 1 },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const aliado = req.aliado!
      const files  = req.files as { [f: string]: Express.Multer.File[] }

      const fd = new FormData()
      fd.append('formData',      req.body.formData)
      fd.append('poliza',        req.body.poliza)
      fd.append('aliado_id',     aliado.sub)
      fd.append('aliado_nombre', req.body.aliado_nombre || aliado.email)

      if (files?.cedula_titular?.[0]) {
        const f = files.cedula_titular[0]
        fd.append('cedula_titular', f.buffer, { filename: f.originalname, contentType: f.mimetype })
      }
      if (files?.tarjeta_propiedad?.[0]) {
        const f = files.tarjeta_propiedad[0]
        fd.append('tarjeta_propiedad', f.buffer, { filename: f.originalname, contentType: f.mimetype })
      }

      const r = await axios.post(
        `${env.CRM_URL}/api/quotation/aliado-lead`,
        fd,
        {
          headers: {
            ...fd.getHeaders(),
            'x-api-key': env.CRM_API_KEY,
          },
          maxBodyLength: Infinity,
        }
      )
      res.json(r.data)
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error enviando lead al CRM'
      res.status(err.response?.status || 500).json({ status: 'error', message: msg })
    }
  }
)

export default router
