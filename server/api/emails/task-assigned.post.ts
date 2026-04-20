import { createClient } from '@supabase/supabase-js'
import type { Database } from '#shared/types/database'
import nodemailer from 'nodemailer'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { taskId, assigneeId } = body

    console.log('[task-assigned API] Received request:', { taskId, assigneeId })

    if (!taskId || !assigneeId) {
      throw createError({
        statusCode: 400,
        message: 'taskId and assigneeId are required'
      })
    }

    const config = useRuntimeConfig()
    
    console.log('[task-assigned API] Config check:', {
      hasSupabaseUrl: !!config.public.supabaseUrl,
      hasSupabaseKey: !!config.supabaseServiceRoleKey,
      hasEmailUser: !!config.emailUser,
      hasEmailSmtp: !!config.emailSmtp
    })
    
    // Criar cliente Supabase com service role
    const supabase = createClient<Database>(
      config.public.supabaseUrl,
      config.supabaseServiceRoleKey
    )

    // Buscar preferências de email do usuário
    console.log('[task-assigned API] Fetching email preferences for user:', assigneeId)
    const { data: prefs } = await supabase
      .from('email_preferences')
      .select('*')
      .eq('user_id', assigneeId)
      .single()

    console.log('[task-assigned API] Preferences:', prefs)

    // Se notificações desabilitadas, retornar
    if (!prefs || !prefs.task_assigned_enabled) {
      console.log('[task-assigned API] Notifications disabled, skipping email')
      return { success: true, skipped: true, reason: 'notifications_disabled' }
    }

    // Verificar rate limit
    console.log('[task-assigned API] Checking rate limits...')
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data: recentEmails } = await supabase
      .from('email_sent_log')
      .select('id, sent_at')
      .eq('user_id', assigneeId)
      .gte('sent_at', oneDayAgo)

    if (recentEmails) {
      const emailsLastHour = recentEmails.filter(e => e.sent_at >= oneHourAgo).length
      const emailsLastDay = recentEmails.length

      console.log('[task-assigned API] Rate limit check:', {
        emailsLastHour,
        maxPerHour: prefs.max_emails_per_hour,
        emailsLastDay,
        maxPerDay: prefs.max_emails_per_day
      })

      if (emailsLastHour >= prefs.max_emails_per_hour) {
        console.log('[task-assigned API] Hourly limit exceeded')
        return { success: false, error: 'hourly_limit_exceeded' }
      }
      if (emailsLastDay >= prefs.max_emails_per_day) {
        console.log('[task-assigned API] Daily limit exceeded')
        return { success: false, error: 'daily_limit_exceeded' }
      }
    }

    // Buscar todas as informações da tarefa
    console.log('[task-assigned API] Fetching task details...')
    const { data: task } = await supabase
      .from('tasks')
      .select(`
        *,
        board:boards(id, name),
        group:task_groups(id, name, color),
        status:task_statuses(id, name, color),
        priority:task_priorities(id, name, color),
        created_by_user:profiles!tasks_created_by_fkey(id, full_name, email),
        assignees:task_assignees(
          user:profiles(id, full_name, email, avatar_url)
        ),
        subtasks(
          id, title, is_done, status_id, priority_id, due_date, notes,
          status:task_statuses(name, color),
          priority:task_priorities(name, color),
          assignees:subtask_assignees(
            user:profiles(full_name, email)
          )
        ),
        attachments:task_attachments(
          id, file_name, mime_type, size_bytes, category, description
        ),
        labels:task_labels(
          label:labels(id, name, color)
        )
      `)
      .eq('id', taskId)
      .single()

    if (!task) {
      console.error('[task-assigned API] Task not found')
      throw createError({ statusCode: 404, message: 'Task not found' })
    }

    console.log('[task-assigned API] Task found:', {
      title: task.title,
      board: task.board?.name,
      assignees: task.assignees?.length
    })

    // Buscar informações do destinatário
    console.log('[task-assigned API] Fetching assignee details...')
    const { data: assignee } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', assigneeId)
      .single()

    if (!assignee || !assignee.email) {
      console.error('[task-assigned API] Assignee not found or no email')
      throw createError({ statusCode: 404, message: 'Assignee not found or no email' })
    }

    console.log('[task-assigned API] Assignee found:', {
      name: assignee.full_name,
      email: assignee.email
    })

    // Configurar transporter de email
    console.log('[task-assigned API] Configuring email transporter...')
    const transporter = nodemailer.createTransport({
      host: config.emailSmtp,
      port: parseInt(config.emailPort),
      secure: true,
      auth: {
        user: config.emailUser,
        pass: config.emailPass
      }
    })

    // Formatar data
    const formatDate = (date: string | null) => {
      if (!date) return 'Não definida'
      return new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }

    // Formatar orçamento
    const formatBudget = (budget: number | null) => {
      if (!budget) return 'Não definido'
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(budget)
    }

    // Montar HTML do email
    const taskUrl = `${config.public.appUrl}/boards/${task.board.id}?task=${task.id}`
    
    const subtasksHtml = task.subtasks && task.subtasks.length > 0
      ? `
        <div style="margin-top: 20px;">
          <h3 style="color: #374151; font-size: 16px; margin-bottom: 10px;">Subtarefas (${task.subtasks.length})</h3>
          <ul style="list-style: none; padding: 0;">
            ${task.subtasks.map(st => `
              <li style="padding: 8px; background: ${st.is_done ? '#f0fdf4' : '#f9fafb'}; margin-bottom: 5px; border-radius: 4px; border-left: 3px solid ${st.is_done ? '#22c55e' : '#d1d5db'};">
                <span style="color: ${st.is_done ? '#16a34a' : '#6b7280'};">
                  ${st.is_done ? '✓' : '○'} ${st.title}
                </span>
                ${st.status ? `<span style="margin-left: 10px; padding: 2px 8px; background: ${st.status.color}20; color: ${st.status.color}; border-radius: 3px; font-size: 12px;">${st.status.name}</span>` : ''}
                ${st.due_date ? `<span style="margin-left: 10px; color: #6b7280; font-size: 12px;">📅 ${formatDate(st.due_date)}</span>` : ''}
              </li>
            `).join('')}
          </ul>
        </div>
      `
      : ''

    const attachmentsHtml = task.attachments && task.attachments.length > 0
      ? `
        <div style="margin-top: 20px;">
          <h3 style="color: #374151; font-size: 16px; margin-bottom: 10px;">Anexos (${task.attachments.length})</h3>
          <ul style="list-style: none; padding: 0;">
            ${task.attachments.map(att => `
              <li style="padding: 8px; background: #f9fafb; margin-bottom: 5px; border-radius: 4px;">
                📎 ${att.file_name}
                ${att.category ? `<span style="margin-left: 10px; color: #6b7280; font-size: 12px;">(${att.category})</span>` : ''}
              </li>
            `).join('')}
          </ul>
        </div>
      `
      : ''

    const labelsHtml = task.labels && task.labels.length > 0
      ? `
        <div style="margin-top: 15px;">
          ${task.labels.map(tl => `
            <span style="display: inline-block; padding: 4px 12px; background: ${tl.label.color}20; color: ${tl.label.color}; border-radius: 12px; font-size: 12px; margin-right: 5px;">
              ${tl.label.name}
            </span>
          `).join('')}
        </div>
      `
      : ''

    const assigneesHtml = task.assignees && task.assignees.length > 1
      ? `
        <div style="margin-top: 15px;">
          <strong style="color: #6b7280; font-size: 14px;">Outros responsáveis:</strong>
          ${task.assignees
            .filter(a => a.user.id !== assigneeId)
            .map(a => `<span style="margin-left: 5px; color: #374151;">${a.user.full_name}</span>`)
            .join(', ')}
        </div>
      `
      : ''

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Nova Tarefa Atribuída</h1>
          </div>

          <!-- Content -->
          <div style="padding: 30px;">
            
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              Olá <strong>${assignee.full_name}</strong>,
            </p>

            <p style="font-size: 14px; color: #6b7280; margin-bottom: 25px;">
              Você foi atribuído a uma nova tarefa no quadro <strong>${task.board.name}</strong>.
            </p>

            <!-- Task Card -->
            <div style="background: #f9fafb; border-left: 4px solid ${task.group?.color || '#6366f1'}; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
              
              <h2 style="color: #111827; font-size: 20px; margin: 0 0 15px 0;">
                ${task.title}
              </h2>

              ${task.description ? `
                <div style="background: #ffffff; padding: 15px; border-radius: 4px; margin-bottom: 15px;">
                  <strong style="color: #6b7280; font-size: 14px;">Descrição:</strong>
                  <p style="color: #374151; margin: 8px 0 0 0; white-space: pre-wrap;">${task.description}</p>
                </div>
              ` : ''}

              ${task.notes ? `
                <div style="background: #fffbeb; padding: 12px; border-radius: 4px; border-left: 3px solid #f59e0b; margin-bottom: 15px;">
                  <strong style="color: #92400e; font-size: 13px;">📝 Nota:</strong>
                  <p style="color: #78350f; margin: 5px 0 0 0; font-size: 13px;">${task.notes}</p>
                </div>
              ` : ''}

              <!-- Task Details Grid -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
                
                ${task.status ? `
                  <div>
                    <strong style="color: #6b7280; font-size: 13px; display: block; margin-bottom: 5px;">Status:</strong>
                    <span style="display: inline-block; padding: 4px 12px; background: ${task.status.color}20; color: ${task.status.color}; border-radius: 4px; font-size: 13px; font-weight: 500;">
                      ${task.status.name}
                    </span>
                  </div>
                ` : ''}

                ${task.priority ? `
                  <div>
                    <strong style="color: #6b7280; font-size: 13px; display: block; margin-bottom: 5px;">Prioridade:</strong>
                    <span style="display: inline-block; padding: 4px 12px; background: ${task.priority.color}20; color: ${task.priority.color}; border-radius: 4px; font-size: 13px; font-weight: 500;">
                      ${task.priority.name}
                    </span>
                  </div>
                ` : ''}

                ${task.start_date ? `
                  <div>
                    <strong style="color: #6b7280; font-size: 13px; display: block; margin-bottom: 5px;">Data de Início:</strong>
                    <span style="color: #374151; font-size: 14px;">📅 ${formatDate(task.start_date)}</span>
                  </div>
                ` : ''}

                ${task.due_date ? `
                  <div>
                    <strong style="color: #6b7280; font-size: 13px; display: block; margin-bottom: 5px;">Data de Vencimento:</strong>
                    <span style="color: #374151; font-size: 14px;">⏰ ${formatDate(task.due_date)}</span>
                  </div>
                ` : ''}

                ${task.budget ? `
                  <div>
                    <strong style="color: #6b7280; font-size: 13px; display: block; margin-bottom: 5px;">Orçamento:</strong>
                    <span style="color: #059669; font-size: 14px; font-weight: 600;">💰 ${formatBudget(task.budget)}</span>
                  </div>
                ` : ''}

                ${task.group ? `
                  <div>
                    <strong style="color: #6b7280; font-size: 13px; display: block; margin-bottom: 5px;">Grupo:</strong>
                    <span style="display: inline-block; padding: 4px 12px; background: ${task.group.color}20; color: ${task.group.color}; border-radius: 4px; font-size: 13px;">
                      ${task.group.name}
                    </span>
                  </div>
                ` : ''}

              </div>

              ${labelsHtml}
              ${assigneesHtml}
            </div>

            ${subtasksHtml}
            ${attachmentsHtml}

            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${taskUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                Ver Tarefa Completa
              </a>
            </div>

            <!-- Footer Info -->
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
              <p style="font-size: 12px; color: #9ca3af; margin: 5px 0;">
                Atribuído por: <strong>${task.created_by_user?.full_name || 'Sistema'}</strong>
              </p>
              <p style="font-size: 12px; color: #9ca3af; margin: 5px 0;">
                Data de criação: ${formatDate(task.created_at)}
              </p>
            </div>

          </div>

          <!-- Footer -->
          <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #6b7280; margin: 0 0 10px 0;">
              Você está recebendo este email porque foi atribuído a uma tarefa.
            </p>
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">
              <a href="${config.public.appUrl}/settings" style="color: #667eea; text-decoration: none;">Gerenciar preferências de email</a>
            </p>
          </div>

        </div>
      </body>
      </html>
    `

    // Enviar email
    console.log('[task-assigned API] Sending email to:', assignee.email)
    await transporter.sendMail({
      from: `"${config.emailFromName || 'Sistema Kanban'}" <${config.emailUser}>`,
      to: assignee.email,
      subject: `Nova Tarefa: ${task.title}`,
      html: emailHtml
    })

    console.log('[task-assigned API] Email sent successfully')

    // Registrar envio
    await supabase
      .from('email_sent_log')
      .insert({
        user_id: assigneeId,
        email_type: 'task_assigned',
        task_id: taskId
      })

    console.log('[task-assigned API] Log registered')

    return { success: true, sent: true }

  } catch (error: any) {
    console.error('[task-assigned API] Error sending task assignment email:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to send email'
    })
  }
})
