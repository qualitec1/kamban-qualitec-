import { ref } from '#imports'
import type { Tables } from '#shared/types/database'

export type TaskStatus = Tables<'task_statuses'>

export function useTaskStatuses(boardId: string) {
  const supabase = useNuxtApp().$supabase as any

  const statuses = ref<TaskStatus[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchStatuses() {
    loading.value = true
    error.value = null
    try {
      const { data, error: fetchError } = await supabase
        .from('task_statuses')
        .select('id, board_id, name, color, sort_order')
        .eq('board_id', boardId)
        .order('sort_order', { ascending: true })

      if (fetchError) throw fetchError
      statuses.value = data ?? []
    } catch (e: any) {
      error.value = e.message ?? 'Unknown error'
      statuses.value = []
    } finally {
      loading.value = false
    }
  }

  async function updateTaskStatus(taskId: string, statusId: string | null) {
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ status_id: statusId })
      .eq('id', taskId)
    if (updateError) throw updateError
  }

  return { statuses, loading, error, fetchStatuses, updateTaskStatus }
}
