# Implementação do Supabase Realtime

## Resumo

Implementado sistema de sincronização automática usando **Supabase Realtime + Optimistic Updates** para substituir o sistema anterior de eventos customizados que era instável.

## Problema Anterior

- Sistema baseado em eventos customizados (`window.dispatchEvent`) + recarregar cache completo
- Comportamento instável: às vezes parava de funcionar
- Algumas tarefas atualizavam, outras não
- Após aplicar filtros, dados voltavam zerados ("Sem status", "Sem prioridade")

## Solução Implementada

### 1. Supabase Realtime Subscription (`useBoardData.ts`)

```typescript
const channel = supabase
  .channel(`board-${boardId}-tasks`)
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'tasks',
      filter: `board_id=eq.${boardId}`
    },
    (payload: any) => {
      // Atualizar apenas a tarefa específica no cache
      const updatedTask = payload.new
      const groupId = updatedTask.group_id
      
      if (tasksByGroup.value[groupId]) {
        const index = tasksByGroup.value[groupId].findIndex(t => t.id === updatedTask.id)
        if (index !== -1) {
          tasksByGroup.value[groupId][index] = {
            ...updatedTask,
            assignees: existingTask.assignees || []
          }
          saveToCache()
        }
      }
    }
  )
  .subscribe()
```

**Vantagens:**
- ✅ Sincronização automática entre usuários
- ✅ Atualiza apenas a tarefa modificada (não recarrega tudo)
- ✅ Mais confiável que eventos customizados
- ✅ Funciona mesmo com filtros aplicados

### 2. Optimistic Updates (`StatusCell.vue` e `PriorityCell.vue`)

```typescript
async function select(statusId: string | null) {
  // Guardar valor anterior para rollback
  const previousStatusId = optimisticStatusId.value
  
  // 1. Atualização otimista - UI instantânea
  optimisticStatusId.value = statusId
  emit('update:statusId', statusId)
  
  // 2. Salvar no banco em background
  try {
    const { error } = await supabase
      .from('tasks')
      .update({ status_id: statusId })
      .eq('id', props.taskId)
    
    if (error) throw error
    
    // 3. Supabase Realtime vai sincronizar automaticamente
  } catch (error) {
    // 4. Rollback em caso de erro
    optimisticStatusId.value = previousStatusId
    emit('update:statusId', previousStatusId)
  }
}
```

**Vantagens:**
- ✅ UI responde instantaneamente (sem delay)
- ✅ Rollback automático em caso de erro
- ✅ Sincronização em background via Realtime

### 3. Estado Reativo com `watch` + `immediate`

```typescript
// Estado local para atualização otimista
const optimisticStatusId = ref<string | null>(props.statusId)

// Atualizar quando a prop mudar (sincronização com banco)
watch(() => props.statusId, (newValue) => {
  optimisticStatusId.value = newValue
}, { immediate: true })
```

**Vantagens:**
- ✅ Sincroniza com props quando dados vêm do banco
- ✅ Funciona corretamente após aplicar/remover filtros
- ✅ Vue não reutiliza componentes com dados antigos

## Arquivos Modificados

1. **`app/composables/useBoardData.ts`**
   - Adicionado Supabase Realtime subscription
   - Atualização granular de tarefas no cache

2. **`app/components/StatusCell.vue`**
   - Implementado optimistic updates
   - Adicionado `watch` com `immediate: true`
   - Removido uso de `updateTaskStatus` (agora usa `supabase` direto)

3. **`app/components/PriorityCell.vue`**
   - Implementado optimistic updates
   - Adicionado `watch` com `immediate: true`
   - Removido uso de `updateTaskPriority` (agora usa `supabase` direto)

4. **`app/composables/useTaskStatuses.ts`**
   - Mantém função `updateTaskStatus` para compatibilidade
   - Não é mais usada pelos componentes (usam `supabase` direto)

5. **`app/composables/useTaskPriorities.ts`**
   - Mantém função `updateTaskPriority` para compatibilidade
   - Não é mais usada pelos componentes (usam `supabase` direto)

## Como Funciona

### Fluxo de Atualização

1. **Usuário clica em um status/prioridade**
   - UI atualiza instantaneamente (optimistic update)
   - Requisição enviada ao Supabase em background

2. **Supabase processa a atualização**
   - Banco de dados é atualizado
   - Supabase Realtime dispara evento `UPDATE`

3. **Realtime atualiza o cache local**
   - Apenas a tarefa modificada é atualizada
   - Todos os usuários conectados recebem a atualização

4. **Em caso de erro**
   - Rollback automático para valor anterior
   - Usuário vê o valor correto

### Sincronização com Filtros

- Filtros funcionam sobre `tasksByGroup` que é atualizado pelo Realtime
- Quando filtros são aplicados/removidos, componentes recebem novas props
- `watch` com `immediate: true` garante que estado local sincroniza com props
- Não há mais problema de dados zerados após filtrar

## Próximos Passos (Opcional)

1. **Aplicar mesma lógica para outros campos:**
   - `TimelineCell.vue` (datas)
   - `BudgetCell.vue` (orçamento)
   - `NotesCell.vue` (notas)
   - `AssigneeCell.vue` (responsáveis)

2. **Remover sistema de eventos customizados:**
   - Remover `window.dispatchEvent` do `TimelineCell.vue`
   - Remover listeners de eventos customizados

3. **Adicionar indicadores visuais:**
   - Mostrar spinner durante salvamento
   - Mostrar ícone de erro se falhar
   - Toast de confirmação (opcional)

## Testes Recomendados

1. ✅ Alterar status/prioridade → deve atualizar instantaneamente
2. ✅ Aplicar filtros → dados devem permanecer corretos
3. ✅ Remover filtros → dados devem permanecer corretos
4. ✅ Abrir em duas abas → alteração em uma deve refletir na outra
5. ✅ Desconectar internet → deve fazer rollback em caso de erro

## Observações

- **Performance:** Realtime atualiza apenas tarefas modificadas (não recarrega tudo)
- **Confiabilidade:** Supabase Realtime é mais estável que eventos customizados
- **UX:** Optimistic updates garantem UI instantânea
- **Sincronização:** Funciona automaticamente entre múltiplos usuários
