/**
 * Script de teste para verificar o sistema de notificações por email
 * 
 * Uso: npx tsx scripts/test-email-notification.ts
 */

import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Carregar variáveis de ambiente
dotenv.config({ path: join(__dirname, '../.env') })

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const EMAIL_USER = process.env.NUXT_EMAIL_USER!
const EMAIL_PASS = process.env.NUXT_EMAIL_PASS!
const EMAIL_SMTP = process.env.NUXT_EMAIL_SMTP!
const EMAIL_PORT = parseInt(process.env.NUXT_EMAIL_PORT || '465')
const APP_URL = process.env.NUXT_PUBLIC_APP_URL!

console.log('🔍 Iniciando teste de notificações por email...\n')

// Verificar variáveis de ambiente
console.log('📋 Verificando configurações:')
console.log(`  ✓ SUPABASE_URL: ${SUPABASE_URL}`)
console.log(`  ✓ SUPABASE_SERVICE_KEY: ${SUPABASE_SERVICE_KEY ? '***' + SUPABASE_SERVICE_KEY.slice(-4) : 'MISSING'}`)
console.log(`  ✓ EMAIL_USER: ${EMAIL_USER}`)
console.log(`  ✓ EMAIL_PASS: ${EMAIL_PASS ? '***' : 'MISSING'}`)
console.log(`  ✓ EMAIL_SMTP: ${EMAIL_SMTP}`)
console.log(`  ✓ EMAIL_PORT: ${EMAIL_PORT}`)
console.log(`  ✓ APP_URL: ${APP_URL}\n`)

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !EMAIL_USER || !EMAIL_PASS || !EMAIL_SMTP) {
  console.error('❌ Variáveis de ambiente faltando!')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function testDatabaseConnection() {
  console.log('🔌 Testando conexão com banco de dados...')
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .limit(1)
    
    if (error) throw error
    
    console.log('  ✅ Conexão com banco OK\n')
    return true
  } catch (error: any) {
    console.error('  ❌ Erro ao conectar:', error.message)
    return false
  }
}

async function testEmailPreferencesTable() {
  console.log('📊 Verificando tabela email_preferences...')
  
  try {
    const { data, error } = await supabase
      .from('email_preferences')
      .select('*')
      .limit(1)
    
    if (error) throw error
    
    console.log(`  ✅ Tabela existe (${data?.length || 0} registros encontrados)\n`)
    return true
  } catch (error: any) {
    console.error('  ❌ Erro:', error.message)
    console.log('  💡 Execute a migração: supabase/migrations/20260417000000_create_email_preferences.sql\n')
    return false
  }
}

async function testSMTPConnection() {
  console.log('📧 Testando conexão SMTP...')
  
  try {
    const transporter = nodemailer.createTransport({
      host: EMAIL_SMTP,
      port: EMAIL_PORT,
      secure: true,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
      }
    })
    
    await transporter.verify()
    console.log('  ✅ Conexão SMTP OK\n')
    return transporter
  } catch (error: any) {
    console.error('  ❌ Erro ao conectar SMTP:', error.message)
    console.log('  💡 Verifique as credenciais de email no .env\n')
    return null
  }
}

async function findTestData() {
  console.log('🔍 Buscando dados de teste...')
  
  // Buscar um usuário com email
  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .not('email', 'is', null)
    .limit(5)
  
  console.log(`  📝 Usuários encontrados: ${users?.length || 0}`)
  users?.forEach(u => console.log(`     - ${u.full_name} (${u.email})`))
  
  // Buscar uma tarefa
  const { data: tasks } = await supabase
    .from('tasks')
    .select(`
      id, 
      title,
      board:boards(id, name)
    `)
    .limit(5)
  
  console.log(`  📋 Tarefas encontradas: ${tasks?.length || 0}`)
  tasks?.forEach(t => console.log(`     - ${t.title} (Board: ${t.board?.name})`))
  
  console.log()
  
  return { users, tasks }
}

async function testEmailSending(transporter: any, testEmail: string) {
  console.log(`📨 Testando envio de email para: ${testEmail}`)
  
  try {
    const testHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 30px; border-radius: 8px;">
          <h1 style="color: #6366f1;">✅ Teste de Email</h1>
          <p>Este é um email de teste do sistema de notificações.</p>
          <p>Se você recebeu este email, significa que o sistema está funcionando corretamente!</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #6b7280;">
            Enviado em: ${new Date().toLocaleString('pt-BR')}
          </p>
        </div>
      </body>
      </html>
    `
    
    const info = await transporter.sendMail({
      from: `"Sistema Kanban - Teste" <${EMAIL_USER}>`,
      to: testEmail,
      subject: '✅ Teste de Notificação - Sistema Kanban',
      html: testHtml
    })
    
    console.log('  ✅ Email enviado com sucesso!')
    console.log(`  📬 Message ID: ${info.messageId}\n`)
    return true
  } catch (error: any) {
    console.error('  ❌ Erro ao enviar email:', error.message)
    return false
  }
}

async function testTaskAssignmentEmail(transporter: any, taskId: string, userId: string, userEmail: string) {
  console.log(`📋 Testando email de atribuição de tarefa...`)
  console.log(`  Task ID: ${taskId}`)
  console.log(`  User ID: ${userId}`)
  console.log(`  Email: ${userEmail}`)
  
  try {
    // Buscar todas as informações da tarefa
    const { data: task, error } = await supabase
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
          priority:task_priorities(name, color)
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
    
    if (error) throw error
    if (!task) throw new Error('Tarefa não encontrada')
    
    console.log(`  ✅ Tarefa encontrada: "${task.title}"`)
    console.log(`  📊 Board: ${task.board?.name || 'N/A'}`)
    console.log(`  👥 Responsáveis: ${task.assignees?.length || 0}`)
    console.log(`  📎 Anexos: ${task.attachments?.length || 0}`)
    console.log(`  ✓ Subtarefas: ${task.subtasks?.length || 0}`)
    
    // Buscar preferências do usuário
    const { data: prefs } = await supabase
      .from('email_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (!prefs) {
      console.log('  ⚠️  Preferências não encontradas, criando padrão...')
      await supabase
        .from('email_preferences')
        .insert({
          user_id: userId,
          task_assigned_enabled: true
        })
    } else {
      console.log(`  ✅ Preferências encontradas`)
      console.log(`     - task_assigned_enabled: ${prefs.task_assigned_enabled}`)
      console.log(`     - max_emails_per_hour: ${prefs.max_emails_per_hour}`)
      console.log(`     - max_emails_per_day: ${prefs.max_emails_per_day}`)
      
      if (!prefs.task_assigned_enabled) {
        console.log('  ⚠️  Notificações de tarefa atribuída estão DESABILITADAS!')
        return false
      }
    }
    
    // Verificar rate limit
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { data: recentEmails } = await supabase
      .from('email_sent_log')
      .select('id, sent_at')
      .eq('user_id', userId)
      .gte('sent_at', oneHourAgo)
    
    console.log(`  📊 Emails enviados na última hora: ${recentEmails?.length || 0}`)
    
    // Criar HTML do email (versão simplificada para teste)
    const taskUrl = `${APP_URL}/boards/${task.board?.id}?task=${task.id}`
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; margin-top: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Nova Tarefa Atribuída</h1>
          </div>
          <div style="padding: 30px;">
            <p>Olá <strong>${userEmail}</strong>,</p>
            <p>Você foi atribuído a uma nova tarefa:</p>
            <div style="background: #f9fafb; padding: 20px; border-radius: 6px; border-left: 4px solid ${task.group?.color || '#6366f1'};">
              <h2 style="margin: 0 0 10px 0;">${task.title}</h2>
              ${task.description ? `<p style="color: #6b7280;">${task.description}</p>` : ''}
              <p><strong>Board:</strong> ${task.board?.name || 'N/A'}</p>
              ${task.status ? `<p><strong>Status:</strong> ${task.status.name}</p>` : ''}
              ${task.priority ? `<p><strong>Prioridade:</strong> ${task.priority.name}</p>` : ''}
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${taskUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                Ver Tarefa Completa
              </a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
    
    // Enviar email
    const info = await transporter.sendMail({
      from: `"Sistema Kanban Qualitec" <${EMAIL_USER}>`,
      to: userEmail,
      subject: `Nova Tarefa: ${task.title}`,
      html: emailHtml
    })
    
    console.log('  ✅ Email de tarefa enviado com sucesso!')
    console.log(`  📬 Message ID: ${info.messageId}`)
    
    // Registrar no log
    await supabase
      .from('email_sent_log')
      .insert({
        user_id: userId,
        email_type: 'task_assigned',
        task_id: taskId
      })
    
    console.log('  ✅ Log registrado no banco\n')
    return true
    
  } catch (error: any) {
    console.error('  ❌ Erro:', error.message)
    console.error(error)
    return false
  }
}

async function main() {
  console.log('═'.repeat(60))
  console.log('  TESTE DE SISTEMA DE NOTIFICAÇÕES POR EMAIL')
  console.log('═'.repeat(60))
  console.log()
  
  // 1. Testar conexão com banco
  const dbOk = await testDatabaseConnection()
  if (!dbOk) {
    console.log('❌ Teste abortado: problema na conexão com banco\n')
    process.exit(1)
  }
  
  // 2. Verificar tabela de preferências
  const tableOk = await testEmailPreferencesTable()
  if (!tableOk) {
    console.log('❌ Teste abortado: tabela email_preferences não existe\n')
    process.exit(1)
  }
  
  // 3. Testar conexão SMTP
  const transporter = await testSMTPConnection()
  if (!transporter) {
    console.log('❌ Teste abortado: problema na conexão SMTP\n')
    process.exit(1)
  }
  
  // 4. Buscar dados de teste
  const { users, tasks } = await findTestData()
  
  if (!users || users.length === 0) {
    console.log('❌ Nenhum usuário com email encontrado\n')
    process.exit(1)
  }
  
  if (!tasks || tasks.length === 0) {
    console.log('⚠️  Nenhuma tarefa encontrada, mas podemos testar email simples\n')
  }
  
  // 5. Testar envio de email simples
  console.log('═'.repeat(60))
  console.log('  TESTE 1: Email Simples')
  console.log('═'.repeat(60))
  console.log()
  
  const testUser = users[0]
  await testEmailSending(transporter, testUser.email)
  
  // 6. Testar email de atribuição de tarefa (se houver tarefa)
  if (tasks && tasks.length > 0) {
    console.log('═'.repeat(60))
    console.log('  TESTE 2: Email de Atribuição de Tarefa')
    console.log('═'.repeat(60))
    console.log()
    
    const testTask = tasks[0]
    await testTaskAssignmentEmail(transporter, testTask.id, testUser.id, testUser.email)
  }
  
  console.log('═'.repeat(60))
  console.log('  ✅ TESTES CONCLUÍDOS')
  console.log('═'.repeat(60))
  console.log()
  console.log('📧 Verifique a caixa de entrada de:', testUser.email)
  console.log('💡 Se não recebeu, verifique a pasta de spam/lixo eletrônico')
  console.log()
}

main().catch(console.error)
