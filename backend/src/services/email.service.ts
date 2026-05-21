import nodemailer from 'nodemailer'
import path from 'path'
import { env } from '../config/env'

// Usa Resend como SMTP (o cualquier proveedor SMTP)
const transporter = nodemailer.createTransport({
  host:   'smtp.resend.com',
  port:   465,
  secure: true,
  auth: {
    user: 'resend',
    pass: env.RESEND_API_KEY,
  },
})

// Rutas a los assets de email — disponibles tanto en dev (src/) como en prod (dist/ + assets/)
const ASSETS_DIR = path.join(process.cwd(), 'assets', 'email')

// Adjuntos CID reutilizables en todos los emails de marca
const BRAND_ATTACHMENTS = [
  { filename: 'logo.png',       path: path.join(ASSETS_DIR, 'logo.png'),       cid: 'emaillogo'   },
  { filename: 'correoab.png',   path: path.join(ASSETS_DIR, 'correoab.png'),   cid: 'correoab'    },
  { filename: 'correohandw.png',path: path.join(ASSETS_DIR, 'correohandw.png'),cid: 'correohandw' },
]

interface MailOptions {
  to:          string
  subject:     string
  html:        string
  attachments?: typeof BRAND_ATTACHMENTS
}

async function sendMail(opts: MailOptions): Promise<void> {
  if (env.NODE_ENV === 'development' && (!env.RESEND_API_KEY || env.RESEND_API_KEY.startsWith('re_xxx'))) {
    return
  }
  await transporter.sendMail({
    from:        `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM}>`,
    to:          opts.to,
    subject:     opts.subject,
    html:        opts.html,
    attachments: opts.attachments,
  })
}

// ── SVG icons inline (únicos que funcionan en todos los clientes de email) ──
const ICON = {
  clipboard: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2D2A7A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>`,
  bell:      `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#92400e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
  eye:       `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2D2A7A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  headset:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2D2A7A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>`,
  facebook:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="#2D2A7A"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.791-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>`,
  instagram: `<svg width="16" height="16" viewBox="0 0 24 24" fill="#2D2A7A"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>`,
  linkedin:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="#2D2A7A"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
}

// ── Correo de verificación ─────────────────────────────────────────────────
export async function sendVerificationEmail(
  to: string,
  nombre: string,
  token: string
): Promise<void> {
  const url = `${env.FRONTEND_URL}/verificar-correo?token=${token}`
  await sendMail({
    to,
    subject: 'Verifica tu correo — Asegura2.com',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;border-radius:16px">
        <h2 style="color:#2D2A7A;margin-bottom:8px">Hola, ${nombre} 👋</h2>
        <p style="color:#374151;font-size:15px;line-height:1.6">
          Gracias por registrarte en el <strong>Portal de Aliados de Asegura2.com</strong>.
          Haz clic en el botón de abajo para verificar tu correo y activar tu cuenta.
        </p>
        <a href="${url}" style="display:inline-block;margin-top:24px;background:#2D2A7A;color:#fff;padding:14px 28px;border-radius:99px;text-decoration:none;font-weight:700;font-size:15px">
          Verificar correo
        </a>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px">
          Este enlace expira en 24 horas. Si no creaste esta cuenta, ignora este correo.
        </p>
      </div>
    `,
  })
}

// ── Helper: layout base ───────────────────────────────────────────────────
function baseLayout(content: string): string {
  return `
  <!DOCTYPE html>
  <html lang="es">
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Asegura2.com</title></head>
  <body style="margin:0;padding:0;background:#f4f4f6;font-family:Inter,Helvetica,Arial,sans-serif">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f6;padding:32px 16px">
      <tr><td align="center">
        <table width="100%" style="max-width:560px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.07)">
          <!-- Header brand -->
          <tr>
            <td style="background:#2D2A7A;padding:24px 32px">
              <p style="margin:0;color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.3px">Asegura2.com</p>
              <p style="margin:4px 0 0;color:#a5b4fc;font-size:12px">Portal de Aliados</p>
            </td>
          </tr>
          <!-- Content -->
          <tr><td style="padding:32px 32px 24px">${content}</td></tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #f3f4f6;background:#fafafa">
              <p style="margin:0;color:#9ca3af;font-size:11px;line-height:1.6">
                Asegura2.com — Portal de Aliados · Bogotá, Colombia<br>
                Si tienes dudas escríbenos a <a href="mailto:aliados@asegura2.com.co" style="color:#2D2A7A">aliados@asegura2.com.co</a>
              </p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
  </html>`
}

function fmtCOP(n: number): string {
  return new Intl.NumberFormat('es-CO', { style:'currency', currency:'COP', maximumFractionDigits:0 }).format(n)
}

function nextPaymentDate(): string {
  const now = new Date()
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return next.toLocaleDateString('es-CO', { day:'numeric', month:'long', year:'numeric' })
}

// ── Email 1: Lead enviado a emitir ────────────────────────────────────────
export async function sendLeadRecibidoEmail(opts: {
  to: string
  aliado_nombre: string
  cliente_nombre: string
  aseguradora: string
  valor_prima: number
  placa?: string
}): Promise<void> {
  const comision  = Math.round(opts.valor_prima * 0.06)
  const portalUrl = `${(env.FRONTEND_URL || '').replace(/\/$/, '')}/dashboard/mis-polizas`

  await sendMail({
    to:          opts.to,
    subject:     `✅ Recibimos tu solicitud — ${opts.cliente_nombre}`,
    attachments: BRAND_ATTACHMENTS,
    html: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Asegura2.com</title>
  <style>
    /* ── Reset base ── */
    body, table, td { margin:0; padding:0; }
    img { border:0; display:block; }

    /* ── Responsive: apilado en móvil (≤ 600px) ── */
    @media only screen and (max-width: 600px) {

      /* Contenedor principal */
      .email-wrap { padding: 0 !important; }
      .email-card { border-radius: 0 !important; width: 100% !important; }

      /* Header */
      .hdr-gold  { display: none !important; }

      /* Hero: texto arriba, imagen abajo y centrada */
      .hero-text { width: 100% !important; display: block !important;
                   padding: 28px 20px 16px !important; }
      .hero-img  { width: 100% !important; display: block !important;
                   text-align: center !important; padding: 0 20px 24px !important; }
      .hero-img img { margin: 0 auto !important; max-width: 180px !important; }

      /* Padding general de secciones */
      .sec { padding-left: 16px !important; padding-right: 16px !important; }

      /* Footer: soporte arriba, handwriting abajo y centrado */
      .ft-support { width: 100% !important; display: block !important;
                    padding-bottom: 16px !important; }
      .ft-handw   { width: 100% !important; display: block !important;
                    text-align: center !important; }

      /* Bottom bar: logo centrado, íconos centrados */
      .bb-logo  { width: 100% !important; display: block !important;
                  text-align: center !important; padding-bottom: 12px !important; }
      .bb-icons { width: 100% !important; display: block !important;
                  text-align: center !important; }

      /* Fuentes */
      .hero-title { font-size: 24px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f0f0f5;font-family:Inter,Helvetica,Arial,sans-serif">

<table class="email-wrap" width="100%" cellpadding="0" cellspacing="0"
       style="background:#f0f0f5;padding:32px 16px">
<tr><td align="center">

<table class="email-card" width="100%" cellpadding="0" cellspacing="0"
       style="max-width:580px;background:#ffffff;border-radius:20px;overflow:hidden;
              box-shadow:0 4px 24px rgba(0,0,0,0.08)">

  <!-- ══ HEADER ══ -->
  <tr>
    <td style="background:#2D2A7A;padding:0">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:18px 28px;vertical-align:middle">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:middle;padding-right:18px">
                  <img src="cid:emaillogo" alt="Asegura2.com" height="36"
                       style="height:36px;max-height:36px" />
                </td>
                <td style="border-left:1px solid rgba(255,255,255,0.3);
                           padding-left:18px;vertical-align:middle">
                  <span style="font-size:13px;font-weight:600;color:#fff">Portal de Aliados</span>
                </td>
              </tr>
            </table>
          </td>
          <!-- Franja dorada — se oculta en móvil -->
          <td class="hdr-gold" width="72"
              style="background:linear-gradient(135deg,#F5C400,#f59e0b);
                     border-radius:0 0 0 36px">&nbsp;</td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ══ HERO (2 columnas → apila en móvil) ══ -->
  <tr>
    <td style="padding:0;background:#f8f8fc">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <!-- Texto -->
          <td class="hero-text"
              style="padding:36px 28px 28px;vertical-align:middle;width:54%">
            <h1 class="hero-title"
                style="margin:0 0 14px;font-size:28px;font-weight:900;
                       color:#1a1a2e;line-height:1.2">
              ¡Lo recibimos! 🎉
            </h1>
            <p style="margin:0;font-size:14px;color:#4b5563;line-height:1.7">
              Hola <strong style="color:#1a1a2e">${opts.aliado_nombre}</strong>,
              ya tenemos la solicitud de póliza que enviaste.
              Nuestro equipo de ventas ya está en contacto con el cliente.
            </p>
          </td>
          <!-- Ilustración -->
          <td class="hero-img"
              style="padding:20px 20px 0 0;vertical-align:bottom;
                     text-align:right;width:46%">
            <img src="cid:correoab" alt="Solicitud recibida" width="190"
                 style="max-width:190px;margin-left:auto" />
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ══ DETALLE CARD ══ -->
  <tr>
    <td class="sec" style="padding:24px 28px 0">
      <table width="100%" cellpadding="0" cellspacing="0"
             style="border:1.5px solid #e8e8f0;border-radius:14px;overflow:hidden">
        <!-- Encabezado -->
        <tr>
          <td colspan="2" style="padding:14px 18px;border-bottom:1px solid #e8e8f0;
                                  background:#fafafd">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:34px;height:34px;background:#ede9fe;border-radius:8px;
                           text-align:center;vertical-align:middle">
                  ${ICON.clipboard}
                </td>
                <td style="padding-left:10px">
                  <span style="font-size:14px;font-weight:700;color:#2D2A7A">
                    Detalle de la solicitud
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Filas -->
        <tr>
          <td style="padding:12px 18px;font-size:13px;color:#6b7280;
                     border-bottom:1px solid #f3f4f6">Cliente</td>
          <td style="padding:12px 18px;font-size:13px;font-weight:700;color:#111827;
                     text-align:right;border-bottom:1px solid #f3f4f6">${opts.cliente_nombre}</td>
        </tr>
        ${opts.placa ? `<tr>
          <td style="padding:12px 18px;font-size:13px;color:#6b7280;
                     border-bottom:1px solid #f3f4f6">Placa</td>
          <td style="padding:12px 18px;font-size:13px;font-weight:700;color:#111827;
                     text-align:right;border-bottom:1px solid #f3f4f6">${opts.placa}</td>
        </tr>` : ''}
        <tr>
          <td style="padding:12px 18px;font-size:13px;color:#6b7280;
                     border-bottom:1px solid #f3f4f6">Aseguradora</td>
          <td style="padding:12px 18px;font-size:13px;font-weight:700;color:#111827;
                     text-align:right;border-bottom:1px solid #f3f4f6">${opts.aseguradora}</td>
        </tr>
        <tr>
          <td style="padding:12px 18px;font-size:13px;color:#6b7280;
                     border-bottom:1.5px solid #e8e8f0">Prima anual</td>
          <td style="padding:12px 18px;font-size:13px;font-weight:700;color:#111827;
                     text-align:right;border-bottom:1.5px solid #e8e8f0">${fmtCOP(opts.valor_prima)}</td>
        </tr>
        <!-- Comisión destacada -->
        <tr style="background:#f5f4ff">
          <td style="padding:15px 18px;font-size:14px;font-weight:700;color:#2D2A7A">
            Tu comisión estimada (6%)
          </td>
          <td style="padding:15px 18px;font-size:18px;font-weight:900;color:#2D2A7A;
                     text-align:right">${fmtCOP(comision)}</td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ══ ¿QUÉ SIGUE? ══ -->
  <tr>
    <td class="sec" style="padding:18px 28px 0">
      <table width="100%" cellpadding="0" cellspacing="0"
             style="background:#fffbeb;border:1.5px solid #fde68a;border-radius:14px">
        <tr>
          <td style="padding:16px 12px 16px 18px;vertical-align:top;width:44px">
            <div style="width:36px;height:36px;background:#fef3c7;border-radius:50%;
                        text-align:center;line-height:36px">
              ${ICON.bell}
            </div>
          </td>
          <td style="padding:16px 18px 16px 4px">
            <p style="margin:0 0 5px;font-size:14px;font-weight:700;color:#92400e">
              ¿Qué sigue?
            </p>
            <p style="margin:0;font-size:13px;color:#78350f;line-height:1.65">
              Nuestro equipo contactará a <strong>${opts.cliente_nombre}</strong>
              para cerrar la venta. Te notificaremos por correo cuando la póliza
              sea aprobada o si hay alguna novedad.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ══ VER ESTADO ══ -->
  <tr>
    <td class="sec" style="padding:16px 28px 24px">
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:middle;padding-right:10px">${ICON.eye}</td>
          <td style="font-size:13px;color:#4b5563;vertical-align:middle">
            Puedes ver el estado en tu portal en la sección
            <a href="${portalUrl}"
               style="color:#2D2A7A;font-weight:700;text-decoration:none">Mis pólizas.</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Separador -->
  <tr>
    <td class="sec" style="padding:0 28px">
      <div style="height:1px;background:#e8e8f0"></div>
    </td>
  </tr>

  <!-- ══ FOOTER: soporte + handwriting (apila en móvil) ══ -->
  <tr>
    <td class="sec" style="padding:22px 28px 18px">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <!-- Soporte -->
          <td class="ft-support" style="vertical-align:middle">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:40px;height:40px;background:#ede9fe;border-radius:50%;
                           text-align:center;vertical-align:middle">
                  ${ICON.headset}
                </td>
                <td style="padding-left:12px">
                  <div style="font-size:12px;font-weight:700;color:#1a1a2e">
                    ¿Dudas? Estamos para ayudarte
                  </div>
                  <div style="font-size:11px;color:#6b7280;margin-top:3px">
                    Escríbenos a
                    <a href="mailto:aliados@asegura2.com.co"
                       style="color:#2D2A7A;text-decoration:none;font-weight:600">
                      aliados@asegura2.com.co
                    </a>
                  </div>
                </td>
              </tr>
            </table>
          </td>
          <!-- Handwriting -->
          <td class="ft-handw" style="text-align:right;vertical-align:middle">
            <img src="cid:correohandw" alt="¡Gracias por confiar en asegura2.com!"
                 height="54" style="max-height:54px" />
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ══ BOTTOM BAR (apila en móvil) ══ -->
  <tr>
    <td style="background:#f8f8fc;border-top:1px solid #e8e8f0">
      <table class="sec" width="100%" cellpadding="0" cellspacing="0"
             style="padding:14px 28px 16px">
        <tr>
          <!-- Logo -->
          <td class="bb-logo" style="vertical-align:middle">
            <img src="cid:emaillogo" alt="Asegura2.com" height="26"
                 style="height:26px;max-height:26px;margin-bottom:3px" />
            <div style="font-size:10px;color:#9ca3af">
              Portal de Aliados · Bogotá, Colombia
            </div>
          </td>
          <!-- Redes sociales -->
          <td class="bb-icons" style="text-align:right;vertical-align:middle">
            <a href="https://web.facebook.com/asegura2col"
               style="display:inline-block;margin-left:8px;width:32px;height:32px;
                      background:#edeef3;border-radius:50%;text-align:center;
                      line-height:32px;text-decoration:none">
              ${ICON.facebook}
            </a>
            <a href="https://www.instagram.com/asegura2col/"
               style="display:inline-block;margin-left:8px;width:32px;height:32px;
                      background:#edeef3;border-radius:50%;text-align:center;
                      line-height:32px;text-decoration:none">
              ${ICON.instagram}
            </a>
            <a href="https://www.linkedin.com/company/asegura2colombia"
               style="display:inline-block;margin-left:8px;width:32px;height:32px;
                      background:#edeef3;border-radius:50%;text-align:center;
                      line-height:32px;text-decoration:none">
              ${ICON.linkedin}
            </a>
          </td>
        </tr>
      </table>
      <p style="margin:0;padding:0 28px 14px;font-size:10px;color:#b0b4c1;text-align:center">
        Si tienes dudas escríbenos a
        <a href="mailto:aliados@asegura2.com.co"
           style="color:#2D2A7A;text-decoration:none">aliados@asegura2.com.co</a>
      </p>
    </td>
  </tr>

</table><!-- /email-card -->
</td></tr>
</table><!-- /email-wrap -->
</body>
</html>`,
  })
}

// ── Email 2: Póliza aprobada 🎉 ───────────────────────────────────────────
export async function sendPolizaAprobadaEmail(opts: {
  to: string
  aliado_nombre: string
  cliente_nombre: string
  aseguradora: string
  valor_prima: number
  valor_comision: number
  placa?: string
}): Promise<void> {
  const fechaPago = nextPaymentDate()
  await sendMail({
    to:      opts.to,
    subject: `💚 ¡Póliza aprobada! Ganas ${fmtCOP(opts.valor_comision)}`,
    html:    baseLayout(`
      <div style="text-align:center;padding:8px 0 24px">
        <div style="font-size:56px;margin-bottom:12px">🎉</div>
        <h2 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#111827">¡Póliza aprobada!</h2>
        <p style="margin:0;color:#6b7280;font-size:14px">
          Hola <strong>${opts.aliado_nombre}</strong>, el cliente realizó el pago. ¡Ya ganaste tu comisión!
        </p>
      </div>

      <!-- Comisión destacada -->
      <div style="background:linear-gradient(135deg,#2D2A7A 0%,#4338ca 100%);border-radius:16px;padding:24px;text-align:center;margin-bottom:24px">
        <p style="margin:0 0 4px;color:#c7d2fe;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em">Tu comisión</p>
        <p style="margin:0;color:#fff;font-size:40px;font-weight:800;letter-spacing:-1px">${fmtCOP(opts.valor_comision)}</p>
        <p style="margin:8px 0 0;color:#a5b4fc;font-size:13px">Se depositará el <strong style="color:#fff">${fechaPago}</strong></p>
      </div>

      <div style="background:#f9fafb;border-radius:12px;padding:20px 24px;margin-bottom:24px">
        <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em">Detalle de la póliza</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:6px 0;font-size:13px;color:#6b7280">Cliente</td>
              <td style="padding:6px 0;font-size:13px;font-weight:600;color:#111827;text-align:right">${opts.cliente_nombre}</td></tr>
          ${opts.placa ? `<tr><td style="padding:6px 0;font-size:13px;color:#6b7280">Placa</td>
              <td style="padding:6px 0;font-size:13px;font-weight:600;color:#111827;text-align:right">${opts.placa}</td></tr>` : ''}
          <tr><td style="padding:6px 0;font-size:13px;color:#6b7280">Aseguradora</td>
              <td style="padding:6px 0;font-size:13px;font-weight:600;color:#111827;text-align:right">${opts.aseguradora}</td></tr>
          <tr><td style="padding:6px 0;font-size:13px;color:#6b7280">Prima anual</td>
              <td style="padding:6px 0;font-size:13px;font-weight:600;color:#111827;text-align:right">${fmtCOP(opts.valor_prima)}</td></tr>
          <tr><td style="padding:6px 0;font-size:13px;color:#6b7280">Comisión (6%)</td>
              <td style="padding:6px 0;font-size:14px;font-weight:800;color:#16a34a;text-align:right">${fmtCOP(opts.valor_comision)}</td></tr>
          <tr><td style="padding:6px 0;font-size:13px;color:#6b7280">Fecha de pago</td>
              <td style="padding:6px 0;font-size:13px;font-weight:700;color:#2D2A7A;text-align:right">${fechaPago}</td></tr>
        </table>
      </div>

      <div style="background:#f0fdf4;border-radius:10px;padding:14px 18px">
        <p style="margin:0;font-size:13px;color:#166534;line-height:1.6">
          💡 <strong>Recuerda:</strong> El depósito se hace a la cuenta bancaria registrada en tu portal.
          Si quieres actualizar tu cuenta, ve a <strong>Mi información</strong>.
        </p>
      </div>
    `),
  })
}

// ── Email 3: Póliza no aprobada ───────────────────────────────────────────
export async function sendPolizaNoAprobadaEmail(opts: {
  to: string
  aliado_nombre: string
  cliente_nombre: string
  aseguradora: string
  placa?: string
  motivo: string
}): Promise<void> {
  await sendMail({
    to:      opts.to,
    subject: `Novedad sobre la póliza de ${opts.cliente_nombre}`,
    html:    baseLayout(`
      <h2 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#111827">Novedad en tu póliza</h2>
      <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6">
        Hola <strong>${opts.aliado_nombre}</strong>, te informamos que la póliza del siguiente cliente
        no pudo ser aprobada en esta ocasión.
      </p>

      <div style="background:#fef2f2;border:1.5px solid #fecaca;border-radius:12px;padding:20px 24px;margin-bottom:24px">
        <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:0.08em">Cliente no aprobado</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:6px 0;font-size:13px;color:#6b7280">Cliente</td>
              <td style="padding:6px 0;font-size:13px;font-weight:600;color:#111827;text-align:right">${opts.cliente_nombre}</td></tr>
          ${opts.placa ? `<tr><td style="padding:6px 0;font-size:13px;color:#6b7280">Placa</td>
              <td style="padding:6px 0;font-size:13px;font-weight:600;color:#111827;text-align:right">${opts.placa}</td></tr>` : ''}
          <tr><td style="padding:6px 0;font-size:13px;color:#6b7280">Aseguradora</td>
              <td style="padding:6px 0;font-size:13px;font-weight:600;color:#111827;text-align:right">${opts.aseguradora}</td></tr>
        </table>
      </div>

      <div style="background:#fff7ed;border-left:4px solid #f97316;border-radius:0 10px 10px 0;padding:16px 20px;margin-bottom:24px">
        <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#c2410c;text-transform:uppercase;letter-spacing:0.06em">Motivo</p>
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.7">${opts.motivo}</p>
      </div>

      <div style="background:#eff6ff;border-radius:10px;padding:14px 18px">
        <p style="margin:0;font-size:13px;color:#1d4ed8;line-height:1.6">
          💡 <strong>¿Qué puedes hacer?</strong> Puedes intentar con este cliente en una nueva cotización
          en el futuro, o cotizar con una aseguradora diferente que se ajuste mejor a su perfil.
          Entra a tu portal y empieza una nueva cotización cuando quieras.
        </p>
      </div>
    `),
  })
}

// ── Correo con OTP ────────────────────────────────────────────────────────
export async function sendOTPEmail(
  to: string,
  nombre: string | null | undefined,
  otp: string
): Promise<void> {
  const saludo = nombre
    ? `<h2 style="color:#2D2A7A;margin-bottom:8px">Hola, ${nombre} 👋</h2>
       <p style="color:#374151;font-size:15px;line-height:1.6">
         Este es tu código de acceso al Portal de Aliados de Asegura2.com:
       </p>`
    : `<p style="color:#374151;font-size:15px;line-height:1.6;margin-bottom:8px">
         Tu código de verificación es:
       </p>`

  await sendMail({
    to,
    subject: `${otp} es tu código de acceso — Asegura2.com`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;border-radius:16px">
        ${saludo}
        <div style="background:#eeedf8;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
          <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#2D2A7A">${otp}</span>
        </div>
        <p style="color:#9ca3af;font-size:12px">
          Expira en ${env.OTP_EXPIRES_MINUTES} minutos. Si no solicitaste este código, ignora este correo.
        </p>
      </div>
    `,
  })
}
