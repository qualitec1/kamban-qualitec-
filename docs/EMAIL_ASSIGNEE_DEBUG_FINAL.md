# Debug Final - Email de Responsável

## CAUSA RAIZ IDENTIFICADA

O `AssigneeCell.vue` estava fazendo INSERT direto no Supabase **sem chamar** a função `addAssignee()` do composable `useTaskAssignees.ts`, que contém a lógica de envio de email.

### Fluxo ANTERIOR (ERRADO):
```
AssigneeCell.toggleAssignee() 
  → INSERT direto no Supabase
  → ❌ NÃO chama addAssignee()
  → ❌ NÃO envia email
```

### Fluxo CORRIGIDO (AGORA):
```
AssigneeCell.toggleAssignee() 
  → Chama addAssignee() do composable
  → addAssignee() faz INSERT no Supabase
  → ✅ addAssignee() chama sendTaskAssignedEmail()
  → ✅ Email é enviado
```

## ARQUIVOS ALTERADOS

### 1. `app/components/AssigneeCell.vue`
- **Linha ~400-450**: Função `toggleAssignee()` modificada
- **ANTES**: Fazia INSERT direto com `supabase.from('task_assignees').insert(...)`
- **AGORA**: Chama `addAssignee(userId, props.taskId)` do composable
- **Logs adicionados**: Logs detalhados em cada etapa do processo

## LOGS ESPERADOS NO CONSOLE DO NAVEGADOR

Quando você adicionar um responsável, deve ver esta sequência:

```
[AssigneeCell.toggleAssignee] ========== START ==========
[AssigneeCell.toggleAssignee] User ID: <uuid>
[AssigneeCell.toggleAssignee] Task ID: <uuid>
[AssigneeCell.toggleAssignee] Is Subtask: false
[AssigneeCell.toggleAssignee] Is currently assigned: false
[AssigneeCell.toggleAssignee] Previous assignees: [...]
[AssigneeCell.toggleAssignee] → Adding assignee (optimistic)
[AssigneeCell.toggleAssignee] ✓ Member found and added: {...}
[AssigneeCell.toggleAssignee] New assignees: [...]
[AssigneeCell.toggleAssignee] ✓ Update emitted
[AssigneeCell.toggleAssignee] → Calling addAssignee() (will trigger email)...
[useTaskAssignees] ========== ADD ASSIGNEE START ==========
[useTaskAssignees] Adding assignee: { taskId: ..., userId: ... }
[useTaskAssignees] → Inserting into task_assignees...
[useTaskAssignees] ✓ Assignee added to database
[useTaskAssignees] → Fetching updated assignee list...
[useTaskAssignees] ✓ Assignee list updated
[useTaskAssignees] → Attempting to send email notification...
[useEmailNotifications] Sending task assigned email: { taskId: ..., assigneeId: ... }
[useEmailNotifications] Email API response: { success: true, sent: true, duration: ... }
[useTaskAssignees] ✓ Email notification result: true
[useTaskAssignees] ========== ADD ASSIGNEE END (success) ==========
[AssigneeCell.toggleAssignee] ✓ Assignee added successfully (email should be sent)
[AssigneeCell.toggleAssignee] ========== END (success) ==========
```

## LOGS ESPERADOS NO SERVIDOR (Terminal)

No terminal onde o servidor Nuxt está rodando:

```
========== [TASK-ASSIGNED EMAIL] START ==========
[task-assigned] Timestamp: 2026-04-28T...
[task-assigned] ✓ Request received
[task-assigned] Payload: { taskId: '...', assigneeId: '...' }
[task-assigned] ✓ Config loaded
[task-assigned] Config check: { hasSupabaseUrl: true, hasSupabaseKey: true, ... }
[task-assigned] ✓ Supabase client created
[task-assigned] → Fetching email preferences for user: ...
[task-assigned] ✓ Preferences fetched: { found: true, enabled: true, ... }
[task-assigned] → Checking rate limits...
[task-assigned] ✓ Rate limit check: { emailsLastHour: 0, maxPerHour: 10, ... }
[task-assigned] → Fetching task details...
[task-assigned] ✓ Task found: { id: ..., title: ..., board: ..., group: ... }
[task-assigned] → Fetching assignee details...
[task-assigned] ✓ Assignee found: { id: ..., name: ..., email: ... }
[task-assigned] → Configuring email transporter...
[task-assigned] ✓ Transporter configured
[task-assigned] → Sending email...
[task-assigned] Email details: { from: ..., to: ..., subject: ... }
[task-assigned] ✓ Email sent successfully!
[task-assigned] Email result: { messageId: ..., accepted: [...], rejected: [] }
[task-assigned] → Registering email log...
[task-assigned] ✓ Email log registered
[task-assigned] ✓ Total duration: 1234 ms
========== [TASK-ASSIGNED EMAIL] END (success) ==========
```

## PASSO A PASSO PARA TESTAR

### 1. Abrir Console do Navegador
- Pressione F12
- Vá para a aba "Console"
- Limpe o console (botão 🚫 ou Ctrl+L)

### 2. Abrir Terminal do Servidor
- Mantenha visível o terminal onde o servidor Nuxt está rodando
- Você verá os logs do backend aqui

### 3. Adicionar Responsável
- Vá para um board
- Abra uma tarefa
- Clique na coluna "Responsável"
- Selecione um membro que NÃO está atribuído ainda
- Clique no membro

### 4. Verificar Logs
- **Console do navegador**: Deve mostrar toda a sequência acima
- **Terminal do servidor**: Deve mostrar os logs do backend
- **Email**: O responsável deve receber o email em alguns segundos

## POSSÍVEIS PROBLEMAS E SOLUÇÕES

### ❌ Erro: "User already assigned, skipping"
**Causa**: O usuário já está atribuído à tarefa
**Solução**: Remova o usuário primeiro, depois adicione novamente

### ❌ Erro: "Notifications disabled, skipping email"
**Causa**: O usuário desabilitou notificações de email
**Solução**: 
1. Vá para `/settings`
2. Habilite "Notificações de tarefas atribuídas"
3. Tente novamente

### ❌ Erro: "hourly_limit_exceeded" ou "daily_limit_exceeded"
**Causa**: Limite de emails atingido
**Solução**: Aguarde ou aumente o limite em `/settings`

### ❌ Erro: "Assignee not found or no email"
**Causa**: O perfil do usuário não tem email cadastrado
**Solução**: Verifique se o usuário tem email no perfil

### ❌ Erro: "Failed to send email" no servidor
**Causa**: Configuração de email incorreta
**Solução**: Verifique as variáveis de ambiente:
- `EMAIL_SMTP`
- `EMAIL_PORT`
- `EMAIL_USER`
- `EMAIL_PASS`
- `EMAIL_FROM_NAME`

### ❌ Erro 400 em activity_logs
**Causa**: Política RLS não permite INSERT
**Solução**: Execute a migration `20260428000000_fix_activity_logs_rls.sql`

## VALIDAÇÃO FINAL

Para confirmar que está funcionando:

1. ✅ Console do navegador mostra logs completos sem erros
2. ✅ Terminal do servidor mostra "Email sent successfully!"
3. ✅ Email chega na caixa de entrada do responsável
4. ✅ Responsável aparece na lista de responsáveis da tarefa
5. ✅ Não há erros 400 ou 500 no console

## INFORMAÇÕES TÉCNICAS

### Fluxo Completo
1. Usuário clica em responsável no `AssigneeCell.vue`
2. `toggleAssignee()` é chamado
3. `addAssignee()` do composable é chamado
4. INSERT em `task_assignees` no Supabase
5. `sendTaskAssignedEmail()` é chamado
6. API `/api/emails/task-assigned` é chamada
7. Backend busca dados da tarefa, grupo, board
8. Backend busca preferências de email do usuário
9. Backend verifica rate limits
10. Backend monta HTML do email
11. Backend envia email via Nodemailer
12. Backend registra em `email_sent_log`
13. Retorna sucesso para o frontend

### Tabelas Envolvidas
- `task_assignees`: Armazena associação tarefa-responsável
- `tasks`: Dados da tarefa
- `task_groups`: Grupo da tarefa
- `boards`: Board da tarefa
- `profiles`: Dados do responsável
- `email_preferences`: Preferências de email do usuário
- `email_sent_log`: Log de emails enviados
- `activity_logs`: Log de atividades (opcional)

### Variáveis de Ambiente Necessárias
```env
# Supabase
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...

# Email
EMAIL_SMTP=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-app
EMAIL_FROM_NAME=Sistema Kanban

# App
PUBLIC_APP_URL=http://localhost:3000
```
