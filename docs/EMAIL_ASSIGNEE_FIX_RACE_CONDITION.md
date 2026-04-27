# Correção: Race Condition no Envio de Email de Responsável

## CAUSA RAIZ IDENTIFICADA

O problema era uma **race condition** causada por **update otimista** no frontend:

### Fluxo com o Bug:

1. **AssigneeCell.vue** detecta que usuário NÃO está atribuído (verifica estado local)
2. **Update otimista**: Adiciona usuário ao array `assignees.value` IMEDIATAMENTE
3. **Chama `addAssignee()`** do composable
4. **`addAssignee()` verifica** se usuário já está em `assignees.value`
5. **Encontra o usuário** (porque o update otimista já adicionou!)
6. **Retorna "already assigned, skipping"** ❌
7. **Email NÃO é enviado** ❌

### Problema Específico:

```typescript
// AssigneeCell.vue - linha ~400
// Update otimista ANTES de chamar addAssignee
assignees.value.push(newAssignee) // ← Adiciona ao estado local

// Depois chama addAssignee
await addAssignee(userId, props.taskId)

// useTaskAssignees.ts - linha ~60
// Verifica no estado local (que já foi modificado!)
const isAlreadyAssigned = currentAssignees.some(a => a.id === userId) // ← TRUE!
if (isAlreadyAssigned) {
  return true // ← Pula inserção e email!
}
```

## CORREÇÃO APLICADA

Modificamos `addAssignee()` para **verificar no BANCO DE DADOS** ao invés do estado local:

```typescript
// ANTES (ERRADO):
const currentAssignees = [...assignees.value] // ← Estado local (stale)
const isAlreadyAssigned = currentAssignees.some(a => a.id === userId)

// DEPOIS (CORRETO):
const { data: existingAssignment } = await supabase
  .from('task_assignees')
  .select('user_id')
  .eq('task_id', id)
  .eq('user_id', userId)
  .maybeSingle() // ← Consulta o banco diretamente

if (existingAssignment) {
  // Realmente existe no banco
}
```

## ARQUIVOS ALTERADOS

### 1. `app/composables/useTaskAssignees.ts`
**Função**: `addAssignee()`
**Linhas**: ~55-120

**Mudanças**:
- Removida verificação baseada em `assignees.value` (estado local)
- Adicionada consulta ao banco com `.maybeSingle()` para verificar existência real
- Logs detalhados mostrando resultado da consulta ao banco
- Logs mostrando se insert foi feito ou pulado

### 2. `app/components/AssigneeCell.vue`
**Função**: `toggleAssignee()`
**Linhas**: ~400-470

**Mudanças**:
- Logs mais detalhados mostrando estado local vs banco
- Nota explícita que `addAssignee()` verifica no banco, não no estado local
- Logs mostrando assignees antes e depois do update otimista

## LOGS ESPERADOS NO PRÓXIMO TESTE

### Console do Navegador:

```
[AssigneeCell.toggleAssignee] ========== START ==========
[AssigneeCell.toggleAssignee] User ID: <uuid>
[AssigneeCell.toggleAssignee] Task ID: <uuid>
[AssigneeCell.toggleAssignee] Is Subtask: false
[AssigneeCell.toggleAssignee] Is currently assigned (local state): false
[AssigneeCell.toggleAssignee] Previous assignees (local state): []
[AssigneeCell.toggleAssignee] → Adding assignee (optimistic)
[AssigneeCell.toggleAssignee] ✓ Member found and added (optimistic): { id: ..., name: ..., email: ... }
[AssigneeCell.toggleAssignee] New assignees (after optimistic update): [{ id: ..., name: ... }]
[AssigneeCell.toggleAssignee] ✓ Update emitted
[AssigneeCell.toggleAssignee] → Calling addAssignee() (will check DB and trigger email)...
[AssigneeCell.toggleAssignee] ⚠ Note: addAssignee will verify in DATABASE, not local state

[useTaskAssignees] ========== ADD ASSIGNEE START ==========
[useTaskAssignees] Adding assignee: { taskId: ..., userId: ... }
[useTaskAssignees] → Checking database for existing assignment...
[useTaskAssignees] Database check result: { existsInDatabase: false, userId: ..., taskId: ... }
[useTaskAssignees] ✓ User NOT in database, proceeding with insert
[useTaskAssignees] → Inserting into task_assignees...
[useTaskAssignees] ✓ Assignee added to database
[useTaskAssignees] → Fetching updated assignee list...
[useTaskAssignees] ✓ Assignee list updated
[useTaskAssignees] Updated assignees: [{ id: ..., name: ... }]
[useTaskAssignees] → Attempting to send email notification...
[useTaskAssignees] Email will be sent to user: <uuid>
[useEmailNotifications] Sending task assigned email: { taskId: ..., assigneeId: ... }
[useEmailNotifications] Email API response: { success: true, sent: true, duration: ... }
[useTaskAssignees] ✓ Email notification result: true
[useTaskAssignees] ========== ADD ASSIGNEE END (success) ==========

[AssigneeCell.toggleAssignee] ✓ Assignee added successfully (email should be sent if new)
[AssigneeCell.toggleAssignee] ========== END (success) ==========
```

### Diferença Chave:

**ANTES** (com bug):
```
[useTaskAssignees] ⊘ User already assigned, skipping  ← FALSO POSITIVO!
[useTaskAssignees] ========== ADD ASSIGNEE END (skipped) ==========
```

**AGORA** (corrigido):
```
[useTaskAssignees] Database check result: { existsInDatabase: false, ... }
[useTaskAssignees] ✓ User NOT in database, proceeding with insert
[useTaskAssignees] → Inserting into task_assignees...
[useTaskAssignees] ✓ Assignee added to database
[useTaskAssignees] → Attempting to send email notification...
[useTaskAssignees] ✓ Email notification result: true
```

## VALIDAÇÃO

Para confirmar que está funcionando:

1. ✅ Console mostra "Database check result: { existsInDatabase: false }"
2. ✅ Console mostra "User NOT in database, proceeding with insert"
3. ✅ Console mostra "Inserting into task_assignees..."
4. ✅ Console mostra "Assignee added to database"
5. ✅ Console mostra "Attempting to send email notification..."
6. ✅ Console mostra "Email notification result: true"
7. ✅ Terminal do servidor mostra "Email sent successfully!"
8. ✅ Email chega na caixa de entrada

## CASOS ESPECIAIS

### Se o usuário JÁ está atribuído de verdade:

```
[useTaskAssignees] Database check result: { existsInDatabase: true, ... }
[useTaskAssignees] ⊘ User already assigned in database, skipping insert
[useTaskAssignees] ⚠ Note: This might indicate duplicate call or race condition
[useTaskAssignees] ========== ADD ASSIGNEE END (skipped - already in DB) ==========
```

Isso é esperado e correto - significa que o usuário realmente já está no banco.

### Se houver erro de rede ou banco:

```
[useTaskAssignees] ✗ Error checking existing assignment: <error>
[useTaskAssignees] ========== ADD ASSIGNEE END (error) ==========
[AssigneeCell.toggleAssignee] ✗ Error: <error>
[AssigneeCell.toggleAssignee] ✓ Reverted to previous state
```

O estado local será revertido automaticamente.

## RESUMO TÉCNICO

### Problema:
- Update otimista modificava estado local antes de verificação
- Verificação usava estado local (stale) ao invés do banco
- Falso positivo "already assigned" impedia insert e email

### Solução:
- Verificação agora consulta o banco diretamente com `.maybeSingle()`
- Estado local é ignorado na verificação
- Insert só é pulado se realmente existir no banco
- Email é enviado sempre que insert for bem-sucedido

### Benefícios:
- Elimina race condition entre update otimista e verificação
- Garante que email seja enviado para novos responsáveis
- Mantém idempotência (não duplica se já existir no banco)
- Logs claros para debug de qualquer problema futuro
