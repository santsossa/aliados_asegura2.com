import nodemailer from 'nodemailer'
import { env } from '../config/env'

// Usa Resend como SMTP
const transporter = nodemailer.createTransport({
  host:   'smtp.resend.com',
  port:   465,
  secure: true,
  auth: { user: 'resend', pass: env.RESEND_API_KEY },
})

interface MailOptions {
  to:      string
  subject: string
  html:    string
}

async function sendMail(opts: MailOptions): Promise<void> {
  if (env.NODE_ENV === 'development' && (!env.RESEND_API_KEY || env.RESEND_API_KEY.startsWith('re_xxx'))) {
    return
  }
  await transporter.sendMail({
    from:    `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM}>`,
    to:      opts.to,
    subject: opts.subject,
    html:    opts.html,
    // Sin adjuntos — las imágenes van por URL HTTPS pública (igual que Davivienda)
  })
}

/**
 * Círculo con emoji que NUNCA se distorsiona en móvil.
 * Usa atributos HTML width/height (procesados antes que CSS por email clients)
 * + min-width en style como doble seguro.
 */
function circle(emoji: string, bg: string, size = 40, fontSize = 20): string {
  return `<table cellpadding="0" cellspacing="0">
<tr><td width="${size}" height="${size}"
      style="width:${size}px;height:${size}px;min-width:${size}px;
             background:${bg};border-radius:${size / 2}px;
             text-align:center;vertical-align:middle;
             font-size:${fontSize}px;line-height:${size}px"
>${emoji}</td></tr></table>`
}

/**
 * Círculo con SVG inline para iconos de redes sociales.
 * El fondo se ve siempre (cualquier cliente); el SVG se ve en clientes modernos.
 */
function svgCircle(svgPath: string, bg: string, size = 32, iconSize = 16): string {
  return `<table cellpadding="0" cellspacing="0">
<tr><td width="${size}" height="${size}"
      style="width:${size}px;height:${size}px;min-width:${size}px;
             background:${bg};border-radius:${size / 2}px;
             text-align:center;vertical-align:middle">
  <svg xmlns="http://www.w3.org/2000/svg"
       viewBox="0 0 24 24" fill="#ffffff"
       width="${iconSize}" height="${iconSize}"
       style="display:inline-block;vertical-align:middle">
    ${svgPath}
  </svg>
</td></tr></table>`
}

// Paths de los iconos de redes (brand-standard)
const FB_PATH  = `<path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.791-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>`
const IG_PATH  = `<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>`
const LI_PATH  = `<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>`

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
  to:             string
  aliado_nombre:  string
  cliente_nombre: string
  aseguradora:    string
  valor_prima:    number
  placa?:         string
}): Promise<void> {
  const comision  = Math.round(opts.valor_prima * 0.06)
  const base      = (env.FRONTEND_URL || '').replace(/\/$/, '')
  const imgLogo   = `${base}/logo-email.png`   // frontend/public/logo-email.png
  const imgSobre  = `${base}/correoab.png`      // frontend/public/correoab.png
  const imgHandw  = `${base}/correohandw.png`   // frontend/public/correohandw.png
  const portalUrl = `${base}/dashboard/mis-polizas`

  await sendMail({
    to:      opts.to,
    subject: `✅ Recibimos tu solicitud — ${opts.cliente_nombre}`,
    html: `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Asegura2.com — Portal de Aliados</title>
  </style>
</head>
<body style="margin:0;padding:0;background:#f0f0f5;font-family:Arial,Helvetica,sans-serif">

<table align="center" cellpadding="0" cellspacing="0" width="100%"
       style="background:#f0f0f5;padding:24px 12px">
<tr><td align="center">

<table cellpadding="0" cellspacing="0" width="100%"
       style="max-width:580px;background:#ffffff;border-radius:16px;
              overflow:hidden;border:1px solid #e8e8f0">

  <!-- ══ HEADER — fondo blanco, logo real ══ -->
  <tr>
    <td style="background:#ffffff;padding:16px 28px;
               border-bottom:2px solid #2D2A7A">
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="vertical-align:middle">
            <img src="${imgLogo}" alt="Asegura2.com"
                 height="38" style="display:block;height:38px;border:0" />
          </td>
          <td align="right" style="vertical-align:middle">
            <span style="font-size:12px;font-weight:600;color:#2D2A7A">
              Portal de Aliados
            </span>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ══ HERO: texto izq + sobre der ══ -->
  <tr>
    <td style="background:#f4f4f8;padding:0">
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding:28px 24px 20px;vertical-align:middle;width:54%">
            <h1 style="margin:0 0 10px;font-size:24px;font-weight:900;
                       color:#1a1a2e;line-height:1.2;font-family:Arial,sans-serif">
              &#161;Lo recibimos!&nbsp;&#127881;
            </h1>
            <p style="margin:0;font-size:13px;color:#4b5563;line-height:1.65;
                      font-family:Arial,sans-serif">
              Hola <strong style="color:#1a1a2e">${opts.aliado_nombre}</strong>,
              ya tenemos la solicitud de p&#243;liza que enviaste.
              Nuestro equipo de ventas ya est&#225; en contacto con el cliente.
            </p>
          </td>
          <td style="vertical-align:middle;text-align:center;
                     padding:20px 12px 20px 0;width:46%">
            <img src="${imgSobre}" alt="Solicitud recibida"
                 width="240" style="display:block;width:240px;
                                    max-width:100%;margin:0 auto;border:0" />
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ══ DETALLE CARD ══ -->
  <tr>
    <td style="padding:22px 24px 0">
      <table cellpadding="0" cellspacing="0" width="100%"
             style="border:1px solid #e2e3e8;border-radius:12px;overflow:hidden">
        <!-- Encabezado con emoji en círculo de tabla -->
        <tr>
          <td colspan="2" style="padding:12px 16px;background:#f8f8fc;
                                  border-bottom:1px solid #e2e3e8">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td>${circle('&#128203;', '#ede9fe', 34, 18)}</td>
                <td style="padding-left:10px;font-size:14px;font-weight:700;
                           color:#2D2A7A;font-family:Arial,sans-serif">
                  Detalle de la solicitud
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 16px;font-size:13px;color:#6b7280;
                     border-bottom:1px solid #f3f4f6;font-family:Arial,sans-serif">
            Cliente</td>
          <td style="padding:10px 16px;font-size:13px;font-weight:700;
                     color:#111827;text-align:right;border-bottom:1px solid #f3f4f6;
                     font-family:Arial,sans-serif">${opts.cliente_nombre}</td>
        </tr>
        ${opts.placa ? `<tr>
          <td style="padding:10px 16px;font-size:13px;color:#6b7280;
                     border-bottom:1px solid #f3f4f6;font-family:Arial,sans-serif">
            Placa</td>
          <td style="padding:10px 16px;font-size:13px;font-weight:700;
                     color:#111827;text-align:right;border-bottom:1px solid #f3f4f6;
                     font-family:Arial,sans-serif">${opts.placa}</td>
        </tr>` : ''}
        <tr>
          <td style="padding:10px 16px;font-size:13px;color:#6b7280;
                     border-bottom:1px solid #f3f4f6;font-family:Arial,sans-serif">
            Aseguradora</td>
          <td style="padding:10px 16px;font-size:13px;font-weight:700;
                     color:#111827;text-align:right;border-bottom:1px solid #f3f4f6;
                     font-family:Arial,sans-serif">${opts.aseguradora}</td>
        </tr>
        <tr>
          <td style="padding:10px 16px;font-size:13px;color:#6b7280;
                     border-bottom:2px solid #e2e3e8;font-family:Arial,sans-serif">
            Prima anual</td>
          <td style="padding:10px 16px;font-size:13px;font-weight:700;
                     color:#111827;text-align:right;border-bottom:2px solid #e2e3e8;
                     font-family:Arial,sans-serif">${fmtCOP(opts.valor_prima)}</td>
        </tr>
        <tr style="background:#f0eeff">
          <td style="padding:13px 16px;font-size:14px;font-weight:700;
                     color:#2D2A7A;font-family:Arial,sans-serif">
            Tu comisi&#243;n estimada (6%)</td>
          <td style="padding:13px 16px;font-size:18px;font-weight:900;
                     color:#2D2A7A;text-align:right;font-family:Arial,sans-serif">
            ${fmtCOP(comision)}</td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ══ ¿QUÉ SIGUE? ══ -->
  <tr>
    <td style="padding:18px 24px 0">
      <table cellpadding="0" cellspacing="0" width="100%"
             style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px">
        <tr>
          <td width="52" style="padding:14px 8px 14px 14px;vertical-align:top">
            ${circle('&#128276;', '#fef3c7', 36, 19)}
          </td>
          <td style="padding:14px 16px 14px 4px;font-family:Arial,sans-serif">
            <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#92400e">
              &#191;Qu&#233; sigue?</p>
            <p style="margin:0;font-size:12px;color:#78350f;line-height:1.6">
              Nuestro equipo contactar&#225; a
              <strong>${opts.cliente_nombre}</strong> para cerrar la venta.
              Te notificaremos por correo cuando la p&#243;liza sea aprobada
              o si hay alguna novedad.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ══ VER ESTADO ══ -->
  <tr>
    <td style="padding:14px 24px 20px">
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td width="26" style="font-size:16px;vertical-align:middle">&#128065;</td>
          <td style="padding-left:6px;font-size:13px;color:#4b5563;
                     vertical-align:middle;font-family:Arial,sans-serif">
            Puedes ver el estado en tu portal en la secci&#243;n
            <a href="${portalUrl}"
               style="color:#2D2A7A;font-weight:700;text-decoration:none">
              Mis p&#243;lizas.</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Separador -->
  <tr>
    <td style="padding:0 24px">
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr><td height="1" style="background:#e8e8f0;font-size:0;line-height:0">&nbsp;</td></tr>
      </table>
    </td>
  </tr>

  <!-- ══ FOOTER: soporte + handwriting GRANDE ══ -->
  <tr>
    <td style="padding:18px 24px 14px">
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <!-- Soporte (izquierda) -->
          <td style="vertical-align:middle;width:50%">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:middle">
                  ${circle('&#127911;', '#ede9fe', 40, 20)}
                </td>
                <td style="padding-left:10px;vertical-align:middle">
                  <div style="font-size:12px;font-weight:700;color:#1a1a2e;
                              font-family:Arial,sans-serif">
                    &#191;Dudas? Estamos para ayudarte
                  </div>
                  <div style="font-size:11px;color:#6b7280;margin-top:3px;
                              font-family:Arial,sans-serif">
                    <a href="mailto:aliados@asegura2.com.co"
                       style="color:#2D2A7A;text-decoration:none;font-weight:600">
                      aliados@asegura2.com.co</a>
                  </div>
                </td>
              </tr>
            </table>
          </td>
          <!-- Handwriting MUY GRANDE -->
          <td style="text-align:right;vertical-align:middle;width:50%">
            <img src="${imgHandw}"
                 alt="Gracias por confiar en asegura2.com"
                 height="130" style="display:inline-block;max-height:130px;
                                     max-width:100%;border:0" />
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ══ BOTTOM BAR ══ -->
  <tr>
    <td style="background:#f8f8fc;border-top:1px solid #e8e8f0;
               padding:12px 24px 14px">
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <!-- Logo pequeño -->
          <td style="vertical-align:middle">
            <img src="${imgLogo}" alt="Asegura2.com"
                 height="26" style="display:block;height:26px;border:0;margin-bottom:2px" />
            <div style="font-size:10px;color:#9ca3af;font-family:Arial,sans-serif">
              Portal de Aliados &middot; Bogot&#225;, Colombia
            </div>
          </td>
          <!-- Redes — cada una en su propia TD para no distorsionarse -->
          <td align="right" style="vertical-align:middle">
            <table cellpadding="0" cellspacing="4">
              <tr>
                <td style="padding:0 3px">
                  <a href="https://web.facebook.com/asegura2col" style="text-decoration:none">
                    <img src="${base}/icons/facebook.png" alt="Facebook"
                         width="32" height="32"
                         style="display:block;width:32px;height:32px;border:0;border-radius:50%" />
                  </a>
                </td>
                <td style="padding:0 3px">
                  <a href="https://www.instagram.com/asegura2col/" style="text-decoration:none">
                    <img src="${base}/icons/instagram.png" alt="Instagram"
                         width="32" height="32"
                         style="display:block;width:32px;height:32px;border:0;border-radius:50%" />
                  </a>
                </td>
                <td style="padding:0 3px">
                  <a href="https://www.linkedin.com/company/asegura2colombia" style="text-decoration:none">
                    <img src="${base}/icons/linkedin.png" alt="LinkedIn"
                         width="32" height="32"
                         style="display:block;width:32px;height:32px;border:0;border-radius:6px" />
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <p style="margin:8px 0 0;font-size:10px;color:#b0b4c1;text-align:center;
                font-family:Arial,sans-serif">
        Si tienes dudas escr&#237;benos a
        <a href="mailto:aliados@asegura2.com.co"
           style="color:#2D2A7A;text-decoration:none">aliados@asegura2.com.co</a>
      </p>
    </td>
  </tr>

</table><!-- /card -->
</td></tr>
</table><!-- /wrap -->
</body>
</html>`,
  })
}

// ── Secciones HTML reutilizables ─────────────────────────────────────────
function emailHeader(imgLogo: string): string {
  return `
  <tr>
    <td style="background:#ffffff;padding:16px 28px;border-bottom:2px solid #2D2A7A">
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="vertical-align:middle">
            <img src="${imgLogo}" alt="Asegura2.com"
                 height="38" style="display:block;height:38px;border:0" />
          </td>
          <td align="right" style="vertical-align:middle">
            <span style="font-size:12px;font-weight:600;color:#2D2A7A;font-family:Arial,sans-serif">
              Portal de Aliados
            </span>
          </td>
        </tr>
      </table>
    </td>
  </tr>`
}

function emailVerEstado(portalUrl: string, label = 'Mis p&#243;lizas'): string {
  return `
  <tr>
    <td style="padding:14px 24px 20px">
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td width="26" style="font-size:16px;vertical-align:middle">&#128065;</td>
          <td style="padding-left:6px;font-size:13px;color:#4b5563;vertical-align:middle;font-family:Arial,sans-serif">
            Puedes ver el estado en tu portal en la secci&#243;n
            <a href="${portalUrl}" style="color:#2D2A7A;font-weight:700;text-decoration:none">${label}.</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:0 24px">
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr><td height="1" style="background:#e8e8f0;font-size:0;line-height:0">&nbsp;</td></tr>
      </table>
    </td>
  </tr>`
}

function emailFooter(imgLogo: string, imgHandw: string, base: string): string {
  return `
  <tr>
    <td style="padding:18px 24px 14px">
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="vertical-align:middle;width:50%">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:middle">${circle('&#127911;', '#ede9fe', 40, 20)}</td>
                <td style="padding-left:10px;vertical-align:middle">
                  <div style="font-size:12px;font-weight:700;color:#1a1a2e;font-family:Arial,sans-serif">
                    &#191;Dudas? Estamos para ayudarte
                  </div>
                  <div style="font-size:11px;color:#6b7280;margin-top:3px;font-family:Arial,sans-serif">
                    <a href="mailto:aliados@asegura2.com.co"
                       style="color:#2D2A7A;text-decoration:none;font-weight:600">
                      aliados@asegura2.com.co</a>
                  </div>
                </td>
              </tr>
            </table>
          </td>
          <td style="text-align:right;vertical-align:middle;width:50%">
            <img src="${imgHandw}" alt="Gracias por confiar en asegura2.com"
                 height="130" style="display:inline-block;max-height:130px;max-width:100%;border:0" />
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="background:#f8f8fc;border-top:1px solid #e8e8f0;padding:12px 24px 14px">
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="vertical-align:middle">
            <img src="${imgLogo}" alt="Asegura2.com"
                 height="26" style="display:block;height:26px;border:0;margin-bottom:2px" />
            <div style="font-size:10px;color:#9ca3af;font-family:Arial,sans-serif">
              Portal de Aliados &middot; Bogot&#225;, Colombia
            </div>
          </td>
          <td align="right" style="vertical-align:middle">
            <table cellpadding="0" cellspacing="4">
              <tr>
                <td style="padding:0 3px">
                  <a href="https://web.facebook.com/asegura2col" style="text-decoration:none">
                    <img src="${base}/icons/facebook.png" alt="Facebook"
                         width="32" height="32"
                         style="display:block;width:32px;height:32px;border:0;border-radius:50%" />
                  </a>
                </td>
                <td style="padding:0 3px">
                  <a href="https://www.instagram.com/asegura2col/" style="text-decoration:none">
                    <img src="${base}/icons/instagram.png" alt="Instagram"
                         width="32" height="32"
                         style="display:block;width:32px;height:32px;border:0;border-radius:50%" />
                  </a>
                </td>
                <td style="padding:0 3px">
                  <a href="https://www.linkedin.com/company/asegura2colombia" style="text-decoration:none">
                    <img src="${base}/icons/linkedin.png" alt="LinkedIn"
                         width="32" height="32"
                         style="display:block;width:32px;height:32px;border:0;border-radius:6px" />
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <p style="margin:8px 0 0;font-size:10px;color:#b0b4c1;text-align:center;font-family:Arial,sans-serif">
        Si tienes dudas escr&#237;benos a
        <a href="mailto:aliados@asegura2.com.co" style="color:#2D2A7A;text-decoration:none">
          aliados@asegura2.com.co</a>
      </p>
    </td>
  </tr>`
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
  const fechaPago  = nextPaymentDate()
  const base       = (env.FRONTEND_URL || '').replace(/\/$/, '')
  const imgLogo    = `${base}/logo-email.png`
  const imgHandw   = `${base}/correohandw.png`
  const portalUrl  = `${base}/dashboard/mis-polizas?tab=aprobada`

  await sendMail({
    to:      opts.to,
    subject: `💚 ¡Póliza aprobada! Ganas ${fmtCOP(opts.valor_comision)}`,
    html: `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Asegura2.com — Póliza aprobada</title>
</head>
<body style="margin:0;padding:0;background:#f0f0f5;font-family:Arial,Helvetica,sans-serif">
<table align="center" cellpadding="0" cellspacing="0" width="100%" style="background:#f0f0f5;padding:24px 12px">
<tr><td align="center">
<table cellpadding="0" cellspacing="0" width="100%"
       style="max-width:580px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e8e8f0">

  ${emailHeader(imgLogo)}

  <!-- CONTENIDO -->
  <tr>
    <td style="padding:28px 24px 0">

      <!-- Título -->
      <div style="text-align:center;padding-bottom:20px">
        <div style="font-size:48px;margin-bottom:10px">&#127881;</div>
        <h2 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#111827;font-family:Arial,sans-serif">
          &#161;P&#243;liza aprobada!
        </h2>
        <p style="margin:0;color:#6b7280;font-size:14px;font-family:Arial,sans-serif">
          Hola <strong style="color:#111827">${opts.aliado_nombre}</strong>,
          el cliente realiz&#243; el pago. &#161;Ya ganaste tu comisi&#243;n!
        </p>
      </div>

      <!-- Comisión destacada -->
      <table cellpadding="0" cellspacing="0" width="100%"
             style="background:#2D2A7A;border-radius:14px;margin-bottom:20px">
        <tr>
          <td style="padding:22px;text-align:center">
            <p style="margin:0 0 4px;color:#c7d2fe;font-size:11px;font-weight:700;
                      text-transform:uppercase;letter-spacing:0.08em;font-family:Arial,sans-serif">
              Tu comisi&#243;n
            </p>
            <p style="margin:0;color:#ffffff;font-size:38px;font-weight:800;
                      letter-spacing:-1px;font-family:Arial,sans-serif">
              ${fmtCOP(opts.valor_comision)}
            </p>
            <p style="margin:8px 0 0;color:#a5b4fc;font-size:13px;font-family:Arial,sans-serif">
              Se depositar&#225; el <strong style="color:#fff">${fechaPago}</strong>
            </p>
          </td>
        </tr>
      </table>

      <!-- Detalle -->
      <table cellpadding="0" cellspacing="0" width="100%"
             style="background:#f9fafb;border-radius:12px;overflow:hidden;margin-bottom:20px">
        <tr>
          <td colspan="2" style="padding:12px 16px;background:#f1f1f7;border-bottom:1px solid #e2e3e8">
            <span style="font-size:11px;font-weight:700;color:#6b7280;
                         text-transform:uppercase;letter-spacing:0.08em;font-family:Arial,sans-serif">
              Detalle de la p&#243;liza
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding:9px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;font-family:Arial,sans-serif">Cliente</td>
          <td style="padding:9px 16px;font-size:13px;font-weight:600;color:#111827;text-align:right;border-bottom:1px solid #f3f4f6;font-family:Arial,sans-serif">${opts.cliente_nombre}</td>
        </tr>
        ${opts.placa ? `<tr>
          <td style="padding:9px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;font-family:Arial,sans-serif">Placa</td>
          <td style="padding:9px 16px;font-size:13px;font-weight:600;color:#111827;text-align:right;border-bottom:1px solid #f3f4f6;font-family:Arial,sans-serif">${opts.placa}</td>
        </tr>` : ''}
        <tr>
          <td style="padding:9px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;font-family:Arial,sans-serif">Aseguradora</td>
          <td style="padding:9px 16px;font-size:13px;font-weight:600;color:#111827;text-align:right;border-bottom:1px solid #f3f4f6;font-family:Arial,sans-serif">${opts.aseguradora}</td>
        </tr>
        <tr>
          <td style="padding:9px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;font-family:Arial,sans-serif">Prima anual</td>
          <td style="padding:9px 16px;font-size:13px;font-weight:600;color:#111827;text-align:right;border-bottom:1px solid #f3f4f6;font-family:Arial,sans-serif">${fmtCOP(opts.valor_prima)}</td>
        </tr>
        <tr style="background:#f0eeff">
          <td style="padding:12px 16px;font-size:13px;font-weight:700;color:#2D2A7A;font-family:Arial,sans-serif">Comisi&#243;n (6%)</td>
          <td style="padding:12px 16px;font-size:16px;font-weight:800;color:#16a34a;text-align:right;font-family:Arial,sans-serif">${fmtCOP(opts.valor_comision)}</td>
        </tr>
      </table>

      <!-- Nota cuenta bancaria -->
      <table cellpadding="0" cellspacing="0" width="100%"
             style="background:#f0fdf4;border-radius:10px;margin-bottom:6px">
        <tr>
          <td style="padding:13px 16px;font-size:13px;color:#166534;line-height:1.6;font-family:Arial,sans-serif">
            &#128161; <strong>Recuerda:</strong> El dep&#243;sito se hace a la cuenta bancaria registrada en tu portal.
            Si quieres actualizarla, ve a <strong>Configuraci&#243;n</strong>.
          </td>
        </tr>
      </table>

    </td>
  </tr>

  ${emailVerEstado(portalUrl, 'Mis p&#243;lizas')}
  ${emailFooter(imgLogo, imgHandw, base)}

</table>
</td></tr>
</table>
</body>
</html>`,
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
  const base      = (env.FRONTEND_URL || '').replace(/\/$/, '')
  const imgLogo   = `${base}/logo-email.png`
  const imgHandw  = `${base}/correohandw.png`
  const portalUrl = `${base}/dashboard/mis-polizas?tab=no_convertida`

  await sendMail({
    to:      opts.to,
    subject: `Novedad sobre la p&#243;liza de ${opts.cliente_nombre}`,
    html: `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Asegura2.com — Novedad en tu póliza</title>
</head>
<body style="margin:0;padding:0;background:#f0f0f5;font-family:Arial,Helvetica,sans-serif">
<table align="center" cellpadding="0" cellspacing="0" width="100%" style="background:#f0f0f5;padding:24px 12px">
<tr><td align="center">
<table cellpadding="0" cellspacing="0" width="100%"
       style="max-width:580px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e8e8f0">

  ${emailHeader(imgLogo)}

  <!-- CONTENIDO -->
  <tr>
    <td style="padding:28px 24px 0">

      <h2 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#111827;font-family:Arial,sans-serif">
        Novedad en tu p&#243;liza
      </h2>
      <p style="margin:0 0 20px;color:#6b7280;font-size:14px;line-height:1.6;font-family:Arial,sans-serif">
        Hola <strong style="color:#111827">${opts.aliado_nombre}</strong>,
        te informamos que la p&#243;liza del siguiente cliente
        no pudo ser aprobada en esta ocasi&#243;n.
      </p>

      <!-- Detalle cliente -->
      <table cellpadding="0" cellspacing="0" width="100%"
             style="background:#fef2f2;border:1.5px solid #fecaca;border-radius:12px;overflow:hidden;margin-bottom:20px">
        <tr>
          <td colspan="2" style="padding:12px 16px;background:#fee2e2;border-bottom:1px solid #fecaca">
            <span style="font-size:11px;font-weight:700;color:#dc2626;
                         text-transform:uppercase;letter-spacing:0.08em;font-family:Arial,sans-serif">
              Cliente no aprobado
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding:9px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #fecaca;font-family:Arial,sans-serif">Cliente</td>
          <td style="padding:9px 16px;font-size:13px;font-weight:600;color:#111827;text-align:right;border-bottom:1px solid #fecaca;font-family:Arial,sans-serif">${opts.cliente_nombre}</td>
        </tr>
        ${opts.placa ? `<tr>
          <td style="padding:9px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #fecaca;font-family:Arial,sans-serif">Placa</td>
          <td style="padding:9px 16px;font-size:13px;font-weight:600;color:#111827;text-align:right;border-bottom:1px solid #fecaca;font-family:Arial,sans-serif">${opts.placa}</td>
        </tr>` : ''}
        <tr>
          <td style="padding:9px 16px;font-size:13px;color:#6b7280;font-family:Arial,sans-serif">Aseguradora</td>
          <td style="padding:9px 16px;font-size:13px;font-weight:600;color:#111827;text-align:right;font-family:Arial,sans-serif">${opts.aseguradora}</td>
        </tr>
      </table>

      <!-- Motivo -->
      <table cellpadding="0" cellspacing="0" width="100%"
             style="border-left:4px solid #f97316;background:#fff7ed;border-radius:0 10px 10px 0;margin-bottom:20px">
        <tr>
          <td style="padding:16px 20px">
            <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#c2410c;
                      text-transform:uppercase;letter-spacing:0.06em;font-family:Arial,sans-serif">
              Motivo
            </p>
            <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;font-family:Arial,sans-serif">
              ${opts.motivo}
            </p>
          </td>
        </tr>
      </table>

      <!-- Qué puedes hacer -->
      <table cellpadding="0" cellspacing="0" width="100%"
             style="background:#eff6ff;border-radius:10px;margin-bottom:6px">
        <tr>
          <td style="padding:13px 16px;font-size:13px;color:#1d4ed8;line-height:1.6;font-family:Arial,sans-serif">
            &#128161; <strong>&#191;Qu&#233; puedes hacer?</strong> Puedes intentar con este cliente
            en una nueva cotizaci&#243;n en el futuro, o cotizar con una aseguradora diferente
            que se ajuste mejor a su perfil.
          </td>
        </tr>
      </table>

    </td>
  </tr>

  ${emailVerEstado(portalUrl, 'Mis p&#243;lizas')}
  ${emailFooter(imgLogo, imgHandw, base)}

</table>
</td></tr>
</table>
</body>
</html>`,
  })
}

// ── Correo con OTP ────────────────────────────────────────────────────────
export async function sendOTPEmail(
  to: string,
  nombre: string | null | undefined,
  otp: string
): Promise<void> {
  const base      = (env.FRONTEND_URL || '').replace(/\/$/, '')
  const imgLogo   = `${base}/logo-email.png`
  const imgReloj  = `${base}/relojotp.png`
  const imgAuri   = `${base}/auricularesotp.png`

  // Código formateado con espacios entre dígitos
  const otpFmt = otp.split('').join(' ')

  // Texto principal según si conocemos el nombre o no
  const esRegistro = !nombre
  const titulo = esRegistro
    ? `&#161;Gracias por registrarte en <span style="color:#2D2A7A">Asegura2.com</span>!`
    : `Hola <span style="color:#2D2A7A">${nombre}</span> &#128075;`
  const subtitulo = esRegistro
    ? `Para continuar, <strong>verifica tu correo</strong> con el siguiente c&#243;digo:`
    : `Para tu seguridad, ingresa el siguiente c&#243;digo de verificaci&#243;n para iniciar sesi&#243;n`

  await sendMail({
    to,
    subject: `${otp} - Asegura2.com`,
    html: `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Asegura2.com</title>
  <style>
    body,table,td,p,h1,span,a { margin:0;padding:0; }
    img { border:0; }
    @media only screen and (max-width:600px) {
      .wrap  { padding:0 !important; }
      .card  { border-radius:0 !important; }
      .sec   { padding-left:16px !important; padding-right:16px !important; }
      .otp-box { padding:16px 10px !important; }
      .otp-code { font-size:30px !important; letter-spacing:8px !important; }
      /* Footer: 2 columnas siempre, incluso en móvil */
      .ft-left  { width:50% !important; }
      .ft-right { width:50% !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f0f0f5;font-family:Arial,Helvetica,sans-serif">

<table class="wrap" align="center" cellpadding="0" cellspacing="0" width="100%"
       style="background:#f0f0f5;padding:24px 12px">
<tr><td align="center">

<table class="card" cellpadding="0" cellspacing="0" width="100%"
       style="max-width:580px;background:#ffffff;border-radius:20px;
              overflow:hidden;border:1px solid #e8e8f0;
              box-shadow:0 4px 24px rgba(0,0,0,0.08)">

  <!-- ══ HEADER ══ -->
  <tr>
    <td style="background:#ffffff;padding:16px 28px;border-bottom:2px solid #2D2A7A">
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="vertical-align:middle">
            <img src="${imgLogo}" alt="Asegura2.com"
                 height="38" style="display:block;height:38px;border:0" />
          </td>
          <td align="right" style="vertical-align:middle">
            <span style="font-size:12px;font-weight:600;color:#2D2A7A;
                         font-family:Arial,sans-serif">Portal de Aliados</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ══ TÍTULO Y SUBTÍTULO — centrado ══ -->
  <tr>
    <td class="sec" style="padding:10px 48px 0;text-align:center">
      <h1 style="margin:0 0 10px;font-size:20px;font-weight:800;
                 color:#111827;line-height:1.3;font-family:Arial,sans-serif">
        ${titulo}
      </h1>
      <p style="margin:0;font-size:14px;color:#4b5563;line-height:1.65;
                font-family:Arial,sans-serif">
        ${subtitulo}
      </p>
    </td>
  </tr>

  <!-- ══ CÓDIGO OTP — centrado ══ -->
  <tr>
    <td class="sec" style="padding:22px 40px">
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td class="otp-box"
              style="background:#edeef8;border-radius:12px;
                     padding:22px 20px;text-align:center">
            <span class="otp-code"
                  style="font-size:44px;font-weight:900;letter-spacing:16px;
                         color:#2D2A7A;font-family:Arial,sans-serif">
              ${otpFmt}
            </span>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ══ EXPIRA EN — centrado con reloj en círculo ══ -->
  <tr>
    <td style="padding:0 40px 10px;text-align:center">
      <table cellpadding="0" cellspacing="0" align="center"
             style="margin:0 auto">
        <tr>
          <td style="vertical-align:middle;padding-right:10px">
            <table cellpadding="0" cellspacing="0">
              <tr><td width="34" height="34"
                style="width:34px;height:34px;min-width:34px;
                       background:#edeef8;border-radius:17px;
                       text-align:center;vertical-align:middle;
                       overflow:hidden">
                <img src="${imgReloj}" alt="Reloj"
                     width="44" height="44"
                     style="display:block;margin:0 auto;border:0" />
              </td></tr>
            </table>
          </td>
          <td style="vertical-align:middle;font-size:13px;color:#374151;
                     font-family:Arial,sans-serif;white-space:nowrap">
            Este c&#243;digo expira en
            <strong style="color:#111827">${env.OTP_EXPIRES_MINUTES} minutos</strong>.
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ══ NOTA — centrada ══ -->
  <tr>
    <td style="padding:8px 40px 28px;text-align:center">
      <p style="margin:0;font-size:12px;color:#9ca3af;
                font-family:Arial,sans-serif">
        Si no solicitaste este c&#243;digo, puedes ignorar este mensaje.
      </p>
    </td>
  </tr>

  <!-- Separador -->
  <tr>
    <td style="padding:0 28px">
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr><td height="1" style="background:#e8e8f0;font-size:0;line-height:0">&nbsp;</td></tr>
      </table>
    </td>
  </tr>

  <!-- ══ FOOTER: auriculares+ayuda izq | ayudarteotp der ══ -->
  <tr>
    <td class="sec" style="padding:20px 28px 16px">
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <!-- Soporte (izquierda) -->
          <td class="ft-left" style="vertical-align:middle;width:52%">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:middle">
                  <table cellpadding="0" cellspacing="0">
                    <tr><td width="42" height="42"
                      style="width:42px;height:42px;min-width:42px;
                             background:#edeef8;border-radius:21px;
                             text-align:center;vertical-align:middle;
                             overflow:hidden">
                      <img src="${imgAuri}" alt="Soporte"
                           width="50" height="50"
                           style="display:block;margin:0 auto;border:0" />
                    </td></tr>
                  </table>
                </td>
                <td style="padding-left:12px;vertical-align:middle">
                  <div style="font-size:13px;font-weight:700;color:#1a1a2e;
                              font-family:Arial,sans-serif">
                    &#191;Necesitas ayuda?
                  </div>
                  <div style="font-size:11px;color:#6b7280;margin-top:3px;
                              font-family:Arial,sans-serif">
                    <a href="mailto:aliados@asegura2.com.co"
                       style="color:#2D2A7A;text-decoration:none;font-weight:600">
                      aliados@asegura2.com.co</a>
                  </div>
                </td>
              </tr>
            </table>
          </td>
          <!-- Imagen ayudarteotp (derecha) -->
          <td class="ft-right" style="text-align:right;vertical-align:middle;width:48%">
            <img src="${base}/ayudarteotp.png"
                 alt="Estamos aqui para ayudarte"
                 height="140" style="display:inline-block;max-height:140px;
                                     max-width:100%;border:0" />
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ══ BOTTOM BAR ══ -->
  <tr>
    <td style="background:#f8f8fc;border-top:1px solid #e8e8f0;
               padding:12px 28px;text-align:center">
      <img src="${imgLogo}" alt="Asegura2.com"
           height="24" style="display:inline-block;height:24px;border:0;
                               margin-bottom:4px" />
      <p style="margin:0;font-size:10px;color:#9ca3af;
                font-family:Arial,sans-serif">
        Asegura2.com &middot; Portal de Aliados
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`,
  })
}
