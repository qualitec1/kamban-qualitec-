import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const APP_URL = Deno.env.get('APP_URL') || 'https://backlog.qualitec.ind.br'
// Secret compartilhado entre edge function e servidor Nuxt
// Deve ser os últimos 16 chars do SUPABASE_SERVICE_ROLE_KEY (ou configurar REMINDER_SECRET)
const REMINDER_SECRET = Deno.env.get('REMINDER_SECRET') || SUPABASE_SERVICE_ROLE_KEY.slice(-16)

serve(async (_req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: reminders, error } = await supabase
      .from('task_reminders')
      .select(`
        *,
        task:tasks ( id, title, description, due_date, board:boards ( id, name ) ),
        user:profiles ( id, email, full_name )
      `)
      .eq('enabled', true)

    if (error) throw error
    if (!reminders?.length) {
      return json({ success: true, message: 'No active reminders', sent: 0 })
    }

    const nowBrasilia = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
    const currentTime = `${nowBrasilia.getHours().toString().padStart(2, '0')}:${nowBrasilia.getMinutes().toString().padStart(2, '0')}`

    let emailsSent = 0
    const results = []

    for (const reminder of reminders) {
      try {
        if (!reminder.task?.due_date || !reminder.user?.email) continue

        // Calcular data do lembrete
        const [y, m, d] = reminder.task.due_date.split('T')[0].split('-').map(Number)
        const dueDate = new Date(y, m - 1, d)
        const reminderDate = new Date(dueDate)
        reminderDate.setDate(reminderDate.getDate() - reminder.days_before)
        reminderDate.setHours(0, 0, 0, 0)

        const today = new Date(nowBrasilia)
        today.setHours(0, 0, 0, 0)

        if (reminderDate.getTime() !== today.getTime()) continue

        // Verificar horário (margem de 5 minutos)
        const [rH, rM] = reminder.reminder_time.substring(0, 5).split(':').map(Number)
        const [cH, cM] = currentTime.split(':').map(Number)
        if (Math.abs((rH * 60 + rM) - (cH * 60 + cM)) > 5) continue

        const html = buildEmailHtml(reminder, dueDate)
        const subject = `Lembrete: ${reminder.task.title}`

        // Chamar o endpoint do servidor Nuxt que usa nodemailer
        const res = await fetch(`${APP_URL}/api/emails/send-reminder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: reminder.user.email,
            subject,
            html,
            secret: REMINDER_SECRET,
          }),
        })

        if (res.ok) {
          emailsSent++
          results.push({ reminder_id: reminder.id, task: reminder.task.title, user: reminder.user.email, success: true })
        } else {
          const err = await res.text()
          results.push({ reminder_id: reminder.id, task: reminder.task.title, user: reminder.user.email, success: false, error: err })
        }
      } catch (err) {
        results.push({ reminder_id: reminder.id, success: false, error: err.message })
      }
    }

    return json({
      success: true,
      message: `Processed ${reminders.length} reminders, sent ${emailsSent} emails`,
      sent: emailsSent,
      results,
    })

  } catch (error) {
    return json({ error: error.message }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function buildEmailHtml(reminder: any, dueDate: Date): string {
  const task = reminder.task
  const formattedDate = dueDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  const daysUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  const urgencyText = daysUntilDue <= 0 ? 'Vence hoje!' : daysUntilDue === 1 ? 'Vence amanha!' : `Vence em ${daysUntilDue} dias`

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Lembrete</title></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;background:#f5f5f5;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.1);">
  <tr><td style="padding:32px;background:linear-gradient(135deg,#1C325C,#2a4a7f);border-radius:12px 12px 0 0;">
    <h1 style="margin:0;color:#fff;font-size:22px;font-weight:600;">Lembrete de Tarefa</h1>
  </td></tr>
  <tr><td style="padding:32px;">
    <p style="margin:0 0 16px;color:#555;font-size:15px;">Ola, <strong>${reminder.user.full_name || 'usuario'}</strong>!</p>
    <p style="margin:0 0 24px;color:#555;font-size:14px;">Voce tem uma tarefa com prazo se aproximando:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;border-left:4px solid #1C325C;border-radius:8px;margin-bottom:24px;">
      <tr><td style="padding:20px;">
        <h2 style="margin:0 0 12px;color:#1C325C;font-size:18px;">${task.title}</h2>
        ${task.description ? `<p style="margin:0 0 12px;color:#666;font-size:14px;">${task.description}</p>` : ''}
        <p style="margin:0 0 6px;color:#666;font-size:14px;">Quadro: <strong style="color:#333;">${task.board.name}</strong></p>
        <p style="margin:0 0 16px;color:#666;font-size:14px;">Prazo: <strong style="color:#333;">${formattedDate}</strong></p>
        <div style="padding:10px 14px;background:#fff3cd;border-radius:6px;display:inline-block;">
          <strong style="color:#856404;font-size:15px;">${urgencyText}</strong>
        </div>
      </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <a href="${APP_URL}/boards/${task.board.id}"
           style="display:inline-block;padding:14px 32px;background:#1C325C;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">
          Ver Tarefa
        </a>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:20px 32px;background:#f8f9fa;border-radius:0 0 12px 12px;border-top:1px solid #e9ecef;">
    <p style="margin:0;color:#999;font-size:12px;text-align:center;">Voce configurou um lembrete para esta tarefa no Sistema Kanban Qualitec.</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}
