# Debug: Email de Atribuição de Responsável

## Causa Raiz do Problema

### 1. Erro no activity_logs (400 Bad Request)
**Problema**: A tabela `activity_logs` tem RLS (Row Level Security) habilitado mas **não possui política de INSERT**.

**Localização**: `supabase/migrations/20260331135002_enable_rls_and_policies.sql`

**Política existente**:
```sql
create policy "activity_logs: read in org" 
  on public.activity_logs 
  for select 
  using (public.my_role() in ('master','collaborator'));
```

**Problema**: Falta política para INSERT, causando erro 400 quando qualquer código tenta registrar atividade.

### 2. Relação com o Envio de Email
**Resposta**: O erro do activity_logs **NÃO impede diretamente** o envio de email, pois:
- O `AssigneeCell.vue` não chama `logActivity` diretamente
- O `useTaskAssignees.ts` tem try/catch que isola falhas de email
- O erro vem de outro componente (provavelmente `useSubtaskActivity.ts`)

**Porém**: O erro pode estar causando confusão e mascarando outros problemas.

## Correções Aplicadas

### 1. Migration para Corrigir RLS
**Arquivo**: `supabase/migrations/20260428000000_fix_activity_logs_rls.sql`

```sql
-- Adicionar política de INSERT para activity_logs
create policy "activity_logs: collaborator+ can insert" 
  on public.activity_logs 
  for insert 
  with check (public.my_role() in ('master','collaborator'));

-- Adicionar política de INSERT para notifications
create policy "notifications: system can insert" 
  on public.notifications 
  for insert 
  with check (true);
```

### 2. Logs Detalhados no Backend
**Arquivo**: `server/api/emails/task-assigned.post.ts`

Adicionados logs detalhados em cada etapa:
- ✓ Request recebido
- ✓ Config carregado
- ✓ Preferências buscadas
- ✓ Rate limit verificado
- ✓ Tarefa encontrada
- ✓ Responsável encontrado
- ✓ Email enviado
- ✓ Log registrado

### 3. Melhorias no useTaskAssignees
**Arquivo**: `app/composables/useTaskAssignees.ts`

- Logs mais claros com marcadores visuais (✓, ✗, ⊘, →)
- Try/catch específico para email (não propaga erro)
- Verificação de duplicata antes de inserir
- Mensagens de início e fim de operação

## Como Testar

### 1. Aplicar a Migration
```bash
# No Supabase Dashboard ou via CLI
supabase migration up
```

Ou execute manualmente no SQL Editor do Supabase:
```sql
create policy "activity_logs: collaborator+ can insert" 
  on public.activity_logs 
  for insert 
  with check (public.my_role() in ('master','collaborator'));
```

### 2. Verificar Configurações de Email
Confirme que as variáveis estão no `.env`:
- ✓ NUXT_EMAIL_USER
- ✓ NUXT_EMAIL_PASS
- ✓ NUXT_EMAIL_SMTP
- ✓ NUXT_EMAIL_PORT
- ✓ NUXT_EMAIL_FROM_NAME

### 3. Testar Fluxo Completo

1. **Abra o console do navegador** (F12)
2. **Abra uma tarefa** e vá para a coluna "Responsável"
3. **Adicione um responsável**
4. **Observe os logs no console**:
   ```
   [useTaskAssignees] ========== ADD ASSIGNEE START ==========
   [useTaskAssignees] Adding assignee: { taskId: '...', userId: '...' }
   [useTaskAssignees] → Inserting into task_assignees...
   [useTaskAssignees] ✓ Assignee added to database
   [useTaskAssignees] → Fetching updated assignee list...
   [useTaskAssignees] ✓ Assignee list updated
   [useTaskAssignees] → Attempting to send email notification...
   [useEmailNotifications] Sending task assigned email: { taskId: '...', assigneeId: '...' }
   [useEmailNotifications] Email API response: { success: true, sent: true }
   [useTaskAssignees] ✓ Email notification result: { success: true, sent: true }
   [useTaskAssignees] ========== ADD ASSIGNEE END (success) ==========
   ```

5. **Verifique os logs do servidor** (terminal onde roda `npm run dev`):
   ```
   ========== [TASK-ASSIGNED EMAIL] START ==========
   [task-assigned] ✓ Request received
   [task-assigned] ✓ Config loaded
   [task-assigned] ✓ Preferences fetched
   [task-assigned] ✓ Rate limit check
   [task-assigned] ✓ Task found
   [task-assigned] ✓ Assignee found
   [task-assigned] ✓ Transporter configured
   [task-assigned] → Sending email...
   [task-assigned] ✓ Email sent successfully!
   [task-assigned] ✓ Email log registered
   ========== [TASK-ASSIGNED EMAIL] END (success) ==========
   ```

6. **Verifique o email** na caixa de entrada do responsável

### 4. Verificar Preferências de Email

Se o email não chegar, verifique se o usuário tem preferências habilitadas:

```sql
-- No Supabase SQL Editor
SELECT * FROM email_preferences WHERE user_id = 'USER_ID_AQUI';
```

Se não existir registro, crie um:
```sql
INSERT INTO email_preferences (
  user_id, 
  task_assigned_enabled,
  max_emails_per_hour,
  max_emails_per_day
) VALUES (
  'USER_ID_AQUI',
  true,
  10,
  50
);
```

### 5. Verificar Rate Limits

Se o email não chegar, pode ser rate limit:

```sql
-- Verificar emails enviados nas últimas 24h
SELECT * FROM email_sent_log 
WHERE user_id = 'USER_ID_AQUI' 
AND sent_at > NOW() - INTERVAL '24 hours'
ORDER BY sent_at DESC;
```

## Checklist de Validação

- [ ] Migration aplicada no Supabase
- [ ] Erro 400 do activity_logs não aparece mais
- [ ] Logs detalhados aparecem no console do navegador
- [ ] Logs detalhados aparecem no terminal do servidor
- [ ] Email chega na caixa de entrada do responsável
- [ ] Email contém todas as informações da tarefa
- [ ] Falha no email não impede adicionar responsável

## Próximos Passos

Se o email ainda não chegar após aplicar as correções:

1. **Verificar credenciais SMTP**: Teste manualmente com um cliente de email
2. **Verificar firewall**: Porta 465 pode estar bloqueada
3. **Verificar logs do Skymail**: Pode haver rejeição no servidor
4. **Testar com outro email**: Pode ser filtro de spam
5. **Verificar quota**: Pode ter atingido limite do servidor SMTP

## Arquivos Modificados

1. `supabase/migrations/20260428000000_fix_activity_logs_rls.sql` (novo)
2. `server/api/emails/task-assigned.post.ts` (logs melhorados)
3. `app/composables/useTaskAssignees.ts` (logs melhorados)
4. `docs/EMAIL_ASSIGNEE_DEBUG.md` (este arquivo)
