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
  
  // Flag para evitar chamadas simultâneas
  let fetchPromise: Promise<void> | null = null

  async function fetchAssignees(id: string = taskId) {
    // Se já está carregando, retorna a promise existente
    if (fetchPromise) {
      return fetchPromise
    }
    
    loading.value = true
    error.value = null
    
    fetchPromise = (async () => {
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
        error.value = e.message
        assignees.value = []
      } finally {
        loading.value = false
        fetchPromise = null
      }
    })()
    
    return fetchPromise
  }

  async function addAssignee(userId: string, id: string = taskId) {
    try {
      console.log('[useTaskAssignees] Adding assignee:', { taskId: id, userId })
      
      const supabase = getClient()
      const { error: insertError } = await supabase
        .from('task_assignees')
        .insert({ task_id: id, user_id: userId })

      if (insertError) throw insertError

      console.log('[useTaskAssignees] Assignee added successfully, fetching updated list...')
      await fetchAssignees(id)
      
      // Enviar email de notificação automaticamente
      console.log('[useTaskAssignees] Attempting to send email notification...')
      try {
        const { sendTaskAssignedEmail } = useEmailNotifications()
        const emailSent = await sendTaskAssignedEmail(id, userId)
        console.log('[useTaskAssignees] Email notification result:', emailSent)
      } catch (emailError) {
        console.error('[useTaskAssignees] Failed to send assignment email:', emailError)
        // Não falhar a operação se o email não for enviado
      }
      
      return true
    } catch (e: any) {
      console.error('[useTaskAssignees] Error adding assignee:', e)
      error.value = e.message ?? 'Unknown error'
      return false
    }
  }

  async function removeAssignee(userId: string, id: string = taskId) {
    try {
      const supabase = getClient()
      const { error: deleteError } = await supabase
        .from('task_assignees')
        .delete()
        .eq('task_id', id)
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
