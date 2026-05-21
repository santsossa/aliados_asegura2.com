import nodemailer from 'nodemailer'
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

interface MailOptions {
  to:      string
  subject: string
  html:    string
}

async function sendMail(opts: MailOptions): Promise<void> {
  // En desarrollo sin API key configurada, solo loguea en consola
  if (env.NODE_ENV === 'development' && (!env.RESEND_API_KEY || env.RESEND_API_KEY.startsWith('re_xxx'))) {
    // En desarrollo sin API key: no enviar email ni exponer OTP en logs
    // Configura RESEND_API_KEY en .env para habilitar el envío real
    return
  }
  await transporter.sendMail({
    from:    `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM}>`,
    to:      opts.to,
    subject: opts.subject,
    html:    opts.html,
  })
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
  const comision   = Math.round(opts.valor_prima * 0.06)
  const baseUrl    = (env.FRONTEND_URL || '').replace(/\/$/, '')
  const imgSobre   = `${baseUrl}/correoab.png`
  const imgHandw   = `${baseUrl}/correohandw.png`
  const portalUrl  = `${baseUrl}/dashboard/mis-polizas`

  await sendMail({
    to:      opts.to,
    subject: `✅ Recibimos tu solicitud — ${opts.cliente_nombre}`,
    html: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Asegura2.com</title>
</head>
<body style="margin:0;padding:0;background:#f0f0f5;font-family:Inter,Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f5;padding:32px 16px">
<tr><td align="center">
<table width="100%" style="max-width:580px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

  <!-- HEADER -->
  <tr>
    <td style="background:#2D2A7A;padding:0">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:22px 32px">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.5px">Asegura2<span style="color:#F5C400">.com</span></span>
                  <div style="font-size:11px;color:#a5b4fc;margin-top:2px;font-weight:500">+protección</div>
                </td>
                <td style="padding-left:20px;border-left:1px solid rgba(255,255,255,0.25);padding-top:2px">
                  <span style="font-size:13px;font-weight:600;color:#ffffff">Portal de Aliados</span>
                </td>
              </tr>
            </table>
          </td>
          <!-- Franja dorada decorativa -->
          <td width="80" style="background:linear-gradient(135deg,#F5C400 0%,#f59e0b 100%);border-radius:0 0 0 40px">&nbsp;</td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- HERO -->
  <tr>
    <td style="padding:0;background:#f8f8fc">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:36px 36px 28px;vertical-align:middle;width:55%">
            <h1 style="margin:0 0 14px;font-size:28px;font-weight:900;color:#1a1a2e;line-height:1.2">
              ¡Lo recibimos! <span style="display:inline-block">🎉</span>
            </h1>
            <p style="margin:0;font-size:14px;color:#4b5563;line-height:1.7">
              Hola <strong style="color:#1a1a2e">${opts.aliado_nombre}</strong>, ya tenemos la solicitud de póliza
              que enviaste. Nuestro equipo de ventas ya está en contacto con el cliente.
            </p>
          </td>
          <td style="padding:20px 24px 0 0;vertical-align:bottom;text-align:right;width:45%">
            <img src="${imgSobre}" alt="Solicitud recibida" width="180"
                 style="display:block;margin-left:auto;max-width:180px" />
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- DETALLE CARD -->
  <tr>
    <td style="padding:28px 32px 0">
      <table width="100%" cellpadding="0" cellspacing="0"
             style="border:1.5px solid #e8e8f0;border-radius:14px;overflow:hidden">
        <!-- Card header -->
        <tr>
          <td colspan="2" style="padding:16px 20px;border-bottom:1px solid #e8e8f0">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:34px;height:34px;background:#ede9fe;border-radius:8px;text-align:center;vertical-align:middle">
                  <span style="font-size:16px;line-height:34px">📋</span>
                </td>
                <td style="padding-left:12px">
                  <span style="font-size:14px;font-weight:700;color:#2D2A7A">Detalle de la solicitud</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Filas -->
        <tr>
          <td style="padding:13px 20px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6">Cliente</td>
          <td style="padding:13px 20px;font-size:13px;font-weight:700;color:#111827;text-align:right;border-bottom:1px solid #f3f4f6">${opts.cliente_nombre}</td>
        </tr>
        ${opts.placa ? `
        <tr>
          <td style="padding:13px 20px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6">Placa</td>
          <td style="padding:13px 20px;font-size:13px;font-weight:700;color:#111827;text-align:right;border-bottom:1px solid #f3f4f6">${opts.placa}</td>
        </tr>` : ''}
        <tr>
          <td style="padding:13px 20px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6">Aseguradora</td>
          <td style="padding:13px 20px;font-size:13px;font-weight:700;color:#111827;text-align:right;border-bottom:1px solid #f3f4f6">${opts.aseguradora}</td>
        </tr>
        <tr>
          <td style="padding:13px 20px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6">Prima anual</td>
          <td style="padding:13px 20px;font-size:13px;font-weight:700;color:#111827;text-align:right;border-bottom:1px solid #f3f4f6">${fmtCOP(opts.valor_prima)}</td>
        </tr>
        <!-- Comisión -->
        <tr>
          <td style="padding:16px 20px;font-size:14px;font-weight:700;color:#2D2A7A">Tu comisión estimada (6%)</td>
          <td style="padding:16px 20px;font-size:18px;font-weight:900;color:#2D2A7A;text-align:right">${fmtCOP(comision)}</td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ¿QUÉ SIGUE? -->
  <tr>
    <td style="padding:20px 32px 0">
      <table width="100%" cellpadding="0" cellspacing="0"
             style="background:#fffbeb;border:1.5px solid #fde68a;border-radius:14px">
        <tr>
          <td style="padding:18px 20px;vertical-align:top;width:44px">
            <div style="width:36px;height:36px;background:#fef3c7;border-radius:50%;text-align:center;line-height:36px;font-size:18px">🔔</div>
          </td>
          <td style="padding:18px 20px 18px 0">
            <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#92400e">¿Qué sigue?</p>
            <p style="margin:0;font-size:13px;color:#78350f;line-height:1.65">
              Nuestro equipo contactará a <strong>${opts.cliente_nombre}</strong> para cerrar la venta.
              Te notificaremos por correo cuando la póliza sea aprobada
              o si hay alguna novedad.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- VER ESTADO -->
  <tr>
    <td style="padding:18px 32px 28px">
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:32px;text-align:center;font-size:18px">👁</td>
          <td style="padding-left:10px;font-size:13px;color:#4b5563">
            Puedes ver el estado en tu portal en la sección
            <a href="${portalUrl}" style="color:#2D2A7A;font-weight:700;text-decoration:none">Mis pólizas.</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- SEPARADOR -->
  <tr><td style="padding:0 32px"><div style="height:1px;background:#e8e8f0"></div></td></tr>

  <!-- FOOTER -->
  <tr>
    <td style="padding:24px 32px 20px">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <!-- Soporte -->
          <td style="vertical-align:top;width:50%">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:38px;height:38px;background:#ede9fe;border-radius:50%;text-align:center;vertical-align:middle;font-size:18px">🎧</td>
                <td style="padding-left:12px">
                  <div style="font-size:12px;font-weight:700;color:#1a1a2e">¿Dudas? Estamos para ayudarte</div>
                  <div style="font-size:11px;color:#6b7280;margin-top:2px">
                    Escríbenos a <a href="mailto:aliados@asegura2.com.co" style="color:#2D2A7A;text-decoration:none;font-weight:600">aliados@asegura2.com.co</a>
                  </div>
                </td>
              </tr>
            </table>
          </td>
          <!-- Handwriting -->
          <td style="text-align:right;vertical-align:middle">
            <img src="${imgHandw}" alt="¡Gracias por confiar en asegura2.com!" height="56"
                 style="display:inline-block;max-height:56px" />
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- BOTTOM BAR -->
  <tr>
    <td style="background:#f8f8fc;padding:16px 32px;border-top:1px solid #e8e8f0">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:middle">
            <span style="font-size:15px;font-weight:900;color:#2D2A7A">Asegura2<span style="color:#F5C400">.com</span></span>
            <div style="font-size:10px;color:#9ca3af;margin-top:2px">Portal de Aliados · Bogotá, Colombia</div>
          </td>
          <!-- Redes sociales -->
          <td style="text-align:right;vertical-align:middle">
            <a href="https://facebook.com/asegura2" style="display:inline-block;margin-left:8px">
              <div style="width:30px;height:30px;border-radius:50%;background:#e8e8f0;text-align:center;line-height:30px;font-size:13px">f</div>
            </a>
            <a href="https://instagram.com/asegura2" style="display:inline-block;margin-left:8px">
              <div style="width:30px;height:30px;border-radius:50%;background:#e8e8f0;text-align:center;line-height:30px;font-size:13px">ig</div>
            </a>
            <a href="https://linkedin.com/company/asegura2" style="display:inline-block;margin-left:8px">
              <div style="width:30px;height:30px;border-radius:50%;background:#e8e8f0;text-align:center;line-height:30px;font-size:13px">in</div>
            </a>
          </td>
        </tr>
      </table>
      <p style="margin:10px 0 0;font-size:10px;color:#9ca3af;text-align:center">
        Si tienes dudas escríbenos a <a href="mailto:aliados@asegura2.com.co" style="color:#2D2A7A;text-decoration:none">aliados@asegura2.com.co</a>
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
