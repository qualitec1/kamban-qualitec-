import { ref } from '#imports'
import type { Tables } from '#shared/types/database'

export type TaskPriority = Tables<'task_priorities'>

export function useTaskPriorities(boardId: string) {
  const supabase = useNuxtApp().$supabase as any

  const priorities = ref<TaskPriority[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchPriorities() {
    loading.value = true
    error.value = null
    try {
      const { data, error: fetchError } = await supabase
        .from('task_priorities')
        .select('id, board_id, name, color, sort_order')
        .eq('board_id', boardId)
        .order('sort_order', { ascending: true })

      if (fetchError) throw fetchError
      priorities.value = data ?? []
    } catch (e: any) {
      error.value = e.message ?? 'Unknown error'
      priorities.value = []
    } finally {
      loading.value = false
    }
  }

  async function updateTaskPriority(taskId: string, priorityId: string | null) {
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ priority_id: priorityId })
      .eq('id', taskId)
    if (updateError) throw updateError
  }

  return { priorities, loading, error, fetchPriorities, updateTaskPriority }
}
