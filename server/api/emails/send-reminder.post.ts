import nodemailer from 'nodemailer'

/**
 * Endpoint chamado pela edge function do Supabase para enviar lembretes
 * POST /api/emails/send-reminder
 * Body: { to, subject, html, secret }
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { to, subject, html, secret } = body

  // Validação básica
  if (!to || !subject || !html) {
    throw createError({ statusCode: 400, message: 'to, subject and html are required' })
  }

  // Verificar secret para evitar uso indevido
  const config = useRuntimeConfig()
  const expectedSecret = config.reminderSecret || config.supabaseServiceRoleKey?.slice(-16) || 'qualitec2026'
  if (secret !== expectedSecret) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  try {
    const port = parseInt(config.emailPort)
    const transporter = nodemailer.createTransport({
      host: config.emailSmtp,
      port,
      secure: port === 465,
      auth: {
        user: config.emailUser,
        pass: config.emailPass
      },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 15000,
      socketTimeout: 15000,
    })

    await transporter.sendMail({
      from: `"${config.emailFromName || 'Sistema Kanban Qualitec'}" <${config.emailUser}>`,
      to,
      subject,
      html,
    })

    return { success: true }
  } catch (err: any) {
    console.error('[send-reminder] SMTP error:', err.message)
    throw createError({ statusCode: 500, message: `SMTP error: ${err.message}` })
  }
})
