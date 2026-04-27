import { createClient } from '@supabase/supabase-js'
import type { Database } from '#shared/types/database'
import nodemailer from 'nodemailer'

export default defineEventHandler(async (event) => {
  const startTime = Date.now()
  console.log('\n========== [TASK-ASSIGNED EMAIL] START ==========')
  console.log('[task-assigned] Timestamp:', new Date().toISOString())
  
  try {
    const body = await readBody(event)
    const { taskId, assigneeId } = body

    console.log('[task-assigned] ✓ Request received')
    console.log('[task-assigned] Payload:', { taskId, assigneeId })

    if (!taskId || !assigneeId) {
      console.log('[task-assigned] ✗ Missing required fields')
      throw createError({
        statusCode: 400,
        message: 'taskId and assigneeId are required'
      })
    }

    const config = useRuntimeConfig()
    
    console.log('[task-assigned] ✓ Config loaded')
    console.log('[task-assigned] Config check:', {
      hasSupabaseUrl: !!config.public.supabaseUrl,
      hasSupabaseKey: !!config.supabaseServiceRoleKey,
      hasEmailUser: !!config.emailUser,
      hasEmailSmtp: !!config.emailSmtp,
      hasEmailPort: !!config.emailPort,
      hasEmailPass: !!config.emailPass
    })
    
    // Criar cliente Supabase com service role
    const supabase = createClient<Database>(
      config.public.supabaseUrl,
      config.supabaseServiceRoleKey
    )

    console.log('[task-assigned] ✓ Supabase client created')

    // Buscar preferências de email do usuário
    console.log('[task-assigned] → Fetching email preferences for user:', assigneeId)
    const { data: prefs, error: prefsError } = await supabase
      .from('email_preferences')
      .select('*')
      .eq('user_id', assigneeId)
      .single()

    if (prefsError) {
      console.log('[task-assigned] ⚠ Email preferences error:', prefsError.message)
    }

    console.log('[task-assigned] ✓ Preferences fetched:', {
      found: !!prefs,
      enabled: prefs?.task_assigned_enabled,
      maxPerHour: prefs?.max_emails_per_hour,
      maxPerDay: prefs?.max_emails_per_day
    })

    // Se notificações desabilitadas, retornar
    if (!prefs || !prefs.task_assigned_enabled) {
      console.log('[task-assigned] ⊘ Notifications disabled, skipping email')
      console.log('========== [TASK-ASSIGNED EMAIL] END (skipped) ==========\n')
      return { success: true, skipped: true, reason: 'notifications_disabled' }
    }

    // Verificar rate limit
    console.log('[task-assigned] → Checking rate limits...')
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

      console.log('[task-assigned] ✓ Rate limit check:', {
        emailsLastHour,
        maxPerHour: prefs.max_emails_per_hour,
        emailsLastDay,
        maxPerDay: prefs.max_emails_per_day
      })

      if (emailsLastHour >= prefs.max_emails_per_hour) {
        console.log('[task-assigned] ⊘ Hourly limit exceeded')
        console.log('========== [TASK-ASSIGNED EMAIL] END (rate limited) ==========\n')
        return { success: false, error: 'hourly_limit_exceeded' }
      }
      if (emailsLastDay >= prefs.max_emails_per_day) {
        console.log('[task-assigned] ⊘ Daily limit exceeded')
        console.log('========== [TASK-ASSIGNED EMAIL] END (rate limited) ==========\n')
        return { success: false, error: 'daily_limit_exceeded' }
      }
    }

    // Buscar todas as informações da tarefa
    console.log('[task-assigned] → Fetching task details...')
    const { data: task, error: taskError } = await supabase
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

    if (taskError) {
      console.error('[task-assigned] ✗ Task fetch error:', taskError)
      throw taskError
    }

    if (!task) {
      console.error('[task-assigned] ✗ Task not found')
      throw createError({ statusCode: 404, message: 'Task not found' })
    }

    console.log('[task-assigned] ✓ Task found:', {
      id: task.id,
      title: task.title,
      board: task.board?.name,
      group: task.group?.name,
      assignees: task.assignees?.length
    })

    // Buscar informações do destinatário
    console.log('[task-assigned] → Fetching assignee details...')
    const { data: assignee, error: assigneeError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', assigneeId)
      .single()

    if (assigneeError) {
      console.error('[task-assigned] ✗ Assignee fetch error:', assigneeError)
      throw assigneeError
    }

    if (!assignee || !assignee.email) {
      console.error('[task-assigned] ✗ Assignee not found or no email')
      throw createError({ statusCode: 404, message: 'Assignee not found or no email' })
    }

    console.log('[task-assigned] ✓ Assignee found:', {
      id: assignee.id,
      name: assignee.full_name,
      email: assignee.email
    })

    // Configurar transporter de email
    console.log('[task-assigned] → Configuring email transporter...')
    const transporter = nodemailer.createTransport({
      host: config.emailSmtp,
      port: parseInt(config.emailPort),
      secure: true,
      auth: {
        user: config.emailUser,
        pass: config.emailPass
      }
    })

    console.log('[task-assigned] ✓ Transporter configured')

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

    // Formatar tamanho de arquivo
    const formatFileSize = (bytes: number | null) => {
      if (!bytes) return ''
      const mb = bytes / (1024 * 1024)
      if (mb >= 1) return `${mb.toFixed(1)} MB`
      const kb = bytes / 1024
      return `${kb.toFixed(1)} KB`
    }

    // Montar HTML do email usando o template premium
    const taskUrl = `${config.public.appUrl}/boards/${task.board.id}?task=${task.id}`
    
    // Função generateTaskAssignmentEmail é auto-importada de server/utils/emailTemplates.ts
    const emailHtml = generateTaskAssignmentEmail({
      assigneeName: assignee.full_name || assignee.email,
      taskTitle: task.title,
      taskDescription: task.description || undefined,
      taskNotes: task.notes || undefined,
      boardName: task.board.name,
      groupName: task.group?.name,
      groupColor: task.group?.color,
      statusName: task.status?.name,
      statusColor: task.status?.color,
      priorityName: task.priority?.name,
      priorityColor: task.priority?.color,
      startDate: task.start_date ? formatDate(task.start_date) : undefined,
      dueDate: task.due_date ? formatDate(task.due_date) : undefined,
      budget: task.budget ? formatBudget(task.budget) : undefined,
      subtasks: task.subtasks?.map(st => ({
        title: st.title,
        isDone: st.is_done,
        statusName: st.status?.name,
        statusColor: st.status?.color
      })),
      attachments: task.attachments?.map(att => ({
        fileName: att.file_name,
        fileSize: att.size_bytes ? formatFileSize(att.size_bytes) : undefined,
        category: att.category || undefined
      })),
      taskUrl,
      assignedBy: task.created_by_user?.full_name || 'Sistema',
      createdAt: formatDate(task.created_at),
      settingsUrl: `${config.public.appUrl}/settings`
    })

    // Enviar email
    console.log('[task-assigned] → Sending email...')
    console.log('[task-assigned] Email details:', {
      from: `"${config.emailFromName || 'Sistema Kanban'}" <${config.emailUser}>`,
      to: assignee.email,
      subject: `Nova Tarefa: ${task.title}`
    })
    
    const emailResult = await transporter.sendMail({
      from: `"${config.emailFromName || 'Sistema Kanban'}" <${config.emailUser}>`,
      to: assignee.email,
      subject: `Nova Tarefa: ${task.title}`,
      html: emailHtml
    })

    console.log('[task-assigned] ✓ Email sent successfully!')
    console.log('[task-assigned] Email result:', {
      messageId: emailResult.messageId,
      accepted: emailResult.accepted,
      rejected: emailResult.rejected
    })

    // Registrar envio
    console.log('[task-assigned] → Registering email log...')
    const { error: logError } = await supabase
      .from('email_sent_log')
      .insert({
        user_id: assigneeId,
        email_type: 'task_assigned',
        task_id: taskId
      })

    if (logError) {
      console.error('[task-assigned] ⚠ Failed to log email (non-critical):', logError.message)
    } else {
      console.log('[task-assigned] ✓ Email log registered')
    }

    const duration = Date.now() - startTime
    console.log('[task-assigned] ✓ Total duration:', duration, 'ms')
    console.log('========== [TASK-ASSIGNED EMAIL] END (success) ==========\n')

    return { success: true, sent: true, duration }

  } catch (error: any) {
    const duration = Date.now() - startTime
    console.error('\n========== [TASK-ASSIGNED EMAIL] ERROR ==========')
    console.error('[task-assigned] ✗ Error type:', error.constructor.name)
    console.error('[task-assigned] ✗ Error message:', error.message)
    console.error('[task-assigned] ✗ Error stack:', error.stack)
    console.error('[task-assigned] ✗ Duration before error:', duration, 'ms')
    console.error('========== [TASK-ASSIGNED EMAIL] END (error) ==========\n')
    
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to send email'
    })
  }
})
