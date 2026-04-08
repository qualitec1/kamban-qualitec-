import { ref } from 'vue'
import type { Tables } from '~/shared/types/database'

type Subtask = Tables<'subtasks'>

export function useSubtasks(taskId: string) {
  const supabase = useNuxtApp().$supabase as any
  
  const subtasks = ref<Subtask[]>([])
  const loading = ref(false)
  const creating = ref(false)
  const error = ref<string | null>(null)

  async function fetchSubtasks() {
    loading.value = true
    error.value = null
    
    try {
      const { data, error: fetchError } = await supabase
        .from('subtasks')
        .select('*')
        .eq('task_id', taskId)
        .order('sort_order', { ascending: true })
      
      if (fetchError) throw fetchError
      subtasks.value = data || []
    } catch (err: any) {
      console.error('Erro ao buscar subtarefas:', err)
      error.value = err.message
      subtasks.value = []
    } finally {
      loading.value = false
    }
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
    
    try {
      const { error: updateError } = await supabase
        .from('subtasks')
        .update({ is_done: isDone })
        .eq('id', subtaskId)
      
      if (updateError) throw updateError
    } catch (err: any) {
      console.error('Erro ao atualizar subtarefa:', err)
      // Reverter otimismo
      subtasks.value[index].is_done = oldValue
      error.value = err.message
    }
  }

  async function updateSubtask(subtaskId: string, updates: Partial<Subtask>) {
    const index = subtasks.value.findIndex(s => s.id === subtaskId)
    if (index === -1) return
    
    const oldValue = { ...subtasks.value[index] }
    
    // Atualização otimista
    Object.assign(subtasks.value[index], updates)
    
    try {
      const { error: updateError } = await supabase
        .from('subtasks')
        .update(updates)
        .eq('id', subtaskId)
      
      if (updateError) throw updateError
    } catch (err: any) {
      console.error('Erro ao atualizar subtarefa:', err)
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
