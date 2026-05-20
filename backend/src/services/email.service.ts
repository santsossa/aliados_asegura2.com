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
  const comision = Math.round(opts.valor_prima * 0.06)
  await sendMail({
    to:      opts.to,
    subject: `✅ Recibimos tu solicitud — ${opts.cliente_nombre}`,
    html:    baseLayout(`
      <h2 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#111827">¡Lo recibimos! 🎉</h2>
      <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6">
        Hola <strong>${opts.aliado_nombre}</strong>, ya tenemos la solicitud de póliza que enviaste.
        Nuestro equipo de ventas ya está en contacto con el cliente.
      </p>

      <div style="background:#f0f4ff;border-radius:12px;padding:20px 24px;margin-bottom:24px">
        <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#2D2A7A;text-transform:uppercase;letter-spacing:0.08em">Detalle de la solicitud</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:6px 0;font-size:13px;color:#6b7280">Cliente</td>
              <td style="padding:6px 0;font-size:13px;font-weight:600;color:#111827;text-align:right">${opts.cliente_nombre}</td></tr>
          ${opts.placa ? `<tr><td style="padding:6px 0;font-size:13px;color:#6b7280">Placa</td>
              <td style="padding:6px 0;font-size:13px;font-weight:600;color:#111827;text-align:right">${opts.placa}</td></tr>` : ''}
          <tr><td style="padding:6px 0;font-size:13px;color:#6b7280">Aseguradora</td>
              <td style="padding:6px 0;font-size:13px;font-weight:600;color:#111827;text-align:right">${opts.aseguradora}</td></tr>
          <tr><td style="padding:6px 0;font-size:13px;color:#6b7280">Prima anual</td>
              <td style="padding:6px 0;font-size:13px;font-weight:600;color:#111827;text-align:right">${fmtCOP(opts.valor_prima)}</td></tr>
          <tr style="border-top:1px solid #dbeafe">
            <td style="padding:10px 0 4px;font-size:14px;font-weight:700;color:#2D2A7A">Tu comisión estimada (6%)</td>
            <td style="padding:10px 0 4px;font-size:16px;font-weight:800;color:#2D2A7A;text-align:right">${fmtCOP(comision)}</td></tr>
        </table>
      </div>

      <div style="background:#fef9c3;border-radius:10px;padding:14px 18px;margin-bottom:24px">
        <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6">
          ⏳ <strong>¿Qué sigue?</strong> Nuestro equipo contactará a <strong>${opts.cliente_nombre}</strong> para cerrar la venta.
          Te notificaremos por correo cuando la póliza sea aprobada o si hay alguna novedad.
        </p>
      </div>

      <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6">
        Puedes ver el estado en tu portal en la sección <strong>Mis pólizas</strong>.
      </p>
    `),
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
