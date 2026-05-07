import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

// Configuração Skymail
const EMAIL_USER = Deno.env.get('EMAIL_USER') || 'catalogo@qualitec.ind.br'
const EMAIL_PASS = Deno.env.get('EMAIL_PASS') || 'Instrumentos@2026'
const EMAIL_SMTP = Deno.env.get('EMAIL_SMTP') || 'smtp.skymail.net.br'
const EMAIL_PORT = parseInt(Deno.env.get('EMAIL_PORT') || '465')
const EMAIL_FROM_NAME = Deno.env.get('EMAIL_FROM_NAME') || 'Sistema Kanban Qualitec'

console.log('[send-task-reminders] Function started')
console.log('[send-task-reminders] Email config:', { EMAIL_USER, EMAIL_SMTP, EMAIL_PORT })

serve(async (req) => {
  try {
    console.log('[send-task-reminders] Request received')

    // Verificar se é uma chamada autorizada (cron job)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.includes('Bearer')) {
      console.log('[send-task-reminders] Unauthorized request')
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (!EMAIL_USER || !EMAIL_PASS) {
      console.error('[send-task-reminders] Email credentials not configured')
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Criar cliente Supabase
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
    console.log('[send-task-reminders] Supabase client created')

    // Buscar todos os lembretes ativos
    const { data: reminders, error: remindersError } = await supabase
      .from('task_reminders')
      .select(`
        *,
        task:tasks (
          id,
          title,
          description,
          due_date,
          board:boards (
            id,
            name
          )
        ),
        user:profiles (
          id,
          email,
          full_name
        )
      `)
      .eq('enabled', true)

    if (remindersError) {
      console.error('[send-task-reminders] Error fetching reminders:', remindersError)
      throw remindersError
    }

    console.log(`[send-task-reminders] Found ${reminders?.length || 0} active reminders`)

    if (!reminders || reminders.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No active reminders found',
        sent: 0
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Usar horário de Brasília (UTC-3)
    const nowUTC = new Date()
    const nowBrasilia = new Date(nowUTC.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
    const currentTime = `${nowBrasilia.getHours().toString().padStart(2, '0')}:${nowBrasilia.getMinutes().toString().padStart(2, '0')}`
    console.log(`[send-task-reminders] Current time (Brasília): ${currentTime}`)
    console.log(`[send-task-reminders] Current date (Brasília): ${nowBrasilia.toISOString()}`)

    let emailsSent = 0
    const results = []

    // Processar cada lembrete
    for (const reminder of reminders) {
      try {
        console.log(`[send-task-reminders] Processing reminder ${reminder.id}`)

        if (!reminder.task || !reminder.task.due_date) {
          console.log(`[send-task-reminders] Skipping reminder ${reminder.id} - no task or due_date`)
          continue
        }

        // Parsear due_date como data local (sem conversão de timezone)
        const dueDateStr = reminder.task.due_date.split('T')[0] // "2026-05-08"
        const [year, month, day] = dueDateStr.split('-').map(Number)
        const dueDate = new Date(year, month - 1, day) // Criar data local
        
        const reminderDate = new Date(dueDate)
        reminderDate.setDate(reminderDate.getDate() - reminder.days_before)
        reminderDate.setHours(0, 0, 0, 0)

        const today = new Date(nowBrasilia)
        today.setHours(0, 0, 0, 0)

        console.log(`[send-task-reminders] Task: ${reminder.task.title}`)
        console.log(`[send-task-reminders] Due date: ${dueDate.toISOString()}`)
        console.log(`[send-task-reminders] Reminder date: ${reminderDate.toISOString()}`)
        console.log(`[send-task-reminders] Today: ${today.toISOString()}`)
        console.log(`[send-task-reminders] Reminder time: ${reminder.reminder_time}`)
        console.log(`[send-task-reminders] Current time: ${currentTime}`)

        // Verificar se deve enviar hoje
        if (reminderDate.getTime() !== today.getTime()) {
          console.log(`[send-task-reminders] Not today - skipping`)
          continue
        }

        // Verificar se está no horário correto (com margem de 5 minutos)
        const reminderTimeStr = reminder.reminder_time.substring(0, 5) // HH:MM
        const [reminderHour, reminderMinute] = reminderTimeStr.split(':').map(Number)
        const [currentHour, currentMinute] = currentTime.split(':').map(Number)

        const reminderMinutes = reminderHour * 60 + reminderMinute
        const currentMinutes = currentHour * 60 + currentMinute
        const diff = Math.abs(currentMinutes - reminderMinutes)

        console.log(`[send-task-reminders] Time difference: ${diff} minutes`)

        if (diff > 5) {
          console.log(`[send-task-reminders] Not the right time - skipping`)
          continue
        }

        // Enviar email usando Skymail
        console.log(`[send-task-reminders] Sending email to ${reminder.user.email}`)

        const emailHtml = generateEmailHtml(reminder)

        try {
          const client = new SMTPClient({
            connection: {
              hostname: EMAIL_SMTP,
              port: EMAIL_PORT,
              tls: true,
              auth: {
                username: EMAIL_USER,
                password: EMAIL_PASS,
              },
            },
          })

          await client.send({
            from: `${EMAIL_FROM_NAME} <${EMAIL_USER}>`,
            to: reminder.user.email,
            subject: `🔔 Lembrete: ${reminder.task.title}`,
            content: emailHtml,
            mimeType: 'text/html; charset=utf-8',
          })

          await client.close()

          console.log(`[send-task-reminders] Email sent successfully to ${reminder.user.email}`)
          emailsSent++
          results.push({
            reminder_id: reminder.id,
            task: reminder.task.title,
            user: reminder.user.email,
            success: true
          })

        } catch (emailError) {
          console.error(`[send-task-reminders] Error sending email:`, emailError)
          results.push({
            reminder_id: reminder.id,
            task: reminder.task.title,
            user: reminder.user.email,
            success: false,
            error: emailError.message
          })
        }

      } catch (err) {
        console.error(`[send-task-reminders] Error processing reminder ${reminder.id}:`, err)
        results.push({
          reminder_id: reminder.id,
          success: false,
          error: err.message
        })
      }
    }

    console.log(`[send-task-reminders] Finished - sent ${emailsSent} emails`)

    return new Response(JSON.stringify({
      success: true,
      message: `Processed ${reminders.length} reminders, sent ${emailsSent} emails`,
      sent: emailsSent,
      results
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[send-task-reminders] Fatal error:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

function generateEmailHtml(reminder: any): string {
  const task = reminder.task
  const dueDate = new Date(task.due_date)
  const formattedDate = dueDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })

  const daysUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  const urgencyText = daysUntilDue === 0 
    ? '⚠️ Vence hoje!' 
    : daysUntilDue === 1 
    ? '⏰ Vence amanhã!' 
    : `📅 Vence em ${daysUntilDue} dias`

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lembrete de Tarefa</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; background: linear-gradient(135deg, #1C325C 0%, #2a4a7f 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                🔔 Lembrete de Tarefa
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 8px; color: #666; font-size: 14px;">
                Olá, ${reminder.user.full_name || 'usuário'}!
              </p>
              
              <p style="margin: 0 0 24px; color: #666; font-size: 14px;">
                Este é um lembrete sobre a seguinte tarefa:
              </p>

              <!-- Task Card -->
              <div style="background-color: #f8f9fa; border-left: 4px solid #1C325C; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <h2 style="margin: 0 0 12px; color: #1C325C; font-size: 20px; font-weight: 600;">
                  ${task.title}
                </h2>
                
                ${task.description ? `
                  <p style="margin: 0 0 16px; color: #666; font-size: 14px; line-height: 1.5;">
                    ${task.description}
                  </p>
                ` : ''}

                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  <span style="color: #666; font-size: 14px;">📋 Quadro:</span>
                  <span style="color: #333; font-size: 14px; font-weight: 500;">${task.board.name}</span>
                </div>

                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  <span style="color: #666; font-size: 14px;">📅 Prazo:</span>
                  <span style="color: #333; font-size: 14px; font-weight: 500;">${formattedDate}</span>
                </div>

                <div style="margin-top: 16px; padding: 12px; background-color: #fff3cd; border-radius: 6px;">
                  <span style="color: #856404; font-size: 16px; font-weight: 600;">
                    ${urgencyText}
                  </span>
                </div>
              </div>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0;">
                    <a href="${Deno.env.get('APP_URL') || 'http://localhost:3000'}/boards/${task.board.id}" 
                       style="display: inline-block; padding: 14px 32px; background-color: #1C325C; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Ver Tarefa
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8f9fa; border-radius: 0 0 12px 12px; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #999; font-size: 12px; text-align: center;">
                Você está recebendo este email porque configurou um lembrete para esta tarefa.
              </p>
              <p style="margin: 8px 0 0; color: #999; font-size: 12px; text-align: center;">
                Para gerenciar seus lembretes, acesse as configurações da tarefa.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}
