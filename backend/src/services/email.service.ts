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
          <td style="vertical-align:bottom;text-align:right;
                     padding:0 12px 0 0;width:46%">
            <img src="${imgSobre}" alt="Solicitud recibida"
                 width="240" style="display:block;width:240px;
                                    max-width:100%;margin-left:auto;border:0" />
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
                <td>
                  <a href="https://web.facebook.com/asegura2col" style="text-decoration:none">
                    ${circle('f', '#1877f2', 32, 14)}
                  </a>
                </td>
                <td>
                  <a href="https://www.instagram.com/asegura2col/" style="text-decoration:none">
                    ${circle('&#128247;', '#e1306c', 32, 15)}
                  </a>
                </td>
                <td>
                  <a href="https://www.linkedin.com/company/asegura2colombia" style="text-decoration:none">
                    ${circle('in', '#0a66c2', 32, 11)}
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
