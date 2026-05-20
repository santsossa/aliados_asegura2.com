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
import { sendLeadRecibidoEmail } from '../services/email.service'

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

    // Si Fasecolda reporta fallo (success:false o response:null) → informar al frontend
    const fasecoldaFallo = raw?.success === false || raw?.response == null

    const inner = raw?.response ?? raw?.data?.response ?? null

    // Buscar valorAsegurado solo si hay respuesta válida
    function findVal(obj: any, depth = 0): number | null {
      if (!obj || typeof obj !== 'object' || depth > 4) return null
      for (const k of ['valorAsegurado','commercialValue','insuredValue','vehicleValue','valorVehiculo','valor','value']) {
        const v = obj[k]
        if (v != null && v !== '') {
          const n = Number(String(v).replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, ''))
          if (!isNaN(n) && n > 1000000) return n
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

    const valorAsegurado = inner ? (findVal(inner) ?? findVal(raw)) : null
    const modelo = inner?.modelo ?? inner?.model ?? null

    res.json({ ...raw, _valorAsegurado: valorAsegurado, _modelo: modelo, _fasecoldaFallo: fasecoldaFallo })
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

// Mapeo tipo documento: string del portal → número que espera el CRM
// CRM: 1=CC, 2=CE, 3=TI, 4=Pasaporte, 5=NIT
const DOC_STR_TO_NUM: Record<string, number> = { CC: 1, CE: 2, TI: 3, PA: 4, NIT: 5 }

router.post('/emitir',
  memUpload.fields([
    { name: 'cedula_titular',    maxCount: 1 },
    { name: 'tarjeta_propiedad', maxCount: 1 },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const aliado = req.aliado!
      const files  = req.files as { [f: string]: Express.Multer.File[] }

      // Nota: la validación de documentos obligatorios se hace en el frontend.
      // El CRM los declara opcionales pero en práctica siempre se envían.

      // ── Normalizar formData para que coincida exactamente con la API del CRM ──
      let formDataParsed: Record<string, any> = {}
      try { formDataParsed = JSON.parse(req.body.formData || '{}') } catch {}

      // documentTypeId: convertir 'CC' → 1, 'CE' → 2, etc.
      const docTypeRaw = formDataParsed.documentTypeId
      const docTypeNum = typeof docTypeRaw === 'number'
        ? docTypeRaw
        : (DOC_STR_TO_NUM[String(docTypeRaw).toUpperCase()] ?? 1)

      // genderId: asegurar que sea número
      const genderRaw = formDataParsed.genderId ?? (formDataParsed.gender === 'F' ? 2 : 1)
      const genderNum = Number(genderRaw) || 1

      const formDataNorm = {
        identification:  String(formDataParsed.identification || ''),
        documentTypeId:  docTypeNum,
        firstName:       formDataParsed.firstName || '',
        lastName:        formDataParsed.lastName  || '',
        email:           formDataParsed.email     || '',
        mobileNumber:    String(formDataParsed.mobileNumber || formDataParsed.celular || ''),
        birthDate:       formDataParsed.birthDate || '',
        genderId:        genderNum,
        plate:           String(formDataParsed.plate || '').toUpperCase(),
        vehicleModel:    formDataParsed.vehicleModel || '',
        vehicleYear:     formDataParsed.vehicleYear  || formDataParsed.vehicleModel || null,
        city:            formDataParsed.city         || formDataParsed.cityName     || '',
        municipalityId:  formDataParsed.municipalityId ? Number(formDataParsed.municipalityId) : null,
        commercialValue: formDataParsed.commercialValue ? Number(formDataParsed.commercialValue) : null,
      }

      const fd = new FormData()
      fd.append('formData',      JSON.stringify(formDataNorm))
      fd.append('poliza',        req.body.poliza)
      fd.append('aliado_id',     aliado.sub)
      fd.append('aliado_nombre', req.body.aliado_nombre || aliado.email)

      const cedulaFile = files.cedula_titular[0]
      fd.append('cedula_titular', cedulaFile.buffer, { filename: cedulaFile.originalname, contentType: cedulaFile.mimetype })

      const tarjetaFile = files.tarjeta_propiedad[0]
      fd.append('tarjeta_propiedad', tarjetaFile.buffer, { filename: tarjetaFile.originalname, contentType: tarjetaFile.mimetype })

      const r = await axios.post(
        `${env.CRM_URL}/api/quotation/aliado-lead`,
        fd,
        {
          headers: {
            ...fd.getHeaders(),
            'X-API-Key': env.CRM_API_KEY,  // coincide exactamente con la documentación
          },
          maxBodyLength: Infinity,
        }
      )

      // Save to local DB — guardar lead y marcar cotizacion como enviada
      try {
        const cotizacionId = req.body.cotizacion_id || null
        const pol_parsed   = JSON.parse(req.body.poliza || '{}')
        const clienteNombre = `${formDataNorm.firstName} ${formDataNorm.lastName}`.trim()
        const aseguradora   = pol_parsed.company || ''
        const valorPrima    = pol_parsed.price || 0

        // Obtener el ID de cotización en el CRM si fue retornado
        const crmQuotationId = r.data?.data?.quotation_id
          || r.data?.quotation_id
          || null

        // Marcar cotizacion como enviada
        if (cotizacionId) {
          await pool.execute(
            `UPDATE cotizaciones SET estado = 'enviada' WHERE id = ? AND aliado_id = ?`,
            [cotizacionId, aliado.sub]
          )
        }

        // Crear lead local
        await pool.execute(
          `INSERT INTO leads (aliado_id, cotizacion_id, cliente_nombre, cliente_telefono, aseguradora, valor_prima, crm_lead_id)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [aliado.sub, cotizacionId, clienteNombre, formDataNorm.mobileNumber || '', aseguradora, valorPrima, crmQuotationId]
        )
      } catch { /* no interrumpir si falla el guardado local */ }

      // Email al aliado confirmando recepción del lead
      try {
        const [aliadoRows] = await pool.execute<any[]>(
          'SELECT nombre, correo FROM aliados WHERE id = ?', [aliado.sub]
        )
        if (aliadoRows.length) {
          sendLeadRecibidoEmail({
            to:             aliadoRows[0].correo,
            aliado_nombre:  aliadoRows[0].nombre || aliado.email,
            cliente_nombre: clienteNombre,
            aseguradora,
            valor_prima:    valorPrima,
            placa:          formDataNorm.plate || undefined,
          }).catch(() => {})
        }
      } catch { /* no interrumpir */ }

      res.json(r.data)
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error enviando lead al CRM'
      res.status(err.response?.status || 500).json({ status: 'error', message: msg })
    }
  }
)

export default router
