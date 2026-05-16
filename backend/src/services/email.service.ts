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
