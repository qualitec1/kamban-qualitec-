# Troubleshooting - Sistema de Notificações por Email

## Como Testar o Sistema

### 1. Verificar Logs no Console do Navegador

Ao atribuir um responsável a uma tarefa, você deve ver logs como:

```
[useTaskAssignees] Adding assignee: { taskId: "...", userId: "..." }
[useTaskAssignees] Assignee added successfully, fetching updated list...
[useTaskAssignees] Attempting to send email notification...
[useEmailNotifications] Sending task assigned email: { taskId: "...", assigneeId: "..." }
[useEmailNotifications] Email API response: { success: true, sent: true }
[useTaskAssignees] Email notification result: true
```

### 2. Verificar Logs no Terminal do Servidor

No terminal onde o Nuxt está rodando (`npm run dev`), você deve ver:

```
[task-assigned API] Received request: { taskId: "...", assigneeId: "..." }
[task-assigned API] Config check: { hasSupabaseUrl: true, hasSupabaseKey: true, ... }
[task-assigned API] Fetching email preferences for user: ...
[task-assigned API] Preferences: { task_assigned_enabled: true, ... }
[task-assigned API] Checking rate limits...
[task-assigned API] Rate limit check: { emailsLastHour: 0, ... }
[task-assigned API] Fetching task details...
[task-assigned API] Task found: { title: "...", board: "...", ... }
[task-assigned API] Fetching assignee details...
[task-assigned API] Assignee found: { name: "...", email: "..." }
[task-assigned API] Configuring email transporter...
[task-assigned API] Sending email to: ...
[task-assigned API] Email sent successfully
[task-assigned API] Log registered
```

## Problemas Comuns

### ❌ Email não está sendo enviado

#### Causa 1: Servidor não está rodando
**Sintoma**: Nenhum log aparece no terminal do servidor
**Solução**: 
```bash
npm run dev
```

#### Causa 2: Notificações desabilitadas
**Sintoma**: Log mostra "Notifications disabled, skipping email"
**Solução**: 
1. Acesse `/settings`
2. Vá em "Notificações por Email"
3. Ative "Tarefa atribuída a mim"

#### Causa 3: Rate limit excedido
**Sintoma**: Log mostra "Hourly limit exceeded" ou "Daily limit exceeded"
**Solução**:
1. Acesse `/settings`
2. Aumente os limites de email
3. Ou aguarde 1 hora/24 horas

#### Causa 4: Usuário sem email
**Sintoma**: Log mostra "Assignee not found or no email"
**Solução**: Verifique se o usuário tem email cadastrado no perfil

#### Causa 5: Erro de SMTP
**Sintoma**: Log mostra erro ao enviar email
**Solução**: Verifique as credenciais no `.env`:
```env
NUXT_EMAIL_USER=seu-email@dominio.com
NUXT_EMAIL_PASS=sua-senha
NUXT_EMAIL_SMTP=smtp.servidor.com
NUXT_EMAIL_PORT=465
```

#### Causa 6: Variáveis de ambiente não carregadas
**Sintoma**: Log mostra "Config check" com valores false
**Solução**: 
1. Reinicie o servidor (`Ctrl+C` e `npm run dev`)
2. Verifique se o arquivo `.env` existe na raiz do projeto

### ❌ Email vai para spam

**Solução**:
1. Adicione o remetente (`catalogo@qualitec.ind.br`) aos contatos
2. Marque o email como "Não é spam"
3. Configure SPF/DKIM no servidor de email (avançado)

### ❌ Email demora para chegar

**Normal**: Emails podem levar de alguns segundos até 5 minutos
**Se demorar mais**: Verifique a pasta de spam

## Comandos Úteis

### Testar envio de email manualmente
```bash
npx tsx scripts/test-email-notification.ts
```

### Verificar logs de emails enviados
```sql
SELECT 
  esl.*,
  p.full_name,
  p.email,
  t.title as task_title
FROM email_sent_log esl
LEFT JOIN profiles p ON p.id = esl.user_id
LEFT JOIN tasks t ON t.id = esl.task_id
ORDER BY esl.sent_at DESC
LIMIT 20;
```

### Limpar logs antigos
```sql
DELETE FROM email_sent_log
WHERE sent_at < NOW() - INTERVAL '7 days';
```

### Resetar preferências de um usuário
```sql
UPDATE email_preferences
SET 
  task_assigned_enabled = true,
  max_emails_per_hour = 10,
  max_emails_per_day = 50
WHERE user_id = 'USER_ID_AQUI';
```

## Checklist de Verificação

Antes de reportar um problema, verifique:

- [ ] Servidor está rodando (`npm run dev`)
- [ ] Arquivo `.env` existe e está configurado
- [ ] Notificações estão ativadas em `/settings`
- [ ] Usuário tem email cadastrado
- [ ] Rate limits não foram excedidos
- [ ] Console do navegador não mostra erros
- [ ] Terminal do servidor não mostra erros
- [ ] Verificou pasta de spam
- [ ] Aguardou pelo menos 5 minutos

## Logs Detalhados

Para ativar logs mais detalhados, adicione no `.env`:

```env
DEBUG=nodemailer:*
```

E reinicie o servidor.

## Suporte

Se o problema persistir após verificar todos os itens acima:

1. Copie os logs do console do navegador
2. Copie os logs do terminal do servidor
3. Tire um print da página `/settings`
4. Verifique a tabela `email_sent_log` no banco
5. Execute o script de teste: `npx tsx scripts/test-email-notification.ts`
