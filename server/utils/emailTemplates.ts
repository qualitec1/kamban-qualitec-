// Template de email premium para atribuição de tarefa
// Baseado em design moderno e limpo, compatível com clientes de email

interface TaskEmailData {
  assigneeName: string
  taskTitle: string
  taskDescription?: string
  taskNotes?: string
  boardName: string
  groupName?: string
  groupColor?: string
  statusName?: string
  statusColor?: string
  priorityName?: string
  priorityColor?: string
  startDate?: string
  dueDate?: string
  budget?: string
  subtasks?: Array<{
    title: string
    isDone: boolean
    statusName?: string
    statusColor?: string
  }>
  attachments?: Array<{
    fileName: string
    fileSize?: string
    category?: string
  }>
  taskUrl: string
  assignedBy?: string
  createdAt?: string
  settingsUrl: string
}

export function generateTaskAssignmentEmail(data: TaskEmailData): string {
  // Calcular progresso das subtarefas
  const subtasksTotal = data.subtasks?.length || 0
  const subtasksDone = data.subtasks?.filter(st => st.isDone).length || 0
  const subtasksProgress = subtasksTotal > 0 ? Math.round((subtasksDone / subtasksTotal) * 100) : 0

  // Gerar HTML das subtarefas
  const subtasksHtml = data.subtasks && data.subtasks.length > 0 ? `
    <!-- Subtarefas Section -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 24px;">
      <tr>
        <td>
          <!-- Header com progresso -->
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 12px;">
            <tr>
              <td style="vertical-align: middle;">
                <span style="color: #5B47FB; font-size: 14px; font-weight: 600; display: inline-flex; align-items: center;">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="margin-right: 6px; vertical-align: middle;">
                    <path d="M2 8h4M10 8h4M8 2v4M8 10v4" stroke="#5B47FB" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                  Subtarefas
                </span>
              </td>
              <td align="right" style="vertical-align: middle;">
                <span style="color: #5B47FB; font-size: 13px; font-weight: 600;">${subtasksProgress}% Completo</span>
              </td>
            </tr>
          </table>

          <!-- Barra de progresso -->
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 12px;">
            <tr>
              <td style="background: #E8E5FF; height: 6px; border-radius: 3px; overflow: hidden;">
                <div style="background: #5B47FB; height: 6px; width: ${subtasksProgress}%; border-radius: 3px;"></div>
              </td>
            </tr>
          </table>

          <!-- Lista de subtarefas -->
          ${data.subtasks.map(st => `
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: ${st.isDone ? '#F0FDF4' : '#FFFFFF'}; border-radius: 8px; margin-bottom: 8px; border: 1px solid ${st.isDone ? '#D1FAE5' : '#E5E7EB'};">
              <tr>
                <td style="padding: 12px 16px;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td width="24" style="vertical-align: top; padding-top: 2px;">
                        ${st.isDone ? `
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <circle cx="10" cy="10" r="9" fill="#10B981" stroke="#10B981" stroke-width="2"/>
                            <path d="M6 10l3 3 5-6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                        ` : `
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <circle cx="10" cy="10" r="9" stroke="#D1D5DB" stroke-width="2"/>
                          </svg>
                        `}
                      </td>
                      <td style="vertical-align: middle; padding-left: 12px;">
                        <span style="color: ${st.isDone ? '#059669' : '#374151'}; font-size: 14px; ${st.isDone ? 'text-decoration: line-through;' : ''}">${st.title}</span>
                        ${st.statusName ? `
                          <span style="display: inline-block; margin-left: 8px; padding: 2px 8px; background: ${st.statusColor}20; color: ${st.statusColor}; border-radius: 4px; font-size: 11px; font-weight: 500;">${st.statusName}</span>
                        ` : ''}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          `).join('')}
        </td>
      </tr>
    </table>
  ` : ''

  // Gerar HTML dos anexos
  const attachmentsHtml = data.attachments && data.attachments.length > 0 ? `
    <!-- Anexos Section -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 24px;">
      <tr>
        <td>
          <span style="color: #5B47FB; font-size: 14px; font-weight: 600; display: inline-flex; align-items: center; margin-bottom: 12px;">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="margin-right: 6px; vertical-align: middle;">
              <path d="M8 2v12M8 14l-3-3M8 14l3-3" stroke="#5B47FB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Anexos
          </span>

          ${data.attachments.map(att => `
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #FFFFFF; border-radius: 8px; margin-bottom: 8px; border: 1px solid #E5E7EB;">
              <tr>
                <td style="padding: 12px 16px;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td width="40" style="vertical-align: middle;">
                        <div style="width: 36px; height: 36px; background: #EEF2FF; border-radius: 6px; display: flex; align-items: center; justify-content: center;">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M6 2h8l4 4v10a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2z" fill="#5B47FB" opacity="0.2"/>
                            <path d="M14 2v4h4" stroke="#5B47FB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                        </div>
                      </td>
                      <td style="vertical-align: middle; padding-left: 12px;">
                        <div style="color: #111827; font-size: 14px; font-weight: 500; margin-bottom: 2px;">${att.fileName}</div>
                        <div style="color: #6B7280; font-size: 12px;">${att.fileSize || ''} ${att.category ? `• ${att.category}` : ''}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          `).join('')}
        </td>
      </tr>
    </table>
  ` : ''

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>Task Assignment</title>
      <!--[if mso]>
      <style type="text/css">
        body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
      </style>
      <![endif]-->
    </head>
    <body style="margin: 0; padding: 0; background-color: #F3F4F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      
      <!-- Wrapper Table -->
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #F3F4F6; padding: 40px 20px;">
        <tr>
          <td align="center">
            
            <!-- Main Container -->
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
              
              <!-- Header -->
              <tr>
                <td style="background: #F9FAFB; padding: 24px 32px; border-bottom: 1px solid #E5E7EB;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td style="vertical-align: middle;">
                        <table cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="vertical-align: middle; padding-right: 12px;">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <rect x="3" y="3" width="18" height="18" rx="2" fill="#5B47FB" opacity="0.1"/>
                                <path d="M9 11l3 3 6-6" stroke="#5B47FB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                              </svg>
                            </td>
                            <td style="vertical-align: middle;">
                              <span style="color: #5B47FB; font-size: 16px; font-weight: 600;">Task Assignment</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 32px;">
                  
                  <!-- Title -->
                  <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin: 0 0 16px 0; line-height: 1.3;">Nova Tarefa Atribuída</h1>
                  
                  <!-- Greeting -->
                  <p style="color: #6B7280; font-size: 14px; margin: 0 0 24px 0; line-height: 1.5;">Olá ${data.assigneeName},</p>

                  <!-- Main Card -->
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #FFFFFF; border-radius: 12px; border: 1px solid #E5E7EB; overflow: hidden; margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 24px;">
                        
                        <!-- Task Title with Priority Badge -->
                        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 16px;">
                          <tr>
                            <td style="vertical-align: top;">
                              <h2 style="color: #111827; font-size: 20px; font-weight: 600; margin: 0; line-height: 1.4;">${data.taskTitle}</h2>
                            </td>
                            ${data.priorityName ? `
                              <td align="right" style="vertical-align: top; white-space: nowrap; padding-left: 16px;">
                                <span style="display: inline-block; padding: 6px 12px; background: ${data.priorityColor}; color: #FFFFFF; border-radius: 16px; font-size: 12px; font-weight: 600; text-transform: uppercase;">${data.priorityName}</span>
                              </td>
                            ` : ''}
                          </tr>
                        </table>

                        <!-- Status Badge -->
                        ${data.statusName ? `
                          <div style="margin-bottom: 16px;">
                            <span style="display: inline-block; padding: 4px 12px; background: ${data.statusColor}15; color: ${data.statusColor}; border-radius: 6px; font-size: 13px; font-weight: 500;">${data.statusName}</span>
                          </div>
                        ` : ''}

                        <!-- Notes -->
                        ${data.taskNotes ? `
                          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #FFFBEB; border-left: 3px solid #F59E0B; border-radius: 6px; margin-bottom: 20px;">
                            <tr>
                              <td style="padding: 12px 16px;">
                                <div style="color: #92400E; font-size: 12px; font-weight: 600; margin-bottom: 4px;">Nota:</div>
                                <div style="color: #78350F; font-size: 13px; line-height: 1.5;">${data.taskNotes}</div>
                              </td>
                            </tr>
                          </table>
                        ` : ''}

                        <!-- Info Grid -->
                        <table cellpadding="0" cellspacing="0" border="0" width="100%">
                          <tr>
                            <!-- Left Column -->
                            <td width="50%" style="vertical-align: top; padding-right: 12px;">
                              
                              ${data.startDate ? `
                                <div style="margin-bottom: 16px;">
                                  <div style="color: #9CA3AF; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">INÍCIO</div>
                                  <div style="color: #374151; font-size: 14px; font-weight: 500;">
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="vertical-align: middle; margin-right: 4px;">
                                      <rect x="2" y="3" width="10" height="9" rx="1" stroke="#6B7280" stroke-width="1.5"/>
                                      <path d="M2 6h10M5 1v2M9 1v2" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round"/>
                                    </svg>
                                    ${data.startDate}
                                  </div>
                                </div>
                              ` : ''}

                              ${data.budget ? `
                                <div style="margin-bottom: 16px;">
                                  <div style="color: #9CA3AF; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">ORÇAMENTO</div>
                                  <div style="color: #059669; font-size: 16px; font-weight: 700;">${data.budget}</div>
                                </div>
                              ` : ''}

                            </td>

                            <!-- Right Column -->
                            <td width="50%" style="vertical-align: top; padding-left: 12px;">
                              
                              ${data.dueDate ? `
                                <div style="margin-bottom: 16px;">
                                  <div style="color: #9CA3AF; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">VENCIMENTO</div>
                                  <div style="color: #374151; font-size: 14px; font-weight: 500;">
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="vertical-align: middle; margin-right: 4px;">
                                      <rect x="2" y="3" width="10" height="9" rx="1" stroke="#6B7280" stroke-width="1.5"/>
                                      <path d="M2 6h10M5 1v2M9 1v2" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round"/>
                                    </svg>
                                    ${data.dueDate}
                                  </div>
                                </div>
                              ` : ''}

                              ${data.groupName ? `
                                <div style="margin-bottom: 16px;">
                                  <div style="color: #9CA3AF; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">GRUPO</div>
                                  <div style="color: #374151; font-size: 14px; font-weight: 500;">${data.groupName}</div>
                                </div>
                              ` : ''}

                            </td>
                          </tr>
                        </table>

                      </td>
                    </tr>
                  </table>

                  ${subtasksHtml}
                  ${attachmentsHtml}

                  <!-- CTA Button -->
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 32px;">
                    <tr>
                      <td align="center">
                        <a href="${data.taskUrl}" style="display: inline-block; background: #5B47FB; color: #FFFFFF; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(91, 71, 251, 0.3);">
                          Ver Tarefa Completa
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="vertical-align: middle; margin-left: 6px;">
                            <path d="M6 3l5 5-5 5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                        </a>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background: #F9FAFB; padding: 24px 32px; border-top: 1px solid #E5E7EB;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td align="center">
                        <p style="color: #9CA3AF; font-size: 12px; margin: 0 0 12px 0;">
                          <a href="${data.settingsUrl}" style="color: #5B47FB; text-decoration: none; font-weight: 500;">View in Browser</a>
                          <span style="margin: 0 8px;">•</span>
                          <a href="${data.settingsUrl}" style="color: #9CA3AF; text-decoration: none;">Unsubscribe</a>
                          <span style="margin: 0 8px;">•</span>
                          <a href="${data.settingsUrl}" style="color: #9CA3AF; text-decoration: none;">Privacy Policy</a>
                        </p>
                        <p style="color: #D1D5DB; font-size: 11px; margin: 0;">© 2024 High-Performance Teams. All rights reserved.</p>
                      </td>
                    </tr>
                  </table>
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
