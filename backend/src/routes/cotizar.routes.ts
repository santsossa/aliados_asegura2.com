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

// ── Normaliza el body igual que front-a2 antes de enviarlo a la API ─────────
const DOC_MAP: Record<string, number> = { CC: 1, CE: 2, PA: 3, NIT: 4, TI: 3 }
const GENDER_MAP: Record<string, number> = { M: 1, F: 2, Masculino: 1, Femenino: 2 }

function normalizeQuote(body: Record<string, any>): Record<string, any> {
  const m = { ...body }

  // documentTypeId → number
  if (typeof m.documentTypeId === 'string') {
    const asInt = parseInt(m.documentTypeId, 10)
    m.documentTypeId = isNaN(asInt) ? (DOC_MAP[m.documentTypeId] ?? 1) : asInt
  }

  // municipalityId → number
  if (typeof m.municipalityId === 'string') {
    const asInt = parseInt(m.municipalityId, 10)
    if (!isNaN(asInt)) m.municipalityId = asInt
  }

  // genderId → number (puede venir como 'M', 'F', 'Masculino', 'Femenino', 1 o 2)
  if (m.genderId !== undefined && m.genderId !== null) {
    const asInt = parseInt(String(m.genderId), 10)
    m.genderId = isNaN(asInt) ? (GENDER_MAP[m.genderId] ?? undefined) : asInt
  }
  if (!m.genderId) delete m.genderId

  // plate → uppercase
  if (m.plate) m.plate = String(m.plate).toUpperCase()

  // identification y mobileNumber → string
  if (m.identification !== undefined) m.identification = String(m.identification)
  if (m.mobileNumber   !== undefined) m.mobileNumber   = String(m.mobileNumber)

  return m
}

// ── Guardar cotización como actividad ──────────────────────────────────────
import { pool } from '../config/db'

router.post('/guardar', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const aliadoId = req.aliado!.sub
    const { placa, vehicleModel, datos_cotizacion, cliente_nombre, cliente_telefono, cliente_correo, comercial_value, cliente_cedula, cliente_tipo_doc } = req.body
    const now = new Date()
    const [result] = await pool.execute<any>(
      `INSERT INTO cotizaciones (aliado_id, placa, anio, datos_cotizacion, mes, anio_cot, cliente_nombre, cliente_telefono, cliente_correo, comercial_value, cliente_cedula, cliente_tipo_doc)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [aliadoId, placa || null, vehicleModel || null,
       JSON.stringify(datos_cotizacion || {}), now.getMonth() + 1, now.getFullYear(),
       cliente_nombre || null, cliente_telefono || null, cliente_correo || null,
       comercial_value || null, cliente_cedula || null, cliente_tipo_doc || null]
    )
    res.json({ status: 'success', id: result.insertId })
  } catch (err) { next(err) }
})

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
    const raw = r.data
    // Log para diagnóstico — ver estructura real de la respuesta
    console.log('[Fasecolda] raw:', JSON.stringify(raw).slice(0, 500))

    // La respuesta puede estar en raw.response, raw.data.response, o en raw directamente
    const inner = raw?.response ?? raw?.data?.response ?? raw ?? {}

    // Buscar valorAsegurado en todos los campos posibles
    function findVal(obj: any, depth = 0): number | null {
      if (!obj || typeof obj !== 'object' || depth > 4) return null
      for (const k of ['valorAsegurado','commercialValue','insuredValue','vehicleValue','valorVehiculo','valor','value','amount']) {
        const v = obj[k]
        if (v != null && v !== '') {
          const n = Number(String(v).replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, ''))
          if (!isNaN(n) && n > 1000000) return n // valores de vehículo son > 1M COP
        }
      }
      for (const k of Object.keys(obj)) {
        if (typeof obj[k] === 'object') {
          const v = findVal(obj[k], depth + 1)
          if (v != null) return v
        }
      }
      return null
    }

    const valorAsegurado = findVal(inner) ?? findVal(raw)
    const modelo = inner?.modelo ?? inner?.model ?? raw?.modelo ?? null

    console.log('[Fasecolda] valorAsegurado:', valorAsegurado, '| modelo:', modelo)
    res.json({ ...raw, _valorAsegurado: valorAsegurado, _modelo: modelo })
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
    const body = normalizeQuote(req.body)
    const r = await axios.post(
      `${INS_BASE}/api/InsuranceQuotation/lightVehicleOneRes`,
      body,
      { headers: INS_HEADERS }
    )
    res.json(r.data)
  } catch (err: any) {
    // Devuelve 200 con error embebido para que el frontend lo ignore (igual que front-a2)
    res.json({ response: null, error: err.response?.data || 'Error cotizando' })
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

      // Save to local DB
      try {
        const cotizacionId = req.body.cotizacion_id || null
        const fd_parsed = JSON.parse(req.body.formData || '{}')
        const pol_parsed = JSON.parse(req.body.poliza || '{}')
        const clienteNombre = `${fd_parsed.firstName || ''} ${fd_parsed.lastName || ''}`.trim()
        const clienteTel = String(fd_parsed.mobileNumber || fd_parsed.celular || '')
        const aseguradora = pol_parsed.company || ''
        const valorPrima = pol_parsed.price || 0

        const clienteCedula = String(fd_parsed.identification || '')
        const docTypeId = Number(fd_parsed.documentTypeId)
        const DOC_ID_MAP: Record<number,string> = { 1:'CC', 2:'CE', 3:'PA', 4:'NIT' }
        const clienteTipoDoc = DOC_ID_MAP[docTypeId] || 'CC'
        const placaEmitir = String(fd_parsed.plate || pol_parsed.plate || '').toUpperCase() || null

        if (cotizacionId) {
          await pool.execute(
            `UPDATE cotizaciones SET estado = 'enviada', cliente_cedula = COALESCE(cliente_cedula, ?), cliente_tipo_doc = COALESCE(cliente_tipo_doc, ?) WHERE id = ? AND aliado_id = ?`,
            [clienteCedula || null, clienteTipoDoc || null, cotizacionId, aliado.sub]
          )
        }
        await pool.execute(
          `INSERT INTO leads (aliado_id, cotizacion_id, cliente_nombre, cliente_telefono, aseguradora, valor_prima, cliente_cedula, cliente_tipo_doc, placa)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [aliado.sub, cotizacionId, clienteNombre, clienteTel, aseguradora, valorPrima, clienteCedula || null, clienteTipoDoc || null, placaEmitir]
        )
      } catch { /* no interrumpir si falla el guardado local */ }

      res.json(r.data)
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error enviando lead al CRM'
      res.status(err.response?.status || 500).json({ status: 'error', message: msg })
    }
  }
)

export default router
