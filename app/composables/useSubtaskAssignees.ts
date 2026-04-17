import { ref } from '#imports'
import type { Database } from '#shared/types/database'
import type { AssigneeProfile } from '#shared/types/assignee'
import { createClient } from '@supabase/supabase-js'

type SupabaseClient = ReturnType<typeof createClient<Database>>

export function useSubtaskAssignees(subtaskId: string) {
  function getClient(): SupabaseClient {
    if (import.meta.server) throw new Error('[useSubtaskAssignees] SSR not supported')
    return useNuxtApp().$supabase as SupabaseClient
  }

  const assignees = ref<AssigneeProfile[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // Flag para evitar chamadas simultâneas
  let fetchPromise: Promise<void> | null = null

  async function fetchAssignees(id: string = subtaskId) {
    // Se já está carregando, retorna a promise existente
    if (fetchPromise) {
      return fetchPromise
    }
    
    loading.value = true
    error.value = null
    
    fetchPromise = (async () => {
      try {
        const supabase = getClient() as any
        const { data, error: fetchError } = await supabase
          .from('subtask_assignees')
          .select(`
            user_id,
            profiles:user_id (
              id,
              full_name,
              email,
              avatar_url
            )
          `)
          .eq('subtask_id', id)

        if (fetchError) throw fetchError

        assignees.value = (data ?? [])
          .map((row: any) => row.profiles)
          .filter(Boolean) as AssigneeProfile[]
      } catch (e: any) {
        error.value = e.message
        assignees.value = []
      } finally {
        loading.value = false
        fetchPromise = null
      }
    })()
    
    return fetchPromise
  }

  async function addAssignee(userId: string, id: string = subtaskId) {
    try {
      const supabase = getClient() as any
      const { error: insertError } = await supabase
        .from('subtask_assignees')
        .insert({ subtask_id: id, user_id: userId })

      if (insertError) throw insertError

      await fetchAssignees(id)
      return true
    } catch (e: any) {
      error.value = e.message ?? 'Unknown error'
      return false
    }
  }

  async function removeAssignee(userId: string, id: string = subtaskId) {
    try {
      const supabase = getClient() as any
      const { error: deleteError } = await supabase
        .from('subtask_assignees')
        .delete()
        .eq('subtask_id', id)
        .eq('user_id', userId)

      if (deleteError) throw deleteError

      await fetchAssignees(id)
      return true
    } catch (e: any) {
      error.value = e.message ?? 'Unknown error'
      return false
    }
  }

  return {
    assignees,
    loading,
    error,
    fetchAssignees,
    addAssignee,
    removeAssignee
  }
}
