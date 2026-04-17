import { ref } from 'vue'
import type { Tables } from '~/shared/types/database'

type Subtask = Tables<'subtasks'>

export function useSubtasks(taskId: string) {
  const supabase = useNuxtApp().$supabase as any
  
  const subtasks = ref<Subtask[]>([])
  const loading = ref(false)
  const creating = ref(false)
  const error = ref<string | null>(null)
  
  // Flag para evitar chamadas simultâneas
  let fetchPromise: Promise<void> | null = null

  async function fetchSubtasks() {
    // Se já está carregando, retorna a promise existente
    if (fetchPromise) {
      return fetchPromise
    }
    
    loading.value = true
    error.value = null
    
    fetchPromise = (async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('subtasks')
          .select(`
            *,
            subtask_assignees (
              user_id,
              profiles:user_id (
                id,
                full_name,
                email,
                avatar_url
              )
            )
          `)
          .eq('task_id', taskId)
          .order('sort_order', { ascending: true })
        
        if (fetchError) throw fetchError
        
        // Processar assignees
        const processedSubtasks = (data || []).map((subtask: any) => {
          const assignees = (subtask.subtask_assignees || [])
            .map((sa: any) => sa.profiles)
            .filter(Boolean)
          
          return {
            ...subtask,
            assignees
          }
        })
        
        subtasks.value = processedSubtasks
      } catch (err: any) {
        console.error('Erro ao buscar subtarefas:', err)
        error.value = err.message
        subtasks.value = []
      } finally {
        loading.value = false
        fetchPromise = null
      }
    })()
    
    return fetchPromise
  }

  async function createSubtask(title: string) {
    if (!title.trim()) return
    
    creating.value = true
    error.value = null
    
    // Calcular próximo sort_order
    const maxOrder = subtasks.value.length > 0
      ? Math.max(...subtasks.value.map(s => s.sort_order))
      : -1
    
    const newSubtask: Partial<Subtask> = {
      task_id: taskId,
      title: title.trim(),
      is_done: false,
      sort_order: maxOrder + 1,
    }
    
    try {
      const { data, error: insertError } = await supabase
        .from('subtasks')
        .insert(newSubtask)
        .select()
        .single()
      
      if (insertError) throw insertError
      
      // Atualização otimista
      subtasks.value.push(data)
      
      // Registrar atividade de criação
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase
            .from('activity_logs')
            .insert({
              actor_id: user.id,
              entity_type: 'subtask',
              entity_id: data.id,
              action: 'created',
              meta_json: { title: title.trim() }
            })
        }
      } catch (logError) {
        console.error('Erro ao registrar log de criação:', logError)
      }
    } catch (err: any) {
      console.error('Erro ao criar subtarefa:', err)
      error.value = err.message
    } finally {
      creating.value = false
    }
  }

  async function toggleSubtask(subtaskId: string, isDone: boolean) {
    // Atualização otimista
    const index = subtasks.value.findIndex(s => s.id === subtaskId)
    if (index === -1) return
    
    const oldValue = subtasks.value[index].is_done
    subtasks.value[index].is_done = isDone
    
    console.log('[toggleSubtask] Toggling subtask:', { subtaskId, isDone })
    
    try {
      const { data, error: updateError } = await supabase
        .from('subtasks')
        .update({ is_done: isDone })
        .eq('id', subtaskId)
        .select()
        .single()
      
      if (updateError) {
        console.error('[toggleSubtask] Database error:', updateError)
        throw updateError
      }
      
      console.log('[toggleSubtask] Database response:', data)
      
      // Atualizar com dados do servidor
      if (data) {
        subtasks.value[index] = data
      }
    } catch (err: any) {
      console.error('[toggleSubtask] Error toggling subtask:', err)
      // Reverter otimismo
      subtasks.value[index].is_done = oldValue
      error.value = err.message
    }
  }

  async function updateSubtask(subtaskId: string, updates: Partial<Subtask>) {
    const index = subtasks.value.findIndex(s => s.id === subtaskId)
    if (index === -1) {
      console.error('[updateSubtask] Subtask not found:', subtaskId)
      return
    }
    
    const oldValue = { ...subtasks.value[index] }
    
    console.log('[updateSubtask] Updating subtask:', {
      subtaskId,
      updates,
      currentValue: subtasks.value[index]
    })
    
    // Atualização otimista
    Object.assign(subtasks.value[index], updates)
    
    try {
      const { data, error: updateError } = await supabase
        .from('subtasks')
        .update(updates)
        .eq('id', subtaskId)
        .select()
        .single()
      
      if (updateError) {
        console.error('[updateSubtask] Database error:', updateError)
        throw updateError
      }
      
      console.log('[updateSubtask] Database response:', data)
      
      // Atualizar com dados do servidor
      if (data) {
        subtasks.value[index] = data
      }
    } catch (err: any) {
      console.error('[updateSubtask] Error updating subtask:', err)
      // Reverter otimismo
      subtasks.value[index] = oldValue
      error.value = err.message
    }
  }

  async function deleteSubtask(subtaskId: string) {
    const index = subtasks.value.findIndex(s => s.id === subtaskId)
    if (index === -1) return
    
    const removed = subtasks.value.splice(index, 1)[0]
    
    try {
      const { error: deleteError } = await supabase
        .from('subtasks')
        .delete()
        .eq('id', subtaskId)
      
      if (deleteError) throw deleteError
    } catch (err: any) {
      console.error('Erro ao excluir subtarefa:', err)
      // Reverter otimismo
      subtasks.value.splice(index, 0, removed)
      error.value = err.message
    }
  }

  async function reorderSubtasks(reorderedList: Subtask[]) {
    const oldList = [...subtasks.value]
    
    // Atualização otimista
    subtasks.value = reorderedList.map((subtask, index) => ({
      ...subtask,
      sort_order: index
    }))
    
    try {
      // Atualizar sort_order de todas as subtarefas afetadas
      const updates = subtasks.value.map((subtask, index) => ({
        id: subtask.id,
        sort_order: index
      }))
      
      // Fazer updates em paralelo
      const promises = updates.map(({ id, sort_order }) =>
        supabase
          .from('subtasks')
          .update({ sort_order })
          .eq('id', id)
      )
      
      const results = await Promise.all(promises)
      
      // Verificar se algum update falhou
      const errors = results.filter(r => r.error)
      if (errors.length > 0) {
        throw new Error('Erro ao reordenar subtarefas')
      }
    } catch (err: any) {
      console.error('Erro ao reordenar subtarefas:', err)
      // Reverter otimismo
      subtasks.value = oldList
      error.value = err.message
    }
  }

  return {
    subtasks,
    loading,
    creating,
    error,
    fetchSubtasks,
    createSubtask,
    toggleSubtask,
    updateSubtask,
    deleteSubtask,
    reorderSubtasks,
  }
}
