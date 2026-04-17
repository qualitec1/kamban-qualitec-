import { ref } from '#imports'
import type { Tables } from '#shared/types/database'

export type TaskDetail = Tables<'tasks'>

export function useTaskDetail() {
  const supabase = useNuxtApp().$supabase as any
  
  // Criar refs locais para cada instância
  const task = ref<TaskDetail | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchTask(taskId: string) {
    console.log('[useTaskDetail] Fetching task:', taskId)
    loading.value = true
    error.value = null
    task.value = null // Limpar estado anterior
    
    try {
      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single()
      
      if (fetchError) {
        console.error('[useTaskDetail] Fetch error:', fetchError)
        throw fetchError
      }
      
      task.value = data as TaskDetail
      console.log('[useTaskDetail] Task loaded:', data)
    } catch (e: any) {
      console.error('[useTaskDetail] Error:', e)
      error.value = e.message ?? 'Erro ao carregar tarefa'
    } finally {
      loading.value = false
    }
  }

  async function updateTask(taskId: string, patch: Partial<TaskDetail>) {
    const { error: updateError } = await supabase
      .from('tasks')
      .update(patch)
      .eq('id', taskId)
    if (updateError) throw updateError
    if (task.value) Object.assign(task.value, patch)
  }

  return { task, loading, error, fetchTask, updateTask }
}
