import { ref } from '#imports'
import type { Database } from '#shared/types/database'
import type { AssigneeProfile } from '#shared/types/assignee'
import { createClient } from '@supabase/supabase-js'

type SupabaseClient = ReturnType<typeof createClient<Database>>

export function useTaskAssignees(taskId: string) {
  function getClient(): SupabaseClient {
    if (import.meta.server) throw new Error('[useTaskAssignees] SSR not supported')
    return useNuxtApp().$supabase as SupabaseClient
  }

  const assignees = ref<AssigneeProfile[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAssignees(id: string = taskId) {
    loading.value = true
    error.value = null
    try {
      const supabase = getClient()
      const { data, error: fetchError } = await supabase
        .from('task_assignees')
        .select(`
          user_id,
          profiles:user_id (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('task_id', id)

      if (fetchError) throw fetchError

      assignees.value = (data ?? [])
        .map((row: any) => row.profiles)
        .filter(Boolean) as AssigneeProfile[]
    } catch (e: any) {
      error.value = e.message ?? 'Unknown error'
      assignees.value = []
    } finally {
      loading.value = false
    }
  }

  return {
    assignees,
    loading,
    error,
    fetchAssignees
  }
}
