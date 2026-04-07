import { ref } from '#imports'

export interface TaskAttachmentCount {
  taskId: string
  count: number
}

export function useTaskAttachments(taskId: string) {
  const supabase = useNuxtApp().$supabase as any
  const count = ref<number>(0)
  const loading = ref(false)

  async function fetchCount() {
    loading.value = true
    try {
      const { count: total, error } = await supabase
        .from('task_attachments')
        .select('id', { count: 'exact', head: true })
        .eq('task_id', taskId)

      if (!error) count.value = total ?? 0
    } catch {
      count.value = 0
    } finally {
      loading.value = false
    }
  }

  return { count, loading, fetchCount }
}
